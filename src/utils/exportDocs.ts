import * as XLSX from 'xlsx';
import { Order, Customer, Medicine, VisitorLedgerEntry } from '../types';
import { getShamsiDateDetails } from './onlineDate';

/**
 * Returns a precise timestamp formatted string for filenames: YYYY-MM-DD_HH-mm-ss
 */
export function getExportTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}_${hh}-${mm}-${ss}`;
}

/**
 * Universal Persian + English High-Fidelity Print / PDF Generator
 * Uses embedded Vazirmatn font to ensure 100% crisp, uncorrupted Persian & English text
 * when saved to PDF or printed by any browser (Chrome, Edge, Safari, Firefox, Mobile).
 */
function openPrintPdfWindow(title: string, contentHtml: string, orientation: 'portrait' | 'landscape' = 'portrait') {
  const pageRule = orientation === 'landscape'
    ? `@page { size: A4 landscape; margin: 8mm; }`
    : `@page { size: A4 portrait; margin: 10mm; }`;

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
          background-color: #ffffff;
          color: #0f172a;
          direction: rtl;
          text-align: right;
          padding: 16px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        ${pageRule}
        @media print {
          body {
            padding: 0;
            background: transparent;
          }
          .no-print, .pdf-toolbar {
            display: none !important;
          }
        }
        .pdf-toolbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #0284c7;
          color: #ffffff;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .pdf-toolbar button {
          background: #ffffff;
          color: #0284c7;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .pdf-toolbar button:hover {
          background: #f0f9ff;
        }
        .header-box {
          border-bottom: 2px solid #0284c7;
          padding-bottom: 14px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-title {
          font-size: 20px;
          font-weight: 800;
          color: #0284c7;
        }
        .header-sub {
          font-size: 13px;
          color: #475569;
          margin-top: 4px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          font-size: 12px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
        }
        .meta-label {
          color: #64748b;
          font-size: 11px;
          margin-bottom: 2px;
        }
        .meta-value {
          color: #0f172a;
          font-weight: 700;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          font-size: 11.5px;
          text-align: right;
        }
        th {
          background-color: #f1f5f9;
          color: #1e293b;
          font-weight: 700;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .number-col {
          text-align: center;
          font-family: 'Vazirmatn', monospace;
        }
        .price-col {
          text-align: left;
          direction: ltr;
          font-family: 'Vazirmatn', monospace;
        }
        .summary-box {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        .summary-table {
          width: 320px;
          border-collapse: collapse;
        }
        .summary-table td {
          padding: 6px 12px;
          font-size: 12px;
        }
        .total-row td {
          background-color: #e0f2fe !important;
          color: #0369a1;
          font-weight: 800;
          font-size: 13px;
        }
        .footer-note {
          margin-top: 30px;
          padding-top: 12px;
          border-top: 1px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #64748b;
        }
        .signature-box {
          display: flex;
          justify-content: space-between;
          margin-top: 36px;
          padding: 0 40px;
          font-size: 12px;
          color: #334155;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="pdf-toolbar no-print">
        <span style="font-size: 13px; font-weight: 700;">📄 سند رسمی دارویی آماده چاپ و دانلود PDF</span>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.print()">🖨️ چاپ / ذخیره PDF</button>
          <button onclick="window.close()" style="background: rgba(255,255,255,0.2); color: #fff;">بستن صفحه</button>
        </div>
      </div>
      ${contentHtml}
      <script>
        function doPrint() {
          try {
            window.focus();
            window.print();
          } catch (e) {
            console.error(e);
          }
        }
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function() {
            setTimeout(doPrint, 200);
          });
        } else {
          setTimeout(doPrint, 400);
        }
      </script>
    </body>
    </html>
  `;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Mobile browsers handle popup windows for print/PDF much better than hidden iframes
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      return;
    }
  }

  // Desktop or fallback to invisible iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '1000px';
  iframe.style.height = '1000px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // If iframe blocked, open window
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
    }
    return;
  }

  doc.open();
  doc.write(fullHtml);
  doc.close();

  // Cleanup iframe after print
  setTimeout(() => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  }, 90000);
}

/**
 * Generates an Excel (XLSX) file for a single order
 */
export function exportOrderToExcel(order: Order, storeName: string) {
  const wb = XLSX.utils.book_new();

  const infoRows = [
    ['عنوان سند', 'فاکتور فروش دارویی'],
    ['فروشگاه', storeName],
    ['شماره سفارش', order.orderNumber],
    ['نام داروخانه / مشتری', order.customerName],
    ['ویزیتور ثبت‌کننده', order.visitorName],
    ['تاریخ ثبت', new Date(order.createdAt).toLocaleDateString('fa-AF')],
    ['وضعیت سفارش', getOrderStatusTitle(order.status)],
    ['وضعیت وصول وجه', getPaymentStatusTitle(order.paymentStatus)],
    ['مبلغ پرداختی (افغانی)', (order.paidAmountAFN || 0).toLocaleString()],
    ['مانده بدهی (افغانی)', (order.remainingAmountAFN || 0).toLocaleString()],
    ['مبلغ کل (افغانی)', (order.totalAFN || 0).toLocaleString()],
    [],
  ];

  const itemHeaders = [
    'ردیف',
    'نام دارو',
    'واحد بسته‌بندی',
    'تعداد',
    'قیمت واحد (افغانی)',
    'تخفیف (افغانی)',
    'مبلغ کل (افغانی)',
  ];

  const itemRows = (order.items || []).map((item, idx) => [
    idx + 1,
    item.medicineName,
    item.unit,
    item.quantity,
    (item.unitPrice || 0).toLocaleString(),
    (item.discountAFN || 0).toLocaleString(),
    (item.totalAFN || 0).toLocaleString(),
  ]);

  const wsData = [...infoRows, itemHeaders, ...itemRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'سفارش ' + order.orderNumber);

  const ts = getExportTimestamp();
  const cleanCustomer = (order.customerName || 'Customer').replace(/[/\\?%*:|"<>]/g, '_');
  XLSX.writeFile(wb, `${order.orderNumber}_${cleanCustomer}_${ts}.xlsx`);
}

/**
 * Generates a clean printable/downloadable PDF for a single order with Vazirmatn Persian & English font
 */
export function exportOrderToPDF(order: Order, storeName: string) {
  const dateStr = getShamsiDateDetails(new Date(order.createdAt)).fullLabel;
  const itemsHtml = (order.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td class="number-col">${idx + 1}</td>
        <td>
          <strong>${item.medicineName}</strong>
          ${(item as any).medicineCode ? `<span style="display:block; font-size:10px; color:#64748b; font-family:monospace;">کد: ${(item as any).medicineCode}</span>` : ''}
        </td>
        <td class="number-col">${item.unit || 'بسته'}</td>
        <td class="number-col" style="font-weight:bold;">${item.quantity || 0}</td>
        <td class="price-col">${(item.unitPrice || 0).toLocaleString()}</td>
        <td class="price-col">${(item.discountAFN || 0).toLocaleString()}</td>
        <td class="price-col" style="font-weight:bold;">${(item.totalAFN || 0).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div class="header-box">
      <div>
        <h1 class="header-title">فاکتور فروش دارویی رسمی</h1>
        <p class="header-sub">${storeName || 'عمده‌فروشی توزیع دارو'}</p>
      </div>
      <div style="text-align: left;">
        <div style="font-size: 13px; font-weight: bold; color: #0f172a;">شماره سفارش: ${order.orderNumber}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">تاریخ ثبت: ${dateStr}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">نام دواخانه / مشتری:</span>
        <span class="meta-value">${order.customerName || '-'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">ویزیتور ثبت‌کننده:</span>
        <span class="meta-value">${order.visitorName || '-'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">وضعیت سفارش:</span>
        <span class="meta-value" style="color:#0284c7;">${getOrderStatusTitle(order.status)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">وضعیت پرداخت:</span>
        <span class="meta-value">${getPaymentStatusTitle(order.paymentStatus)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">تعداد اقلام:</span>
        <span class="meta-value">${(order.items || []).length} قلم دارو</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">ارز مبادله:</span>
        <span class="meta-value">افغانی (AFN)</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px;" class="number-col">ردیف</th>
          <th>شرح داروی درخواستی</th>
          <th style="width: 70px;" class="number-col">واحد</th>
          <th style="width: 60px;" class="number-col">تعداد</th>
          <th style="width: 100px;" class="price-col">قیمت واحد (افغانی)</th>
          <th style="width: 90px;" class="price-col">تخفیف (افغانی)</th>
          <th style="width: 110px;" class="price-col">مبلغ کل (افغانی)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary-box">
      <table class="summary-table">
        <tbody>
          <tr>
            <td style="color:#64748b;">جمع کل اقلام:</td>
            <td class="price-col">${(order.subtotalAFN || 0).toLocaleString()} افغانی</td>
          </tr>
          ${
            order.discountAFN
              ? `<tr>
                  <td style="color:#64748b;">مجموع تخفیف:</td>
                  <td class="price-col" style="color:#dc2626;">-${(order.discountAFN || 0).toLocaleString()} افغانی</td>
                </tr>`
              : ''
          }
          <tr class="total-row">
            <td>مبلغ نهایی قابل پرداخت:</td>
            <td class="price-col">${(order.totalAFN || 0).toLocaleString()} افغانی</td>
          </tr>
          <tr>
            <td style="color:#16a34a;">مبلغ پرداخت شده:</td>
            <td class="price-col" style="color:#16a34a; font-weight:bold;">${(order.paidAmountAFN || 0).toLocaleString()} افغانی</td>
          </tr>
          <tr>
            <td style="color:#dc2626;">مانده حساب (بدهی):</td>
            <td class="price-col" style="color:#dc2626; font-weight:bold;">${(order.remainingAmountAFN || 0).toLocaleString()} افغانی</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${
      order.notes
        ? `<div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; margin-top:14px; font-size:11px;">
            <strong>توضیحات و یادداشت سفارش:</strong> ${order.notes}
          </div>`
        : ''
    }

    <div class="signature-box">
      <div>
        <p>امضا و مهر تحویل‌گیرنده (دواخانه)</p>
        <div style="height: 50px;"></div>
      </div>
      <div>
        <p>امضای ویزیتور فروش</p>
        <div style="height: 50px;"></div>
      </div>
      <div>
        <p>مهر و امضای حسابداری فروشگاه</p>
        <div style="height: 50px;"></div>
      </div>
    </div>

    <div class="footer-note">
      <span>صادر شده توسط سامانه یکپارچه مدیریت ویزیتور دارو</span>
      <span>تاریخ چاپ: ${getShamsiDateDetails().fullLabel}</span>
    </div>
  `;

  const ts = getExportTimestamp();
  const cleanCustomer = (order.customerName || 'مشتری').replace(/[/\\?%*:|"<>]/g, '_');
  openPrintPdfWindow(`فاکتور_${order.orderNumber}_${cleanCustomer}_${ts}`, html, 'portrait');
}

/**
 * Export orders list to PDF (Landscape format with clean multi-page pagination & Vazirmatn font)
 */
export function exportOrdersListToPDF(
  orders: Order[],
  storeName = 'فروشگاه دارویی',
  filename = 'Orders_Report'
) {
  const totalSales = orders.reduce((s, o) => s + (o.totalAFN || 0), 0);
  const totalPaid = orders.reduce((s, o) => s + (o.paidAmountAFN || 0), 0);
  const totalRemaining = orders.reduce((s, o) => s + (o.remainingAmountAFN || 0), 0);

  const rowsHtml = orders
    .map(
      (o, idx) => `
      <tr>
        <td class="number-col">${idx + 1}</td>
        <td class="number-col" style="font-weight:bold; font-family:monospace;">${o.orderNumber}</td>
        <td><strong>${o.customerName || '-'}</strong></td>
        <td>${o.visitorName || '-'}</td>
        <td class="number-col">${getShamsiDateDetails(new Date(o.createdAt)).numericDate}</td>
        <td class="price-col">${(o.totalAFN || 0).toLocaleString()}</td>
        <td class="price-col" style="color:#16a34a;">${(o.paidAmountAFN || 0).toLocaleString()}</td>
        <td class="price-col" style="color:#dc2626;">${(o.remainingAmountAFN || 0).toLocaleString()}</td>
        <td style="text-align:center;">${getOrderStatusTitle(o.status)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div class="header-box">
      <div>
        <h1 class="header-title">گزارش جامع سفارشات و فروش دارویی</h1>
        <p class="header-sub">${storeName}</p>
      </div>
      <div style="text-align: left; font-size: 11px; color: #64748b;">
        <div>تعداد کل سفارش‌ها: <strong>${orders.length}</strong></div>
        <div>تاریخ تهیه گزارش: ${getShamsiDateDetails().fullLabel}</div>
      </div>
    </div>

    <div class="meta-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="meta-item">
        <span class="meta-label">مجموع کل مبلغ فروش:</span>
        <span class="meta-value" style="color:#0284c7; font-size:14px;">${totalSales.toLocaleString()} افغانی</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">مجموع مبالغ وصول‌شده:</span>
        <span class="meta-value" style="color:#16a34a; font-size:14px;">${totalPaid.toLocaleString()} افغانی</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">مانده مطالبات (طلب فروشگاه):</span>
        <span class="meta-value" style="color:#dc2626; font-size:14px;">${totalRemaining.toLocaleString()} افغانی</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px;" class="number-col">#</th>
          <th style="width: 110px;" class="number-col">شماره فاکتور</th>
          <th>دواخانه / مشتری</th>
          <th>ویزیتور مسئول</th>
          <th style="width: 90px;" class="number-col">تاریخ</th>
          <th style="width: 100px;" class="price-col">مبلغ کل (افغانی)</th>
          <th style="width: 95px;" class="price-col">وصول‌شده</th>
          <th style="width: 95px;" class="price-col">مانده بدهی</th>
          <th style="width: 90px; text-align:center;">وضعیت</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footer-note">
      <span>سامانه هوشمند ویزیتور دارو - گزارش مالی و سفارشات</span>
      <span>صفحه رسمی چاپی</span>
    </div>
  `;

  const ts = getExportTimestamp();
  openPrintPdfWindow(`${filename}_${ts}`, html, 'landscape');
}

/**
 * Export medicines list to PDF (Landscape format with Vazirmatn font)
 */
export function exportMedicinesToPDF(
  medicines: Medicine[],
  storeName = 'فروشگاه دارویی'
) {
  const totalStock = medicines.reduce((s, m) => s + (m.stock || 0), 0);

  const rowsHtml = medicines
    .map(
      (m, idx) => `
      <tr>
        <td class="number-col">${idx + 1}</td>
        <td class="number-col" style="font-family:monospace; font-weight:bold;">${m.code}</td>
        <td>
          <strong>${m.name}</strong>
          <span style="display:block; font-size:10px; color:#64748b;">${m.brand} • ${m.dosageForm} ${m.strength ? `(${m.strength})` : ''}</span>
        </td>
        <td>${m.category || '-'}</td>
        <td class="number-col">${m.unit || 'بسته'}</td>
        <td class="price-col">${Number(m.salePrice).toLocaleString()}</td>
        <td class="number-col" style="font-weight:bold; ${m.stock <= (m.minStockAlert || 5) ? 'color:#dc2626;' : ''}">
          ${m.stock}
        </td>
        <td class="number-col">${m.expiryDate || '-'}</td>
        <td class="number-col" style="font-family:monospace; font-size:10px;">${m.batchNumber || '-'}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div class="header-box" style="border-bottom-color: #10b981;">
      <div>
        <h1 class="header-title" style="color: #10b981;">فهرست موجودی انبار و کاتالوگ دارویی</h1>
        <p class="header-sub">${storeName}</p>
      </div>
      <div style="text-align: left; font-size: 11px; color: #64748b;">
        <div>تعداد اقلام دارو: <strong>${medicines.length}</strong></div>
        <div>مجموع موجودی کل: <strong>${totalStock.toLocaleString()}</strong> واحد</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px;" class="number-col">#</th>
          <th style="width: 95px;" class="number-col">کد دارو</th>
          <th>نام دارو و مشخصات</th>
          <th>دسته‌بندی درمانی</th>
          <th style="width: 70px;" class="number-col">واحد</th>
          <th style="width: 95px;" class="price-col">قیمت فروش (افغانی)</th>
          <th style="width: 75px;" class="number-col">موجودی</th>
          <th style="width: 90px;" class="number-col">انقضا</th>
          <th style="width: 85px;" class="number-col">بچ / لات</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footer-note">
      <span>گزارش رسمی انبار دارویی - خروجی با فونت استاندارد وزیرمتن</span>
      <span>تاریخ: ${getShamsiDateDetails().fullLabel}</span>
    </div>
  `;

  const tsMedicines = getExportTimestamp();
  openPrintPdfWindow(`کاتالوگ_داروها_${tsMedicines}`, html, 'landscape');
}

/**
 * Export customers list to PDF (Landscape format with Vazirmatn font)
 */
export function exportCustomersToPDF(
  customers: Customer[],
  storeName = 'فروشگاه دارویی'
) {
  const rowsHtml = customers
    .map(
      (c, idx) => `
      <tr>
        <td class="number-col">${idx + 1}</td>
        <td><strong>${c.name}</strong></td>
        <td>${c.managerName || '-'}</td>
        <td class="number-col" style="direction:ltr; font-family:monospace;">${c.phone}</td>
        <td>${c.city} - ${c.area}</td>
        <td style="font-size:10.5px;">${c.address || '-'}</td>
        <td class="number-col">${c.totalOrdersCount || 0}</td>
        <td class="price-col">${Number(c.totalOrderAmount || 0).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div class="header-box">
      <div>
        <h1 class="header-title">فهرست دواخانه‌ها و مراکز درمانی همکار</h1>
        <p class="header-sub">${storeName}</p>
      </div>
      <div style="text-align: left; font-size: 11px; color: #64748b;">
        <div>تعداد مراکز ثبت‌شده: <strong>${customers.length}</strong></div>
        <div>تاریخ: ${getShamsiDateDetails().fullLabel}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px;" class="number-col">#</th>
          <th>نام داروخانه / کلینیک</th>
          <th>نام مسئول داروخانه</th>
          <th style="width: 105px;" class="number-col">شماره تماس</th>
          <th style="width: 110px;">شهر / منطقه</th>
          <th>آدرس دقیق</th>
          <th style="width: 60px;" class="number-col">سفارشات</th>
          <th style="width: 110px;" class="price-col">مجموع خرید (افغانی)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footer-note">
      <span>دفترچه مخاطبان و شبکه توزیع دارو</span>
      <span>ویزیتور دارو</span>
    </div>
  `;

  const tsCustomers = getExportTimestamp();
  openPrintPdfWindow(`فهرست_مشتریان_${tsCustomers}`, html, 'landscape');
}

/**
 * Export visitor ledger account to PDF
 */
export function exportLedgerToPDF(
  ledger: VisitorLedgerEntry[],
  visitorName: string,
  storeName: string
) {
  const totalCommission = ledger
    .filter((e) => e.type === 'commission')
    .reduce((s, e) => s + (e.amount || 0), 0);

  const totalPayouts = ledger
    .filter((e) => e.type === 'payout')
    .reduce((s, e) => s + (e.amount || 0), 0);

  const currentBalance = totalCommission - totalPayouts;

  const rowsHtml = ledger
    .map(
      (e, idx) => `
      <tr>
        <td class="number-col">${idx + 1}</td>
        <td class="number-col">${getShamsiDateDetails(new Date(e.date)).numericDate}</td>
        <td style="font-weight:bold; color:${e.type === 'commission' ? '#16a34a' : '#0284c7'};">
          ${e.type === 'commission' ? 'پورسانت فروش' : 'تسویه / پرداخت'}
        </td>
        <td>${e.description || e.title}</td>
        <td class="number-col" style="font-family:monospace;">${(e as any).orderNumber || e.orderId || '-'}</td>
        <td class="price-col" style="font-weight:bold; color:${e.type === 'commission' ? '#16a34a' : '#0f172a'};">
          ${(e.amount || 0).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div class="header-box">
      <div>
        <h1 class="header-title">صورت‌حساب مالی و پورسانت ویزیتور</h1>
        <p class="header-sub">${storeName} • ویزیتور: <strong>${visitorName}</strong></p>
      </div>
      <div style="text-align: left; font-size: 11px; color: #64748b;">
        <div>تاریخ صدور: ${getShamsiDateDetails().fullLabel}</div>
      </div>
    </div>

    <div class="meta-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="meta-item">
        <span class="meta-label">مجموع پورسانت‌های تعلق‌گرفته:</span>
        <span class="meta-value" style="color:#16a34a; font-size:14px;">${totalCommission.toLocaleString()} افغانی</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">مجموع مبالغ تسویه‌شده:</span>
        <span class="meta-value" style="color:#0284c7; font-size:14px;">${totalPayouts.toLocaleString()} افغانی</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">مانده بستانکاری ویزیتور:</span>
        <span class="meta-value" style="color:#059669; font-size:14px;">${currentBalance.toLocaleString()} افغانی</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px;" class="number-col">#</th>
          <th style="width: 90px;" class="number-col">تاریخ</th>
          <th style="width: 100px;">نوع تراکنش</th>
          <th>شرح عملیات</th>
          <th style="width: 100px;" class="number-col">شماره فاکتور</th>
          <th style="width: 110px;" class="price-col">مبلغ (افغانی)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="signature-box">
      <div>
        <p>امضای ویزیتور (${visitorName})</p>
        <div style="height: 50px;"></div>
      </div>
      <div>
        <p>تأیید مدیر فروشگاه</p>
        <div style="height: 50px;"></div>
      </div>
    </div>

    <div class="footer-note">
      <span>سامانه مالی ویزیتور دارو</span>
      <span>گزارش رسمی پورسانت و تسویه حساب</span>
    </div>
  `;

  const tsLedger = getExportTimestamp();
  const cleanVis = visitorName.replace(/[/\\?%*:|"<>]/g, '_');
  openPrintPdfWindow(`صورتحساب_پورسانت_${cleanVis}_${tsLedger}`, html, 'portrait');
}

/**
 * Export medicines list to Excel
 */
export function exportMedicinesToExcel(medicines: Medicine[]) {
  const wb = XLSX.utils.book_new();
  const rows = medicines.map((m, idx) => ({
    'ردیف': idx + 1,
    'کد دارو': m.code,
    'نام دارو': m.name,
    'شرکت/برند': m.brand,
    'شکل دارویی': m.dosageForm,
    'دوز': m.strength,
    'واحد': m.unit,
    'قیمت خرید (افغانی)': m.purchasePrice,
    'قیمت فروش (افغانی)': m.salePrice,
    'موجودی فعلی': m.stock,
    'حداقل هشدار': m.minStockAlert,
    'تاریخ انقضا': m.expiryDate,
    'شماره سری ساخت': m.batchNumber,
    'وضعیت': m.status === 'active' ? 'فعال' : 'غیرفعال',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'فهرست داروها');
  const ts = getExportTimestamp();
  XLSX.writeFile(wb, `Medicines_Inventory_${ts}.xlsx`);
}

/**
 * Export customers list to Excel
 */
export function exportCustomersToExcel(customers: Customer[]) {
  const wb = XLSX.utils.book_new();
  const rows = customers.map((c, idx) => ({
    'ردیف': idx + 1,
    'نام دواخانه': c.name,
    'نام مسئول': c.managerName,
    'شماره تماس': c.phone,
    'شماره ثانوی': c.altPhone || '-',
    'شهر / منطقه': `${c.city} - ${c.area}`,
    'آدرس دقیق': c.address,
    'تعداد سفارشات': c.totalOrdersCount,
    'مجموع خرید (افغانی)': c.totalOrderAmount,
    'وضعیت': c.status === 'active' ? 'فعال' : 'آرشیو',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'فهرست مشتریان');
  const ts = getExportTimestamp();
  XLSX.writeFile(wb, `Customers_List_${ts}.xlsx`);
}

/**
 * Export orders list to Excel / CSV
 */
export function exportOrdersListToExcel(orders: Order[], filename = 'Orders_Report') {
  const wb = XLSX.utils.book_new();
  const rows = orders.map((o, idx) => ({
    'ردیف': idx + 1,
    'شماره سفارش': o.orderNumber,
    'مشتری': o.customerName,
    'ویزیتور': o.visitorName,
    'تاریخ ثبت': new Date(o.createdAt).toLocaleDateString('fa-AF'),
    'مبلغ کل (افغانی)': o.totalAFN,
    'دریافتی': o.paidAmountAFN,
    'مانده': o.remainingAmountAFN,
    'وضعیت سفارش': getOrderStatusTitle(o.status),
    'وضعیت مالی': getPaymentStatusTitle(o.paymentStatus),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'سفارشات');
  const ts = getExportTimestamp();
  XLSX.writeFile(wb, `${filename}_${ts}.xlsx`);
}

export function getOrderStatusTitle(status: string): string {
  switch (status) {
    case 'draft': return 'پیش‌نویس';
    case 'submitted': return 'ثبت‌شده';
    case 'pending_review': return 'در انتظار بررسی';
    case 'approved': return 'تأییدشده';
    case 'preparing': return 'در حال آماده‌سازی دارو';
    case 'ready_to_ship': return 'آماده ارسال';
    case 'shipped': return 'ارسال شده';
    case 'delivered': return 'تحویل داده شده';
    case 'cancelled': return 'لغوشده';
    case 'returned': return 'مرجوعی';
    default: return status || '-';
  }
}

export function getPaymentStatusTitle(status: string): string {
  switch (status) {
    case 'unpaid': return 'پرداخت نشده';
    case 'partial': return 'وصول جزئی';
    case 'paid': return 'وصول کامل';
    case 'refunded': return 'برگشت وجه';
    case 'review_needed': return 'نیازمند بررسی';
    default: return status || '-';
  }
}
