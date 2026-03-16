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
  const footerH = 10;
  const contentH = pageH - footerH;
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const totalPages = Math.max(1, Math.ceil(imgH / contentH));

  const addFooter = (page: number) => {
    const y = pageH - footerH + 2;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(8, pageH - footerH, pageW - 8, pageH - footerH);
    pdf.setLineDashPattern([], 0);

    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    const label = meta.isInvoice ? 'Invoice No' : 'Quotation No';
    const dateLabel = meta.isInvoice ? 'Invoice Date' : 'Quotation Date';
    const clientLabel = meta.isInvoice ? 'Billed To' : 'Quotation For';

    const formattedDate = (() => {
      try {
        return new Date(meta.docDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch {
        return meta.docDate;
      }
    })();

    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}`, 8, y + 3);
    pdf.setFont('helvetica', 'normal');
    pdf.text(` ${meta.docNumber}`, 8 + pdf.getTextWidth(`${label}`), y + 3);

    pdf.setFont('helvetica', 'bold');
    pdf.text(`${dateLabel}`, 70, y + 3);
    pdf.setFont('helvetica', 'normal');
    pdf.text(` ${formattedDate}`, 70 + pdf.getTextWidth(`${dateLabel}`), y + 3);

    pdf.setFont('helvetica', 'bold');
    pdf.text(`${clientLabel}`, 130, y + 3);
    pdf.setFont('helvetica', 'normal');
    const clientText = meta.clientName.length > 20 ? meta.clientName.slice(0, 20) + '…' : meta.clientName;
    pdf.text(` ${clientText}`, 130 + pdf.getTextWidth(`${clientLabel}`), y + 3);

    pdf.setFont('helvetica', 'normal');
    const pageText = `Page ${page} of ${totalPages}`;
    const ptw = pdf.getTextWidth(pageText);
    pdf.text(pageText, pageW - 8 - ptw, y + 3);
  };

  if (totalPages === 1) {
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, Math.min(imgH, contentH));
    addFooter(1);
  } else {
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const srcY = (page * contentH * canvas.width) / imgW;
      const srcH = Math.min((contentH * canvas.width) / imgW, canvas.height - srcY);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = srcH;
      const ctx = pageCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
      const sliceH = (srcH * imgW) / canvas.width;
      pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, sliceH);
      addFooter(page + 1);
    }
  }

  pdf.save(filename);
}
