import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DocFooterMeta {
  docNumber: string;
  docDate: string;
  clientName: string;
  isInvoice: boolean;
}

export async function generateInvoicePDF(
  ref: HTMLDivElement,
  filename: string,
  meta: DocFooterMeta
): Promise<void> {
  const canvas = await html2canvas(ref, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: true,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const pageH = 297;
  const headerH = 10;
  const footerH = 14;
  const contentH = pageH - footerH;
  const continuationContentH = pageH - headerH - footerH;
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let totalPages = 1;
  if (imgH > contentH) {
    const remaining = imgH - contentH;
    totalPages = 1 + Math.ceil(remaining / continuationContentH);
  }

  const docLabel = meta.isInvoice ? 'Invoice' : 'Quotation';

  const formattedDate = (() => {
    try {
      return new Date(meta.docDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return meta.docDate;
    }
  })();

  const addHeader = (page: number) => {
    if (page === 1) return;

    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageW, headerH, 'F');

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${docLabel} ${meta.docNumber}`, 10, 6.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(180, 190, 210);
    const clientText = meta.clientName.length > 30 ? meta.clientName.slice(0, 30) + '...' : meta.clientName;
    pdf.text(clientText, pageW / 2, 6.5, { align: 'center' });

    const contText = `Page ${page} of ${totalPages}`;
    pdf.text(contText, pageW - 10, 6.5, { align: 'right' });
  };

  const addFooter = (page: number) => {
    const footerY = pageH - footerH;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, footerY - 1, pageW, footerH + 1, 'F');

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(10, footerY + 1, pageW - 10, footerY + 1);
    pdf.setLineDashPattern([], 0);

    const textY = footerY + 7;
    pdf.setFontSize(6.5);
    pdf.setTextColor(140, 140, 140);

    const noLabel = meta.isInvoice ? 'Invoice No:  ' : 'Quotation No:  ';
    const dateLabel = meta.isInvoice ? 'Invoice Date:  ' : 'Quotation Date:  ';
    const clientLabel = meta.isInvoice ? 'Billed To:  ' : 'Quotation For:  ';

    pdf.setFont('helvetica', 'bold');
    pdf.text(noLabel, 10, textY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(meta.docNumber, 10 + pdf.getTextWidth(noLabel), textY);

    const dateX = 72;
    pdf.setFont('helvetica', 'bold');
    pdf.text(dateLabel, dateX, textY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formattedDate, dateX + pdf.getTextWidth(dateLabel), textY);

    const clientX = 134;
    pdf.setFont('helvetica', 'bold');
    pdf.text(clientLabel, clientX, textY);
    pdf.setFont('helvetica', 'normal');
    const clientFooterText = meta.clientName.length > 18 ? meta.clientName.slice(0, 18) + '...' : meta.clientName;
    pdf.text(clientFooterText, clientX + pdf.getTextWidth(clientLabel), textY);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(160, 160, 160);
    const pageText = `Page ${page} of ${totalPages}`;
    pdf.text(pageText, pageW - 10, textY, { align: 'right' });
  };

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    const isFirst = page === 0;
    const yOffset = isFirst ? 0 : headerH;
    const availableH = isFirst ? contentH : continuationContentH;

    let srcY: number;
    if (isFirst) {
      srcY = 0;
    } else {
      srcY = (contentH + (page - 1) * continuationContentH) * canvas.width / imgW;
    }

    const maxSrcH = canvas.height - srcY;
    const sliceSrcH = Math.min((availableH * canvas.width) / imgW, maxSrcH);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.max(1, Math.round(sliceSrcH));
    const ctx = pageCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, sliceSrcH, 0, 0, canvas.width, sliceSrcH);

    const sliceH = (sliceSrcH * imgW) / canvas.width;
    pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, yOffset, imgW, sliceH);

    addHeader(page + 1);
    addFooter(page + 1);
  }

  pdf.save(filename);
}
