const Thermal = {
  buildReceipt(task) {
    const settings = Storage.getSettings();
    const d = task.createdAt ? new Date(task.createdAt) : new Date();
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const line = (label, value) => {
      if (value === undefined || value === null || value === '') return '';
      return `<div class="r-row"><span class="r-label">${label}</span><span class="r-value">${value}</span></div>`;
    };

    const device = [task.brand, task.model].filter(Boolean).join(' ');

    return `
      <div class="r-head">
        <div class="r-shop">${settings.shopName || 'FixTask'}</div>
        <div class="r-sub">Mobile Phone Service Center</div>
        ${settings.shopPhone ? `<div class="r-sub">Tel: ${settings.shopPhone}</div>` : ''}
        <div class="r-divider"></div>
        <div class="r-date">${dateStr}  ${timeStr}</div>
        <div class="r-task">Task No: ${task.id}</div>
      </div>
      <div class="r-divider"></div>
      ${line('Customer', task.customerName)}
      ${line('Phone', task.customerPhone)}
      ${line('Device', device || '-')}
      ${line('IMEI', task.imei)}
      ${line('Service', task.service)}
      ${line('Description', task.description)}
      <div class="r-divider"></div>
      ${line('Price', App.formatCurrency(task.price))}
      ${line('Advance Paid', App.formatCurrency(task.advance))}
      ${line('Balance', `<b>${App.formatCurrency(task.balance)}</b>`)}
      ${line('Status', task.status)}
      <div class="r-divider"></div>
      <div class="r-thanks">Thank you for choosing us!</div>
      <div class="r-foot">
        <div>Developed By Mohamed Aflan</div>
        <div>Contact - 0760562969</div>
      </div>`;
  },

  printBill(task) {
    const fresh = Storage.getTaskById(task.id);
    const t = fresh || task;
    const content = this.buildReceipt(t);

    const w = window.open('', '_blank', 'width=320,height=640');
    if (!w) {
      App.showToast('Please allow pop-ups to print the bill', 'error');
      return;
    }

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Thermal Bill - ${t.id}</title>
        <style>
          @page { size: 58mm auto; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { width: 58mm; margin: 0 auto; font-family: 'Courier New', monospace; font-size: 12px; color: #000; padding: 4px 0 0; }
          .r-head { text-align: center; }
          .r-shop { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .r-sub { font-size: 11px; }
          .r-date, .r-task { font-size: 11px; margin-top: 2px; }
          .r-divider { border-top: 1px dashed #000; margin: 6px 0; }
          .r-row { display: flex; justify-content: space-between; align-items: baseline; padding: 2px 0; font-size: 12px; }
          .r-label { white-space: nowrap; }
          .r-value { text-align: right; padding-left: 8px; }
          .r-thanks { text-align: center; margin: 8px 0 4px; font-size: 12px; }
          .r-foot { text-align: center; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; font-size: 10px; line-height: 1.5; }
          @media screen {
            body { border: 1px solid #ccc; padding: 8px; margin: 10px auto; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
          }
        </style>
      </head>
      <body onload="window.focus(); window.print();">
        ${content}
        <script>
          window.onafterprint = function(){ window.close(); };
          setTimeout(function(){ window.close(); }, 1500);
        </script>
      </body>
      </html>
    `);
    w.document.close();
  }
};