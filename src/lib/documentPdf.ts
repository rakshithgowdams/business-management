import type jsPDF from 'jspdf';

interface DocumentMeta {
  title: string;
  type?: string;
  date?: string;
  expiryDate?: string;
  status?: string;
  linkedName?: string;
  notes?: string;
}

const BRAND_COLOR: [number, number, number] = [255, 107, 0];
const DARK_TEXT: [number, number, number] = [33, 33, 33];
const GRAY_TEXT: [number, number, number] = [120, 120, 120];
const LIGHT_GRAY: [number, number, number] = [200, 200, 200];
const PAGE_LEFT = 20;
const PAGE_RIGHT = 190;
const CONTENT_WIDTH = 170;

function drawHeader(pdf: jsPDF, meta: DocumentMeta) {
  pdf.setFillColor(...BRAND_COLOR);
  pdf.rect(0, 0, 210, 4, 'F');

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DARK_TEXT);
  pdf.text(meta.title, PAGE_LEFT, 24);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...GRAY_TEXT);

  let metaY = 34;

  if (meta.type) {
    pdf.text(`Document Type: ${meta.type}`, PAGE_LEFT, metaY);
    metaY += 5;
  }
  if (meta.linkedName) {
    pdf.text(`Associated Party: ${meta.linkedName}`, PAGE_LEFT, metaY);
    metaY += 5;
  }
  if (meta.date) {
    const formatted = new Date(meta.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    pdf.text(`Date: ${formatted}`, PAGE_LEFT, metaY);
    metaY += 5;
  }
  if (meta.expiryDate) {
    const formatted = new Date(meta.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    pdf.text(`Valid Until: ${formatted}`, PAGE_LEFT, metaY);
    metaY += 5;
  }
  if (meta.status) {
    pdf.text(`Status: ${meta.status}`, PAGE_LEFT, metaY);
    metaY += 5;
  }

  metaY += 2;
  pdf.setDrawColor(...LIGHT_GRAY);
  pdf.setLineWidth(0.3);
  pdf.line(PAGE_LEFT, metaY, PAGE_RIGHT, metaY);

  return metaY + 8;
}

function drawFooter(pdf: jsPDF, pageNum: number, totalPages: number) {
  const pageH = pdf.internal.pageSize.getHeight();

  pdf.setDrawColor(...LIGHT_GRAY);
  pdf.setLineWidth(0.2);
  pdf.line(PAGE_LEFT, pageH - 18, PAGE_RIGHT, pageH - 18);

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...GRAY_TEXT);
  pdf.text('MyFinance OS - Confidential Document', PAGE_LEFT, pageH - 12);

  const genDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  pdf.text(`Generated on ${genDate}`, PAGE_LEFT, pageH - 8);

  const pageText = `Page ${pageNum} of ${totalPages}`;
  const textW = pdf.getTextWidth(pageText);
  pdf.text(pageText, PAGE_RIGHT - textW, pageH - 12);
}

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^#{1,4}\s/.test(trimmed)) return true;
  if (/^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length < 80) return true;
  if (/^(?:SECTION|ARTICLE|CLAUSE|PART|SCHEDULE)\s/i.test(trimmed)) return true;
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80 && /[A-Z]/.test(trimmed)) return true;
  return false;
}

function cleanLine(line: string): string {
  return line.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
}

export async function generateDocumentPdf(content: string, meta: DocumentMeta) {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageH = pdf.internal.pageSize.getHeight();
  const bottomMargin = 25;

  let y = drawHeader(pdf, meta);

  if (meta.notes) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(...GRAY_TEXT);
    const noteLines = pdf.splitTextToSize(`Notes: ${meta.notes}`, CONTENT_WIDTH);
    pdf.text(noteLines, PAGE_LEFT, y);
    y += noteLines.length * 4 + 6;
  }

  const rawLines = content.split('\n');

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      y += 3;
      if (y > pageH - bottomMargin) {
        pdf.addPage();
        y = 20;
      }
      continue;
    }

    const heading = isHeadingLine(trimmed);
    const cleaned = cleanLine(trimmed);

    if (heading) {
      if (y > pageH - bottomMargin - 10) {
        pdf.addPage();
        y = 20;
      }
      y += 4;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DARK_TEXT);

      const wrapped = pdf.splitTextToSize(cleaned, CONTENT_WIDTH);
      for (const wl of wrapped) {
        if (y > pageH - bottomMargin) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(wl, PAGE_LEFT, y);
        y += 6;
      }
      y += 2;
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);

      const isBullet = /^[-•]\s/.test(trimmed) || /^\d+\)\s/.test(trimmed);
      const indent = isBullet ? PAGE_LEFT + 5 : PAGE_LEFT;
      const width = isBullet ? CONTENT_WIDTH - 5 : CONTENT_WIDTH;

      let text = cleaned;
      if (isBullet) {
        text = trimmed.replace(/^[-•]\s+/, '').replace(/^\d+\)\s+/, '');
      }

      const wrapped = pdf.splitTextToSize(text, width);
      for (let j = 0; j < wrapped.length; j++) {
        if (y > pageH - bottomMargin) {
          pdf.addPage();
          y = 20;
        }
        if (isBullet && j === 0) {
          pdf.setFillColor(...BRAND_COLOR);
          pdf.circle(indent - 3, y - 1.2, 0.8, 'F');
        }
        pdf.text(wrapped[j], indent, y);
        y += 4.5;
      }
      y += 1;
    }
  }

  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    drawFooter(pdf, p, totalPages);
  }

  const filename = `${meta.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.pdf`;
  pdf.save(filename);
}
