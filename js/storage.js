const Storage = {
  KEYS: {
    TASKS: 'fixtask_tasks',
    CUSTOMERS: 'fixtask_customers',
    SERVICES: 'fixtask_services',
    SETTINGS: 'fixtask_settings'
  },

  _read(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  _write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  // Services
  getServices() {
    const data = this._read(this.KEYS.SERVICES);
    if (Array.isArray(data)) return data;
    return this.getDefaultServices();
  },

  saveServices(services) {
    return this._write(this.KEYS.SERVICES, services);
  },

  getDefaultServices() {
    return [
      { id: 'svc-1', name: 'Screen Replacement', defaultPrice: 18000 },
      { id: 'svc-2', name: 'Battery Replacement', defaultPrice: 5000 },
      { id: 'svc-3', name: 'Charging Port Repair', defaultPrice: 4000 },
      { id: 'svc-4', name: 'Software Repair', defaultPrice: 3000 },
      { id: 'svc-5', name: 'Display Repair', defaultPrice: 15000 },
      { id: 'svc-6', name: 'Water Damage Repair', defaultPrice: 8000 },
      { id: 'svc-7', name: 'Other', defaultPrice: 2000 }
    ];
  },

  addService(service) {
    const services = this.getServices();
    service.id = 'svc-' + Date.now();
    services.push(service);
    this.saveServices(services);
    return service;
  },

  updateService(id, updates) {
    const services = this.getServices();
    const idx = services.findIndex(s => s.id === id);
    if (idx === -1) return null;
    services[idx] = { ...services[idx], ...updates };
    this.saveServices(services);
    return services[idx];
  },

  deleteService(id) {
    const services = this.getServices().filter(s => s.id !== id);
    this.saveServices(services);
  },

  // Tasks
  getTasks() {
    const data = this._read(this.KEYS.TASKS);
    return Array.isArray(data) ? data : [];
  },

  saveTasks(tasks) {
    return this._write(this.KEYS.TASKS, tasks);
  },

  getTaskById(id) {
    return this.getTasks().find(t => t.id === id) || null;
  },

  generateTaskId() {
    const year = new Date().getFullYear();
    const tasks = this.getTasks();
    let maxNum = 0;
    tasks.forEach(t => {
      if (t.id && t.id.startsWith(`FT-${year}-`)) {
        const num = parseInt(t.id.split('-')[2], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const next = maxNum + 1;
    return `FT-${year}-${String(next).padStart(4, '0')}`;
  },

  createTask(task) {
    task.id = task.id || this.generateTaskId();
    task.createdAt = task.createdAt || new Date().toISOString();
    task.status = task.status || 'Pending';
    task.balance = (parseFloat(task.price) || 0) - (parseFloat(task.advance) || 0);
    const tasks = this.getTasks();
    tasks.unshift(task);
    this.saveTasks(tasks);
    this._syncCustomerFromTask(task);
    return task;
  },

  updateTask(id, updates) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    if (updates.price !== undefined || updates.advance !== undefined) {
      const price = parseFloat(updates.price !== undefined ? updates.price : tasks[idx].price) || 0;
      const advance = parseFloat(updates.advance !== undefined ? updates.advance : tasks[idx].advance) || 0;
      updates.balance = price - advance;
    }
    tasks[idx] = { ...tasks[idx], ...updates };
    this.saveTasks(tasks);
    this._syncCustomerFromTask(tasks[idx]);
    return tasks[idx];
  },

  deleteTask(id) {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(tasks);
  },

  // Customers (derived from tasks)
  getCustomers() {
    const data = this._read(this.KEYS.CUSTOMERS);
    return Array.isArray(data) ? data : [];
  },

  saveCustomers(customers) {
    return this._write(this.KEYS.CUSTOMERS, customers);
  },

  _syncCustomerFromTask(task) {
    if (!task.customerName || !task.customerPhone) return;
    const customers = this.getCustomers();
    const key = task.customerPhone.trim();
    let customer = customers.find(c => c.phone === key);
    if (!customer) {
      customer = {
        id: 'cust-' + Date.now(),
        name: task.customerName,
        phone: key,
        tasks: 0,
        totalSpent: 0,
        lastTaskDate: task.createdAt
      };
      customers.push(customer);
    }
    customer.name = task.customerName;
    customer.phone = key;
    const allTasks = this.getTasks();
    const custTasks = allTasks.filter(t => t.customerPhone === key);
    customer.tasks = custTasks.length;
    customer.totalSpent = custTasks.reduce((sum, t) => sum + (parseFloat(t.advance) || 0), 0);
    customer.lastTaskDate = custTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.createdAt || customer.lastTaskDate;
    this.saveCustomers(customers);
  },

  rebuildCustomers() {
    const tasks = this.getTasks();
    const map = {};
    tasks.forEach(t => {
      if (!t.customerName || !t.customerPhone) return;
      const key = t.customerPhone.trim();
      if (!map[key]) {
        map[key] = {
          id: 'cust-' + Date.now() + Math.random().toString(36).slice(2, 6),
          name: t.customerName,
          phone: key,
          tasks: 0,
          totalSpent: 0,
          lastTaskDate: t.createdAt
        };
      }
      map[key].name = t.customerName;
      map[key].tasks++;
      map[key].totalSpent += parseFloat(t.advance) || 0;
      if (new Date(t.createdAt) > new Date(map[key].lastTaskDate)) {
        map[key].lastTaskDate = t.createdAt;
      }
    });
    this.saveCustomers(Object.values(map));
  },

  // Settings
  getSettings() {
    const defaults = { shopName: 'FixTask Shop', shopPhone: '', currency: 'Rs.' };
    const data = this._read(this.KEYS.SETTINGS);
    return data && typeof data === 'object' ? { ...defaults, ...data } : defaults;
  },

  saveSettings(settings) {
    return this._write(this.KEYS.SETTINGS, settings);
  },

  // Backup / Restore
  exportAll() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: this.getTasks(),
      customers: this.getCustomers(),
      services: this.getServices(),
      settings: this.getSettings()
    };
  },

  importAll(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.tasks) this.saveTasks(data.tasks);
    if (data.customers) this.saveCustomers(data.customers);
    if (data.services) this.saveServices(data.services);
    if (data.settings) this.saveSettings(data.settings);
    return true;
  },

  clearAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }
};
