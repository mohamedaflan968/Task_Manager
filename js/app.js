const App = {
  currentPage() {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/') || path.endsWith('fixtask')) return 'landing';
    return path.split('/').pop().replace('.html', '');
  },

  formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  },

  formatCurrency(amount) {
    const settings = Storage.getSettings();
    const val = parseFloat(amount) || 0;
    return settings.currency + ' ' + val.toLocaleString('en-US');
  },

  statusBadge(status) {
    const map = {
      'Pending': 'bg-warning text-dark',
      'In Progress': 'bg-info text-white',
      'Completed': 'bg-success text-white'
    };
    return `<span class="badge ${map[status] || 'bg-secondary'}">${status}</span>`;
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const id = 'toast-' + Date.now();
    const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-x-circle-fill' : 'bi-info-circle-fill';
    const bg = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
    const toastEl = document.createElement('div');
    toastEl.id = id;
    toastEl.className = `toast align-items-center text-white ${bg} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body"><i class="bi ${icon} me-2"></i>${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;
    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  },

  showConfirm(message, callback) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return callback(false);
    document.getElementById('confirmModalBody').textContent = message;
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    const yesBtn = document.getElementById('confirmModalYes');
    const handler = () => {
      bsModal.hide();
      callback(true);
      yesBtn.removeEventListener('click', handler);
    };
    yesBtn.addEventListener('click', handler);
    modal.addEventListener('hidden.bs.modal', () => {
      yesBtn.removeEventListener('click', handler);
    }, { once: true });
  },

  renderSidebar() {
    const page = this.currentPage();
    const links = [
      { href: 'dashboard.html', icon: 'bi-grid-1x2-fill', label: 'Dashboard', id: 'dashboard' },
      { href: 'tasks.html', icon: 'bi-list-task', label: 'Tasks', id: 'tasks' },
      { href: 'customers.html', icon: 'bi-people-fill', label: 'Customers', id: 'customers' },
      { href: 'services.html', icon: 'bi-tools', label: 'Services', id: 'services' },
      { href: 'reports.html', icon: 'bi-graph-up', label: 'Reports', id: 'reports' },
      { href: 'settings.html', icon: 'bi-gear-fill', label: 'Settings', id: 'settings' }
    ];
    const settings = Storage.getSettings();

    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.innerHTML = `
        <div class="sidebar-brand">
          <img src="assets/icons/logo.svg" alt="FixTask" class="sidebar-logo">
          <span>${settings.shopName || 'FixTask'}</span>
        </div>
        <ul class="sidebar-nav">
          ${links.map(l => `
            <li>
              <a href="${l.href}" class="${page === l.id ? 'active' : ''}">
                <i class="bi ${l.icon}"></i><span>${l.label}</span>
              </a>
            </li>`).join('')}
        </ul>
        <div class="sidebar-footer">
          <div class="developer-credit">
            <small>Developed By Mohamed Aflan</small><br>
            <small>Contact - 0760562969</small>
          </div>
        </div>`;
    }

    const topbar = document.getElementById('app-topbar');
    if (topbar) {
      const title = links.find(l => l.id === page)?.label || 'FixTask';
      topbar.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-link sidebar-toggle d-lg-none p-0" id="sidebarToggle">
            <i class="bi bi-list fs-4"></i>
          </button>
          <img src="assets/icons/logo.svg" alt="FixTask" class="topbar-logo d-lg-none">
          <h5 class="mb-0 d-none d-lg-block">${title}</h5>
        </div>
        <div class="d-flex align-items-center gap-2">
          <a href="tasks.html?action=new" class="btn btn-primary btn-sm">
            <i class="bi bi-plus-lg me-1"></i><span class="d-none d-sm-inline">New Task</span>
          </a>
        </div>`;
    }
  },

  renderMobileNav() {
    const page = this.currentPage();
    const navs = [
      { href: 'dashboard.html', icon: 'bi-grid-1x2-fill', label: 'Home', id: 'dashboard' },
      { href: 'tasks.html', icon: 'bi-list-task', label: 'Tasks', id: 'tasks' },
      { href: 'tasks.html?action=new', icon: 'bi-plus-circle-fill', label: 'New', id: 'new' },
      { href: 'customers.html', icon: 'bi-people-fill', label: 'Customers', id: 'customers' },
      { href: 'settings.html', icon: 'bi-gear-fill', label: 'More', id: 'settings' }
    ];
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
      mobileNav.innerHTML = navs.map(n => `
        <a href="${n.href}" class="mobile-nav-item ${page === n.id ? 'active' : ''}">
          <i class="bi ${n.icon}"></i>
          <span>${n.label}</span>
        </a>`).join('');
    }
  },

  initLayout() {
    if (this.currentPage() === 'landing') return;
    this.renderSidebar();
    this.renderMobileNav();
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('app-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('show'));
      document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('show') && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
          sidebar.classList.remove('show');
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.initLayout());
