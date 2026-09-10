const Services = {
  init() {
    this.render();
  },

  render() {
    const services = Storage.getServices();
    const container = document.getElementById('servicesListContainer');
    if (!services.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-tools"></i>
          <h5>No services added</h5>
          <p>Add services to quickly create repair tasks.</p>
          <button class="btn btn-primary" onclick="Services.showAddModal()"><i class="bi bi-plus-lg me-1"></i>Add Service</button>
        </div>`;
      return;
    }

    if (window.innerWidth < 768) {
      container.innerHTML = services.map(s => `
        <div class="task-card card mb-2">
          <div class="card-body p-3 d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-0">${s.name}</h6>
              <small class="text-muted">Default: ${App.formatCurrency(s.defaultPrice)}</small>
            </div>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary" onclick="Services.showEditModal('${s.id}')"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-outline-danger" onclick="Services.deleteService('${s.id}')"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>`).join('');
    } else {
      container.innerHTML = `
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead><tr><th>Service Name</th><th>Default Price</th><th>Actions</th></tr></thead>
            <tbody>
              ${services.map(s => `
                <tr>
                  <td class="fw-bold">${s.name}</td>
                  <td>${App.formatCurrency(s.defaultPrice)}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-secondary" onclick="Services.showEditModal('${s.id}')"><i class="bi bi-pencil me-1"></i>Edit</button>
                      <button class="btn btn-outline-danger" onclick="Services.deleteService('${s.id}')"><i class="bi bi-trash me-1"></i>Delete</button>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }
  },

  showAddModal() {
    document.getElementById('serviceModalLabel').textContent = 'Add Service';
    document.getElementById('serviceName').value = '';
    document.getElementById('servicePrice').value = '';
    document.getElementById('serviceEditId').value = '';
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
  },

  showEditModal(id) {
    const svc = Storage.getServices().find(s => s.id === id);
    if (!svc) return;
    document.getElementById('serviceModalLabel').textContent = 'Edit Service';
    document.getElementById('serviceName').value = svc.name;
    document.getElementById('servicePrice').value = svc.defaultPrice;
    document.getElementById('serviceEditId').value = id;
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
  },

  saveService() {
    const name = document.getElementById('serviceName').value.trim();
    const price = parseFloat(document.getElementById('servicePrice').value);
    const editId = document.getElementById('serviceEditId').value;

    if (!name) { App.showToast('Service name is required', 'error'); return; }
    if (isNaN(price) || price < 0) { App.showToast('Invalid price', 'error'); return; }

    if (editId) {
      Storage.updateService(editId, { name, defaultPrice: price });
      App.showToast('Service updated');
    } else {
      Storage.addService({ name, defaultPrice: price });
      App.showToast('Service added');
    }
    bootstrap.Modal.getInstance(document.getElementById('serviceModal')).hide();
    this.render();
  },

  deleteService(id) {
    App.showConfirm('Delete this service?', (yes) => {
      if (!yes) return;
      Storage.deleteService(id);
      App.showToast('Service deleted');
      this.render();
    });
  }
};
