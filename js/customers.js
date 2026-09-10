const Customers = {
  init() {
    Storage.rebuildCustomers();
    this.render();
  },

  render() {
    const customers = Storage.getCustomers();
    const search = document.getElementById('custSearch')?.value?.toLowerCase() || '';
    let filtered = customers;
    if (search) filtered = filtered.filter(c =>
      (c.name || '').toLowerCase().includes(search) ||
      (c.phone || '').includes(search)
    );

    const container = document.getElementById('customerListContainer');
    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-people"></i>
          <h5>No customers found</h5>
          <p>Customers are automatically added when you create tasks.</p>
          <a href="tasks.html?action=new" class="btn btn-primary"><i class="bi bi-plus-lg me-1"></i>Create Task</a>
        </div>`;
      return;
    }

    if (window.innerWidth < 768) {
      container.innerHTML = filtered.map(c => `
        <div class="task-card card mb-2">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="mb-0">${c.name}</h6>
                <small class="text-muted">${c.phone}</small>
              </div>
              <span class="badge bg-primary">${c.tasks} task${c.tasks !== 1 ? 's' : ''}</span>
            </div>
            <div class="mt-2">
              <small class="text-muted">Total Spent: <strong>${App.formatCurrency(c.totalSpent)}</strong></small><br>
              <small class="text-muted">Last Task: ${App.formatDate(c.lastTaskDate)}</small>
            </div>
            <button class="btn btn-outline-primary btn-sm mt-2" onclick="Customers.showCustomerTasks('${c.phone}')">View Tasks</button>
          </div>
        </div>`).join('');
    } else {
      container.innerHTML = `
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead><tr>
              <th>Name</th><th>Phone</th><th>Tasks</th><th>Total Spent</th><th>Last Task</th><th>Action</th>
            </tr></thead>
            <tbody>
              ${filtered.map(c => `
                <tr>
                  <td class="fw-bold">${c.name}</td>
                  <td>${c.phone}</td>
                  <td><span class="badge bg-primary">${c.tasks}</span></td>
                  <td>${App.formatCurrency(c.totalSpent)}</td>
                  <td>${App.formatDate(c.lastTaskDate)}</td>
                  <td><button class="btn btn-outline-primary btn-sm" onclick="Customers.showCustomerTasks('${c.phone}')">View Tasks</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }
  },

  showCustomerTasks(phone) {
    const tasks = Storage.getTasks().filter(t => t.customerPhone === phone);
    const customer = tasks[0];
    if (!customer) return;

    document.getElementById('custDetailName').textContent = customer.customerName;
    document.getElementById('custDetailPhone').textContent = customer.customerPhone;

    const container = document.getElementById('custTaskList');
    if (!tasks.length) {
      container.innerHTML = '<p class="text-muted">No tasks found.</p>';
    } else {
      container.innerHTML = `
        <table class="table table-sm align-middle mb-0">
          <thead><tr><th>ID</th><th>Device</th><th>Service</th><th>Price</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td><a href="task-details.html?id=${t.id}" class="text-decoration-none">${t.id}</a></td>
                <td>${t.brand || ''} ${t.model || ''}</td>
                <td>${t.service || ''}</td>
                <td>${App.formatCurrency(t.price)}</td>
                <td>${App.statusBadge(t.status)}</td>
                <td>${App.formatDate(t.createdAt)}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    }

    const modal = new bootstrap.Modal(document.getElementById('customerDetailModal'));
    modal.show();
  }
};
