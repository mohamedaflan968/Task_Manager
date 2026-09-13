const Notifications = {
  buildMessage(task) {
    const settings = Storage.getSettings();
    const shop = settings.shopName || 'our shop';
    return `Hello ${task.customerName},\n\nYour ${task.brand || ''} ${task.model || ''} repair has been completed.\n\nTask ID: ${task.id}\nService: ${task.service}\nAmount: ${App.formatCurrency(task.price)}\nBalance: ${App.formatCurrency(task.balance)}\n\nThank you for choosing ${shop}.`;
  },

  showCompletionModal(task) {
    const modal = document.getElementById('notificationModal');
    if (!modal) return;
    const msg = this.buildMessage(task);
    document.getElementById('notifMessage').value = msg;

    const waBtn = document.getElementById('notifWhatsApp');
    const smsBtn = document.getElementById('notifSMS');
    const skipBtn = document.getElementById('notifSkip');
    const billBtn = document.getElementById('notifBill');

    const clean = () => {
      waBtn.replaceWith(waBtn.cloneNode(true));
      smsBtn.replaceWith(smsBtn.cloneNode(true));
      skipBtn.replaceWith(skipBtn.cloneNode(true));
      billBtn.replaceWith(billBtn.cloneNode(true));
    };

    const newWa = document.getElementById('notifWhatsApp');
    const newSms = document.getElementById('notifSMS');
    const newSkip = document.getElementById('notifSkip');
    const newBill = document.getElementById('notifBill');

    newWa.onclick = () => {
      const phone = task.customerPhone?.replace(/[^0-9]/g, '') || '';
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
      App.showToast('WhatsApp opened', 'success');
    };

    newSms.onclick = () => {
      const phone = task.customerPhone?.replace(/[^0-9]/g, '') || '';
      const url = `sms:${phone}?body=${encodeURIComponent(msg)}`;
      window.location.href = url;
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
      App.showToast('SMS app opened', 'info');
    };

    newSkip.onclick = () => {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    };

    if (newBill) {
      newBill.onclick = () => {
        Thermal.printBill(task);
      };
    }

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  }
};
