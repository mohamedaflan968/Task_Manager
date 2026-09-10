const Tasks = {
  currentFilter: 'All',

  init() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      this.showForm();
    } else if (params.get('id')) {
      this.showDetails(params.get('id'));
    } else {
      this.showList();
    }
  },

  showList() {
    document.getElementById('tasksListView').style.display = '';
    document.getElementById('tasksFormView').style.display = 'none';
    document.getElementById('tasksDetailView').style.display = 'none';
    this.renderList();
  },

  showForm(taskId) {
    document.getElementById('tasksListView').style.display = 'none';
    document.getElementById('tasksFormView').style.display = '';
    document.getElementById('tasksDetailView').style.display = 'none';
    this.renderForm(taskId);
  },

  showDetails(taskId) {
    document.getElementById('tasksListView').style.display = 'none';
    document.getElementById('tasksFormView').style.display = 'none';
    document.getElementById('tasksDetailView').style.display = '';
    this.renderDetails(taskId);
  },

  renderList() {
    const tasks = Storage.getTasks();
    const search = document.getElementById('taskSearch')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'All';
    const dateFilter = document.getElementById('dateFilter')?.value || '';

    let filtered = tasks;
    if (statusFilter !== 'All') filtered = filtered.filter(t => t.status === statusFilter);
    if (search) filtered = filtered.filter(t =>
      (t.customerName || '').toLowerCase().includes(search) ||
      (t.id || '').toLowerCase().includes(search) ||
      (t.brand || '').toLowerCase().includes(search) ||
      (t.model || '').toLowerCase().includes(search)
    );
    if (dateFilter) filtered = filtered.filter(t => t.createdAt && t.createdAt.startsWith(dateFilter));

    document.getElementById('taskCount').textContent = filtered.length;
    const container = document.getElementById('taskListContainer');
    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          <h5>No tasks found</h5>
          <p>Create your first repair task to start managing your shop.</p>
          <button class="btn btn-primary" onclick="Tasks.showForm()">
            <i class="bi bi-plus-lg me-1"></i>Create Task
          </button>
        </div>`;
      return;
    }

    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      container.innerHTML = filtered.map(t => `
        <div class="task-card card mb-2" onclick="window.location.href='task-details.html?id=${t.id}'">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span class="fw-bold text-primary">${t.id}</span>
                <span class="ms-2">${App.statusBadge(t.status)}</span>
              </div>
              <small class="text-muted">${App.formatDate(t.createdAt)}</small>
            </div>
            <div class="mb-1"><strong>${t.customerName || '-'}</strong> <span class="text-muted ms-1">${t.customerPhone || ''}</span></div>
            <div class="text-muted small">${t.brand || ''} ${t.model || ''} - ${t.service || ''}</div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="fw-bold">${App.formatCurrency(t.price)}</span>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary btn-sm" onclick="event.stopPropagation();window.location.href='task-details.html?id=${t.id}'"><i class="bi bi-eye"></i></button>
                <button class="btn btn-outline-secondary btn-sm" onclick="event.stopPropagation();Tasks.showForm('${t.id}')"><i class="bi bi-pencil"></i></button>
              </div>
            </div>
          </div>
        </div>`).join('');
    } else {
      container.innerHTML = `
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead><tr>
              <th>Task ID</th><th>Customer</th><th>Device</th><th>Service</th><th>Price</th><th>Status</th><th>Date</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${filtered.map(t => `
                <tr>
                  <td><a href="task-details.html?id=${t.id}" class="fw-bold text-primary text-decoration-none">${t.id}</a></td>
                  <td>${t.customerName || '-'}<br><small class="text-muted">${t.customerPhone || ''}</small></td>
                  <td>${t.brand || ''} ${t.model || ''}</td>
                  <td>${t.service || ''}</td>
                  <td class="fw-bold">${App.formatCurrency(t.price)}</td>
                  <td>${App.statusBadge(t.status)}</td>
                  <td><small>${App.formatDate(t.createdAt)}</small></td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <a href="task-details.html?id=${t.id}" class="btn btn-outline-primary" title="View"><i class="bi bi-eye"></i></a>
                      <button class="btn btn-outline-secondary" onclick="Tasks.showForm('${t.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
                      ${t.status === 'Pending' ? `<button class="btn btn-outline-info" onclick="Tasks.changeStatus('${t.id}','In Progress')" title="Start"><i class="bi bi-play-fill"></i></button>` : ''}
                      ${t.status === 'In Progress' ? `<button class="btn btn-outline-success" onclick="Tasks.completeTask('${t.id}')" title="Complete"><i class="bi bi-check-lg"></i></button>` : ''}
                      <button class="btn btn-outline-danger" onclick="Tasks.deleteTask('${t.id}')" title="Delete"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    // Update tab counts
    const allTasks = Storage.getTasks();
    document.getElementById('countAll').textContent = allTasks.length;
    document.getElementById('countPending').textContent = allTasks.filter(t => t.status === 'Pending').length;
    document.getElementById('countInProgress').textContent = allTasks.filter(t => t.status === 'In Progress').length;
    document.getElementById('countCompleted').textContent = allTasks.filter(t => t.status === 'Completed').length;
  },

  renderForm(editId) {
    const services = Storage.getServices();
    const isEdit = !!editId;
    const task = isEdit ? Storage.getTaskById(editId) : {};

    document.getElementById('formTitle').textContent = isEdit ? `Edit Task ${editId}` : 'New Repair Task';
    document.getElementById('taskIdDisplay').textContent = task.id || Storage.generateTaskId();

    document.getElementById('taskForm').innerHTML = `
      <input type="hidden" id="editTaskId" value="${editId || ''}">
      <h6 class="text-muted mb-3">Customer Information</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label class="form-label">Customer Name <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="custName" value="${task.customerName || ''}" required>
        </div>
        <div class="col-md-6">
          <label class="form-label">Phone Number <span class="text-danger">*</span></label>
          <input type="tel" class="form-control" id="custPhone" value="${task.customerPhone || ''}" required>
        </div>
      </div>
      <h6 class="text-muted mb-3">Device Information</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <label class="form-label">Brand <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="deviceBrand" value="${task.brand || ''}" required>
        </div>
        <div class="col-md-4">
          <label class="form-label">Model <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="deviceModel" value="${task.model || ''}" required>
        </div>
        <div class="col-md-4">
          <label class="form-label">IMEI / Device ID</label>
          <input type="text" class="form-control" id="deviceImei" value="${task.imei || ''}">
        </div>
      </div>
      <h6 class="text-muted mb-3">Service Details</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label class="form-label">Service <span class="text-danger">*</span></label>
          <select class="form-select" id="serviceSelect" onchange="Tasks.onServiceSelect()" required>
            <option value="">Select a service...</option>
            ${services.map(s => `<option value="${s.name}" data-price="${s.defaultPrice}" ${task.service === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Description</label>
          <input type="text" class="form-control" id="serviceDesc" value="${task.description || ''}">
        </div>
      </div>
      <h6 class="text-muted mb-3">Payment</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <label class="form-label">Price (Rs.) <span class="text-danger">*</span></label>
          <input type="number" class="form-control" id="taskPrice" value="${task.price || ''}" min="0" required oninput="Tasks.calcBalance()">
        </div>
        <div class="col-md-4">
          <label class="form-label">Advance Payment (Rs.)</label>
          <input type="number" class="form-control" id="taskAdvance" value="${task.advance || ''}" min="0" oninput="Tasks.calcBalance()">
        </div>
        <div class="col-md-4">
          <label class="form-label">Balance</label>
          <input type="text" class="form-control" id="taskBalance" readonly>
        </div>
      </div>
      <h6 class="text-muted mb-3">Additional Details</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label class="form-label">Expected Date</label>
          <input type="date" class="form-control" id="taskExpectedDate" value="${task.expectedDate || ''}">
        </div>
        <div class="col-md-6">
          <label class="form-label">Notes</label>
          <textarea class="form-control" id="taskNotes" rows="2">${task.notes || ''}</textarea>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button type="submit" class="btn btn-primary">
          <i class="bi bi-check-lg me-1"></i>${isEdit ? 'Update Task' : 'Create Task'}
        </button>
        <button type="button" class="btn btn-outline-secondary" onclick="Tasks.showList()">Cancel</button>
      </div>`;

    this.calcBalance();

    document.getElementById('taskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTask();
    });
  },

  onServiceSelect() {
    const sel = document.getElementById('serviceSelect');
    const opt = sel.options[sel.selectedIndex];
    if (opt && opt.dataset.price && !document.getElementById('taskPrice').value) {
      document.getElementById('taskPrice').value = opt.dataset.price;
      this.calcBalance();
    }
  },

  calcBalance() {
    const price = parseFloat(document.getElementById('taskPrice')?.value) || 0;
    const advance = parseFloat(document.getElementById('taskAdvance')?.value) || 0;
    const balance = price - advance;
    const el = document.getElementById('taskBalance');
    if (el) el.value = balance.toLocaleString('en-US');
  },

  validateForm() {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const brand = document.getElementById('deviceBrand').value.trim();
    const model = document.getElementById('deviceModel').value.trim();
    const service = document.getElementById('serviceSelect').value;
    const price = parseFloat(document.getElementById('taskPrice').value);
    const advance = parseFloat(document.getElementById('taskAdvance').value) || 0;

    if (!name) { App.showToast('Customer name is required', 'error'); return false; }
    if (!phone) { App.showToast('Phone number is required', 'error'); return false; }
    if (!brand) { App.showToast('Device brand is required', 'error'); return false; }
    if (!model) { App.showToast('Device model is required', 'error'); return false; }
    if (!service) { App.showToast('Service is required', 'error'); return false; }
    if (isNaN(price) || price < 0) { App.showToast('Invalid price', 'error'); return false; }
    if (advance < 0) { App.showToast('Advance cannot be negative', 'error'); return false; }
    if (advance > price) { App.showToast('Advance cannot exceed price', 'error'); return false; }
    return true;
  },

  saveTask() {
    if (!this.validateForm()) return;
    const editId = document.getElementById('editTaskId').value;
    const data = {
      customerName: document.getElementById('custName').value.trim(),
      customerPhone: document.getElementById('custPhone').value.trim(),
      brand: document.getElementById('deviceBrand').value.trim(),
      model: document.getElementById('deviceModel').value.trim(),
      imei: document.getElementById('deviceImei').value.trim(),
      service: document.getElementById('serviceSelect').value,
      description: document.getElementById('serviceDesc').value.trim(),
      price: parseFloat(document.getElementById('taskPrice').value) || 0,
      advance: parseFloat(document.getElementById('taskAdvance').value) || 0,
      expectedDate: document.getElementById('taskExpectedDate').value,
      notes: document.getElementById('taskNotes').value.trim()
    };

    if (editId) {
      Storage.updateTask(editId, data);
      App.showToast('Task updated successfully');
    } else {
      data.id = Storage.generateTaskId();
      Storage.createTask(data);
      App.showToast('Task created successfully');
    }
    window.location.href = 'tasks.html';
  },

  changeStatus(id, status) {
    Storage.updateTask(id, { status });
    App.showToast(`Task moved to ${status}`);
    this.renderList();
  },

  completeTask(id) {
    const task = Storage.getTaskById(id);
    if (!task) return;
    Storage.updateTask(id, { status: 'Completed' });
    App.showToast('Task completed!');
    Notifications.showCompletionModal(task);
    this.renderList();
  },

  deleteTask(id) {
    App.showConfirm('Are you sure you want to delete this task?', (yes) => {
      if (!yes) return;
      Storage.deleteTask(id);
      App.showToast('Task deleted');
      this.renderList();
    });
  },

  renderDetails(id) {
    const task = Storage.getTaskById(id);
    const container = document.getElementById('taskDetailContainer');
    if (!task) {
      container.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-circle"></i><h5>Task not found</h5><a href="tasks.html" class="btn btn-primary">Back to Tasks</a></div>`;
      return;
    }

    const detailItems = [
      { label: 'Customer', value: task.customerName || '-' },
      { label: 'Phone', value: task.customerPhone || '-' },
      { label: 'Device', value: `${task.brand || ''} ${task.model || ''}` },
      { label: 'IMEI', value: task.imei || '-' },
      { label: 'Service', value: task.service || '-' },
      { label: 'Description', value: task.description || '-' },
      { label: 'Price', value: `<span class="fw-bold fs-5">${App.formatCurrency(task.price)}</span>` },
      { label: 'Advance', value: App.formatCurrency(task.advance) },
      { label: 'Balance', value: `<span class="fw-bold text-danger">${App.formatCurrency(task.balance)}</span>` },
      { label: 'Status', value: App.statusBadge(task.status) },
      { label: 'Created', value: App.formatDateTime(task.createdAt) },
      { label: 'Expected', value: task.expectedDate ? App.formatDate(task.expectedDate) : '-' },
      { label: 'Notes', value: task.notes || '-' }
    ];

    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 class="mb-0"><i class="bi bi-file-earmark-text me-2"></i>TASK #${task.id}</h4>
        <span class="badge ${task.status === 'Pending' ? 'bg-warning text-dark' : task.status === 'In Progress' ? 'bg-info text-white' : 'bg-success text-white'} fs-6">${task.status}</span>
      </div>
      <div class="row g-3 mb-4">
        ${detailItems.map(item => `
          <div class="col-sm-6 col-lg-4">
            <div class="detail-label">${item.label}</div>
            <div class="detail-value">${item.value}</div>
          </div>`).join('')}
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <a href="tasks.html?action=new" class="btn btn-primary"><i class="bi bi-plus-lg me-1"></i>New Task</a>
        <button class="btn btn-outline-secondary" onclick="Tasks.showForm('${task.id}')"><i class="bi bi-pencil me-1"></i>Edit</button>
        ${task.status === 'Pending' ? `<button class="btn btn-info text-white" onclick="Tasks.changeStatusDetail('${task.id}','In Progress')"><i class="bi bi-play-fill me-1"></i>Start Repair</button>` : ''}
        ${task.status === 'In Progress' ? `<button class="btn btn-success" onclick="Tasks.completeDetail('${task.id}')"><i class="bi bi-check-lg me-1"></i>Mark Completed</button>` : ''}
        <button class="btn btn-outline-danger" onclick="Tasks.deleteDetail('${task.id}')"><i class="bi bi-trash me-1"></i>Delete</button>
      </div>`;
  },

  changeStatusDetail(id, status) {
    Storage.updateTask(id, { status });
    App.showToast(`Task moved to ${status}`);
    this.renderDetails(id);
  },

  completeDetail(id) {
    const task = Storage.getTaskById(id);
    if (!task) return;
    Storage.updateTask(id, { status: 'Completed' });
    App.showToast('Task completed!');
    Notifications.showCompletionModal(task);
    this.renderDetails(id);
  },

  deleteDetail(id) {
    App.showConfirm('Are you sure you want to delete this task?', (yes) => {
      if (!yes) return;
      Storage.deleteTask(id);
      App.showToast('Task deleted');
      window.location.href = 'tasks.html';
    });
  }
};
