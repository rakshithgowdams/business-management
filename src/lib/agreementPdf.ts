import jsPDF from 'jspdf';
import type { AgreementDraft } from './agreementBuilder/types';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 22;
const MARGIN_R = 22;
const MARGIN_TOP = 20;
const HEADER_H = 22;
const FOOTER_H = 16;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const CONTENT_TOP = MARGIN_TOP + HEADER_H + 6;
const CONTENT_BOTTOM = PAGE_H - FOOTER_H;

const THEMES: Record<string, { primary: number[]; accent: number[]; headerBg: number[]; lightBg: number[]; border: number[]; text: number[]; subtext: number[] }> = {
  bw: { primary: [17, 17, 17], accent: [51, 51, 51], headerBg: [17, 17, 17], lightBg: [232, 232, 232], border: [204, 204, 204], text: [26, 26, 26], subtext: [85, 85, 85] },
  navy: { primary: [26, 58, 108], accent: [45, 90, 160], headerBg: [26, 58, 108], lightBg: [221, 232, 255], border: [165, 184, 232], text: [15, 31, 61], subtext: [45, 74, 138] },
  slate: { primary: [30, 41, 59], accent: [71, 85, 105], headerBg: [30, 41, 59], lightBg: [226, 232, 240], border: [148, 163, 184], text: [15, 23, 42], subtext: [71, 85, 105] },
  'corporate-green': { primary: [20, 83, 45], accent: [22, 101, 52], headerBg: [20, 83, 45], lightBg: [187, 247, 208], border: [134, 239, 172], text: [5, 46, 22], subtext: [21, 128, 61] },
};

function formatIndianDate(dateStr: string): string {
  if (!dateStr) return '____________________';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convert(num: number): string {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  }
  return convert(Math.round(n)) + ' Only';
}

function parseDeliverables(text: string): { deliverable: string; timeline: string }[] {
  return text.split('\n').filter(l => l.trim()).map(line => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      return { deliverable: line.slice(0, idx).replace(/^[•\-\s]+/, '').trim(), timeline: line.slice(idx + 1).trim() };
    }
    return { deliverable: line.replace(/^[•\-\s]+/, '').trim(), timeline: '' };
  });
}

interface Ctx {
  pdf: jsPDF;
  y: number;
  pageNum: number;
  totalPages: number;
  theme: typeof THEMES['bw'];
  draft: AgreementDraft;
  sectionNum: number;
  logoData: string | null;
  logoW: number;
  logoH: number;
}

function loadImageAsBase64(url: string): Promise<{ data: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const c = canvas.getContext('2d');
      if (!c) { reject(new Error('no ctx')); return; }
      c.drawImage(img, 0, 0);
      const data = canvas.toDataURL('image/png');
      resolve({ data, w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

function setColor(ctx: Ctx, c: number[]) {
  ctx.pdf.setTextColor(c[0], c[1], c[2]);
}

function setFill(ctx: Ctx, c: number[]) {
  ctx.pdf.setFillColor(c[0], c[1], c[2]);
}

function setDraw(ctx: Ctx, c: number[]) {
  ctx.pdf.setDrawColor(c[0], c[1], c[2]);
}

function drawPageHeader(ctx: Ctx) {
  const { pdf, theme, draft } = ctx;
  setFill(ctx, theme.headerBg);
  pdf.rect(0, 0, PAGE_W, MARGIN_TOP + HEADER_H, 'F');

  if (ctx.logoData) {
    const maxLogoH = 16;
    const maxLogoW = 50;
    const ratio = ctx.logoW / ctx.logoH;
    let drawW = maxLogoH * ratio;
    let drawH = maxLogoH;
    if (drawW > maxLogoW) {
      drawW = maxLogoW;
      drawH = maxLogoW / ratio;
    }
    const logoY = MARGIN_TOP + (HEADER_H - drawH) / 2;
    pdf.addImage(ctx.logoData, 'PNG', MARGIN_L, logoY, drawW, drawH);
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    setColor(ctx, [255, 255, 255]);
    pdf.text(draft.companyProfile.companyName || 'COMPANY', MARGIN_L, MARGIN_TOP + 5);
  }

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  setColor(ctx, [220, 220, 230]);
  const rightX = PAGE_W - MARGIN_R;
  let hY = MARGIN_TOP + 3;
  if (draft.companyProfile.companyName) { pdf.setFont('helvetica', 'bold'); pdf.text(draft.companyProfile.companyName.toUpperCase(), rightX, hY, { align: 'right' }); pdf.setFont('helvetica', 'normal'); hY += 4; }
  if (draft.companyProfile.email) { pdf.text(draft.companyProfile.email, rightX, hY, { align: 'right' }); hY += 4; }
  if (draft.companyProfile.phone) { pdf.text('Tel: ' + draft.companyProfile.phone, rightX, hY, { align: 'right' }); hY += 4; }
  if (draft.companyProfile.website) { pdf.text(draft.companyProfile.website, rightX, hY, { align: 'right' }); hY += 4; }
  if (draft.companyProfile.gstin) { pdf.text('GSTIN: ' + draft.companyProfile.gstin, rightX, hY, { align: 'right' }); }

  setDraw(ctx, theme.primary);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN_L, MARGIN_TOP + HEADER_H + 2, PAGE_W - MARGIN_R, MARGIN_TOP + HEADER_H + 2);
}

function drawPageFooter(ctx: Ctx) {
  const { pdf, theme, draft, pageNum, totalPages } = ctx;
  const footerY = PAGE_H - FOOTER_H + 2;

  setDraw(ctx, theme.border);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_L, footerY, PAGE_W - MARGIN_R, footerY);

  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  setColor(ctx, [150, 150, 150]);

  let footerText = draft.companyProfile.companyName;
  if (draft.companyProfile.address) footerText += ' | ' + draft.companyProfile.address;
  if (draft.agreementNumber) footerText += ' | Ref: ' + draft.agreementNumber;

  const maxFooterW = CONTENT_W - 40;
  const trimmed = pdf.splitTextToSize(footerText, maxFooterW);
  pdf.text(trimmed[0], MARGIN_L, footerY + 5);

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN_R, footerY + 5, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.text('This document is confidential and intended for the named parties only.', PAGE_W / 2, footerY + 10, { align: 'center' });
}

function newPage(ctx: Ctx) {
  drawPageFooter(ctx);
  ctx.pdf.addPage();
  ctx.pageNum++;
  drawPageHeader(ctx);
  ctx.y = CONTENT_TOP;
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > CONTENT_BOTTOM) {
    newPage(ctx);
  }
}

function wrapText(ctx: Ctx, text: string, maxW: number): string[] {
  return ctx.pdf.splitTextToSize(text, maxW);
}

function drawWrapped(ctx: Ctx, text: string, x: number, fontSize: number, fontStyle: string, color: number[], maxW: number, lineH: number): number {
  ctx.pdf.setFontSize(fontSize);
  ctx.pdf.setFont('helvetica', fontStyle);
  setColor(ctx, color);
  const lines = wrapText(ctx, text, maxW);
  let totalH = 0;
  for (const line of lines) {
    ensureSpace(ctx, lineH);
    ctx.pdf.text(line, x, ctx.y);
    ctx.y += lineH;
    totalH += lineH;
  }
  return totalH;
}

function drawSectionHeader(ctx: Ctx, title: string) {
  ctx.sectionNum++;
  ensureSpace(ctx, 14);

  const circR = 3.5;
  const circX = MARGIN_L + circR;
  const circY = ctx.y - 1;

  setFill(ctx, ctx.theme.primary);
  ctx.pdf.circle(circX, circY, circR, 'F');
  ctx.pdf.setFontSize(7);
  ctx.pdf.setFont('helvetica', 'bold');
  setColor(ctx, [255, 255, 255]);
  ctx.pdf.text(String(ctx.sectionNum), circX, circY + 1, { align: 'center' });

  const textX = MARGIN_L + circR * 2 + 3;
  ctx.pdf.setFontSize(9);
  ctx.pdf.setFont('helvetica', 'bold');
  setColor(ctx, ctx.theme.primary);
  ctx.pdf.text(title.toUpperCase(), textX, ctx.y);

  setDraw(ctx, ctx.theme.primary);
  ctx.pdf.setLineWidth(0.6);
  ctx.pdf.line(textX, ctx.y + 1.5, PAGE_W - MARGIN_R, ctx.y + 1.5);

  ctx.y += 7;
}

function drawTextBlock(ctx: Ctx, text: string) {
  if (!text) return;
  ctx.pdf.setFontSize(8);
  ctx.pdf.setFont('helvetica', 'normal');
  setColor(ctx, ctx.theme.text);

  const lines = wrapText(ctx, text, CONTENT_W - 4);
  const boxPad = 3;

  setDraw(ctx, ctx.theme.border);
  ctx.pdf.setLineWidth(0.2);

  const startY = ctx.y;
  let blockStartY = ctx.y;

  for (let i = 0; i < lines.length; i++) {
    ensureSpace(ctx, 5);
    if (ctx.y < blockStartY) {
      blockStartY = ctx.y;
    }
    ctx.pdf.text(lines[i], MARGIN_L + boxPad, ctx.y);
    ctx.y += 4;
  }
  ctx.y += 2;
}

interface ColDef {
  w: number;
  align?: 'left' | 'center' | 'right';
}

function drawTableRow(ctx: Ctx, cols: ColDef[], values: string[], opts: {
  isHeader?: boolean;
  bgColor?: number[];
  textColor?: number[];
  fontSize?: number;
  fontStyle?: string;
  rowH?: number;
}) {
  const rowH = opts.rowH || 7;
  const fontSize = opts.fontSize || 7.5;
  const fontStyle = opts.fontStyle || 'normal';

  ensureSpace(ctx, rowH + 1);

  if (opts.bgColor) {
    setFill(ctx, opts.bgColor);
    ctx.pdf.rect(MARGIN_L, ctx.y - 4, CONTENT_W, rowH, 'F');
  }

  ctx.pdf.setFontSize(fontSize);
  ctx.pdf.setFont('helvetica', fontStyle);
  setColor(ctx, opts.textColor || ctx.theme.text);

  let x = MARGIN_L + 2;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    const val = values[i] || '';
    const textW = col.w - 4;
    const wrapped = ctx.pdf.splitTextToSize(val, textW);
    const displayText = wrapped[0] || '';

    if (col.align === 'right') {
      ctx.pdf.text(displayText, x + col.w - 4, ctx.y, { align: 'right' });
    } else if (col.align === 'center') {
      ctx.pdf.text(displayText, x + col.w / 2 - 2, ctx.y, { align: 'center' });
    } else {
      ctx.pdf.text(displayText, x, ctx.y);
    }
    x += col.w;
  }

  if (!opts.isHeader) {
    setDraw(ctx, ctx.theme.border);
    ctx.pdf.setLineWidth(0.15);
    ctx.pdf.line(MARGIN_L, ctx.y + (rowH - 4), MARGIN_L + CONTENT_W, ctx.y + (rowH - 4));
  }

  ctx.y += rowH;
}

function drawMultiRowTable(ctx: Ctx, cols: ColDef[], headerValues: string[], rows: string[][], headerRedraw: boolean) {
  drawTableRow(ctx, cols, headerValues, {
    isHeader: true,
    bgColor: ctx.theme.primary,
    textColor: [255, 255, 255],
    fontSize: 7,
    fontStyle: 'bold',
    rowH: 7,
  });

  for (let i = 0; i < rows.length; i++) {
    const needsNewPage = ctx.y + 8 > CONTENT_BOTTOM;
    if (needsNewPage) {
      newPage(ctx);
      if (headerRedraw) {
        drawTableRow(ctx, cols, headerValues, {
          isHeader: true,
          bgColor: ctx.theme.primary,
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          rowH: 7,
        });
      }
    }
    const bgColor = i % 2 === 1 ? [245, 245, 250] : undefined;
    drawTableRow(ctx, cols, rows[i], { bgColor, fontSize: 7.5, fontStyle: 'normal', rowH: 7 });
  }
}

function countTotalPages(draft: AgreementDraft): number {
  let estLines = 0;
  estLines += 20;
  estLines += 12;
  if (draft.scopeOfWork) estLines += Math.ceil(draft.scopeOfWork.length / 80) + 4;
  if (draft.deliverables) estLines += Math.ceil(draft.deliverables.length / 80) + 4;
  estLines += draft.services.length * 2 + 6;
  if (draft.paymentMilestones.length > 0) estLines += draft.paymentMilestones.length * 2 + 4;
  if (draft.paymentTerms) estLines += Math.ceil(draft.paymentTerms.length / 80) + 4;
  if (draft.showBankDetails) estLines += 8;
  if (draft.specialConditions) estLines += Math.ceil(draft.specialConditions.length / 80) + 4;
  if (draft.terminationClause) estLines += Math.ceil(draft.terminationClause.length / 80) + 4;
  if (draft.confidentiality) estLines += Math.ceil(draft.confidentiality.length / 80) + 4;
  if (draft.intellectualProperty) estLines += Math.ceil(draft.intellectualProperty.length / 80) + 4;
  if (draft.limitationOfLiability) estLines += Math.ceil(draft.limitationOfLiability.length / 80) + 4;
  if (draft.warranty) estLines += Math.ceil(draft.warranty.length / 80) + 4;
  if (draft.disputeResolution) estLines += Math.ceil(draft.disputeResolution.length / 80) + 4;
  if (draft.forcemajeure) estLines += Math.ceil(draft.forcemajeure.length / 80) + 4;
  if (draft.governingLaw) estLines += 6;
  if (draft.amendment) estLines += Math.ceil(draft.amendment.length / 80) + 4;
  estLines += 20;

  const linesPerPage = Math.floor((CONTENT_BOTTOM - CONTENT_TOP) / 4);
  return Math.max(1, Math.ceil(estLines / linesPerPage));
}

export async function generateAgreementPdf(draft: AgreementDraft): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const themeKey = (draft.pdfTheme as string) || 'bw';
  const theme = THEMES[themeKey] || THEMES.bw;

  const estPages = countTotalPages(draft);

  let logoData: string | null = null;
  let logoW = 0;
  let logoH = 0;

  if (draft.companyLogo) {
    try {
      const result = await loadImageAsBase64(draft.companyLogo);
      logoData = result.data;
      logoW = result.w;
      logoH = result.h;
    } catch {
      // logo load failed, fall back to text
    }
  }

  const ctx: Ctx = {
    pdf,
    y: 0,
    pageNum: 1,
    totalPages: estPages,
    theme,
    draft,
    sectionNum: 0,
    logoData,
    logoW,
    logoH,
  };

  drawPageHeader(ctx);

  ctx.y = CONTENT_TOP + 2;

  setFill(ctx, theme.lightBg);
  pdf.rect(MARGIN_L - 2, CONTENT_TOP - 3, CONTENT_W + 4, 24, 'F');
  setDraw(ctx, theme.primary);
  pdf.setLineWidth(0.8);
  pdf.line(MARGIN_L - 2, CONTENT_TOP + 21, MARGIN_L + CONTENT_W + 2, CONTENT_TOP + 21);

  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  setColor(ctx, theme.subtext);
  pdf.text(draft.agreementType.toUpperCase(), PAGE_W / 2, ctx.y, { align: 'center' });
  ctx.y += 5;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  setColor(ctx, theme.text);
  const titleLines = wrapText(ctx, (draft.agreementTitle || 'AGREEMENT').toUpperCase(), CONTENT_W - 10);
  for (const line of titleLines) {
    pdf.text(line, PAGE_W / 2, ctx.y, { align: 'center' });
    ctx.y += 6;
  }

  if (draft.agreementSubtitle) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    setColor(ctx, theme.subtext);
    pdf.text(draft.agreementSubtitle, PAGE_W / 2, ctx.y, { align: 'center' });
    ctx.y += 4;
  }

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  setColor(ctx, theme.subtext);
  const metaParts: string[] = [];
  if (draft.agreementNumber) metaParts.push('Ref: ' + draft.agreementNumber);
  metaParts.push('Date: ' + formatIndianDate(draft.agreementDate));
  if (draft.placeOfExecution) metaParts.push('Place: ' + draft.placeOfExecution);
  if (draft.validityPeriod) metaParts.push('Validity: ' + draft.validityPeriod);
  pdf.text(metaParts.join('   |   '), PAGE_W / 2, ctx.y + 2, { align: 'center' });
  ctx.y += 10;

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  setColor(ctx, theme.text);
  const preamble = `This ${draft.agreementType} ("Agreement") is entered into on ${formatIndianDate(draft.agreementDate)}${draft.placeOfExecution ? ' at ' + draft.placeOfExecution : ''} by and between:`;
  drawWrapped(ctx, preamble, MARGIN_L, 8, 'normal', theme.text, CONTENT_W, 4);
  ctx.y += 3;

  drawSectionHeader(ctx, 'Parties to the Agreement');

  const partyCols: ColDef[] = [{ w: 28 }, { w: CONTENT_W - 68 }, { w: 40 }];
  drawTableRow(ctx, partyCols, ['ROLE', 'ENTITY DETAILS', 'SIGNATORY'], {
    isHeader: true, bgColor: theme.primary, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold', rowH: 7,
  });

  const providerDetails = [
    draft.companyProfile.companyName,
    draft.companyProfile.address,
    draft.companyProfile.email ? 'Email: ' + draft.companyProfile.email : '',
    draft.companyProfile.phone ? 'Tel: ' + draft.companyProfile.phone : '',
    draft.companyProfile.gstin ? 'GSTIN: ' + draft.companyProfile.gstin : '',
    draft.companyProfile.pan ? 'PAN: ' + draft.companyProfile.pan : '',
    draft.companyProfile.cin ? 'CIN: ' + draft.companyProfile.cin : '',
  ].filter(Boolean);

  for (let i = 0; i < providerDetails.length; i++) {
    const isFirst = i === 0;
    const isLast = i === providerDetails.length - 1;
    drawTableRow(ctx, partyCols,
      [isFirst ? 'Party 1' : '', providerDetails[i], isFirst ? (draft.companyProfile.signatoryName + (draft.companyProfile.designation ? '\n' + draft.companyProfile.designation : '')) : ''],
      { fontSize: isFirst ? 7.5 : 7, fontStyle: isFirst ? 'bold' : 'normal', rowH: isLast ? 7 : 5, textColor: isFirst ? theme.primary : theme.subtext }
    );
  }

  const clientDetails = [
    draft.client.clientName || 'CLIENT NAME',
    draft.client.companyName,
    draft.client.address,
    draft.client.email ? 'Email: ' + draft.client.email : '',
    draft.client.phone ? 'Tel: ' + draft.client.phone : '',
    draft.client.gstin ? 'GSTIN: ' + draft.client.gstin : '',
    draft.client.pan ? 'PAN: ' + draft.client.pan : '',
  ].filter(Boolean);

  for (let i = 0; i < clientDetails.length; i++) {
    const isFirst = i === 0;
    const isLast = i === clientDetails.length - 1;
    const bgColor = i % 2 === 0 ? [248, 248, 252] : undefined;
    drawTableRow(ctx, partyCols,
      [isFirst ? 'Party 2' : '', clientDetails[i], isFirst ? (draft.client.signatoryName || draft.client.clientName) : ''],
      { fontSize: isFirst ? 7.5 : 7, fontStyle: isFirst ? 'bold' : 'normal', rowH: isLast ? 7 : 5, bgColor, textColor: isFirst ? theme.primary : theme.subtext }
    );
  }
  ctx.y += 3;

  if (draft.scopeOfWork) {
    drawSectionHeader(ctx, 'Scope of Work');
    drawTextBlock(ctx, draft.scopeOfWork);
  }

  if (draft.deliverables) {
    drawSectionHeader(ctx, 'Deliverables & Timeline');
    const rows = parseDeliverables(draft.deliverables);
    const hasTimeline = rows.length > 0 && !!rows[0].timeline;
    if (hasTimeline) {
      const dCols: ColDef[] = [{ w: 10, align: 'center' }, { w: CONTENT_W - 60 }, { w: 50 }];
      const dRows = rows.map((r, i) => [String(i + 1), r.deliverable, r.timeline]);
      drawMultiRowTable(ctx, dCols, ['#', 'DELIVERABLE', 'TIMELINE / DUE DATE'], dRows, true);
    } else {
      drawTextBlock(ctx, draft.deliverables);
    }
    ctx.y += 2;
  }

  drawSectionHeader(ctx, 'Pricing & Financial Terms');

  const subtotal = draft.services.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalGst = draft.includeGst ? draft.services.reduce((sum, s) => sum + (s.amount * (s.gstRate || 0)) / 100, 0) : 0;
  const grandTotal = subtotal + totalGst;

  const priceColsBase: ColDef[] = draft.includeGst
    ? [{ w: 8, align: 'center' }, { w: 38 }, { w: 42 }, { w: 14, align: 'center' }, { w: 22, align: 'right' }, { w: 14, align: 'center' }, { w: 14, align: 'right' }, { w: 14, align: 'right' }]
    : [{ w: 8, align: 'center' }, { w: 46 }, { w: 52 }, { w: 18, align: 'center' }, { w: 22, align: 'right' }, { w: 20, align: 'right' }];

  const priceHeadersBase = draft.includeGst
    ? ['#', 'SERVICE', 'DESCRIPTION', 'QTY', 'RATE', 'GST%', 'GST AMT', 'AMOUNT']
    : ['#', 'SERVICE', 'DESCRIPTION', 'QTY', 'RATE', 'AMOUNT'];

  const priceRows = draft.services.filter(s => s.service).map((s, i) => {
    const gstAmt = draft.includeGst ? (s.amount * s.gstRate) / 100 : 0;
    if (draft.includeGst) {
      return [String(i + 1), s.service, s.description, `${s.quantity} ${s.unit}`, `Rs.${fmt(s.rate)}`, `${s.gstRate}%`, `Rs.${fmt(Math.round(gstAmt))}`, `Rs.${fmt(Math.round(s.amount + gstAmt))}`];
    }
    return [String(i + 1), s.service, s.description, `${s.quantity} ${s.unit}`, `Rs.${fmt(s.rate)}`, `Rs.${fmt(s.amount)}`];
  });

  drawMultiRowTable(ctx, priceColsBase, priceHeadersBase, priceRows, true);

  if (draft.includeGst) {
    ensureSpace(ctx, 16);
    drawTableRow(ctx, priceColsBase,
      ['', '', '', '', 'Subtotal', '', '', `Rs.${fmt(subtotal)}`],
      { bgColor: theme.lightBg, fontSize: 7, fontStyle: 'bold', rowH: 6 }
    );
    drawTableRow(ctx, priceColsBase,
      ['', '', '', '', 'Total GST', '', '', `Rs.${fmt(Math.round(totalGst))}`],
      { bgColor: theme.lightBg, fontSize: 7, fontStyle: 'bold', rowH: 6 }
    );
  }

  ensureSpace(ctx, 10);
  drawTableRow(ctx, [{ w: CONTENT_W - 30 }, { w: 30, align: 'right' }],
    [`TOTAL CONSIDERATION ${draft.includeGst ? '(incl. GST)' : ''}`, `Rs.${fmt(Math.round(grandTotal))}`],
    { bgColor: theme.primary, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', rowH: 8 }
  );

  ensureSpace(ctx, 6);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  setColor(ctx, theme.subtext);
  pdf.text(`Amount in Words: Indian Rupees ${numberToWords(Math.round(grandTotal))}`, MARGIN_L, ctx.y);
  ctx.y += 6;

  if (draft.paymentMilestones.length > 0) {
    ensureSpace(ctx, 12);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    setColor(ctx, theme.primary);
    pdf.text('Payment Schedule:', MARGIN_L, ctx.y);
    ctx.y += 5;

    const mCols: ColDef[] = [{ w: 8, align: 'center' }, { w: CONTENT_W - 58 }, { w: 16, align: 'center' }, { w: 20, align: 'right' }, { w: 14 }];
    const mRows = draft.paymentMilestones.map((m, i) => [String(i + 1), m.label, `${m.percentage}%`, `Rs.${fmt(m.amount)}`, m.dueOn]);
    drawMultiRowTable(ctx, mCols, ['#', 'MILESTONE', '%', 'AMOUNT', 'DUE ON'], mRows, true);
    ctx.y += 2;
  }

  if (draft.paymentTerms) {
    drawSectionHeader(ctx, 'Payment Terms & Conditions');
    drawTextBlock(ctx, draft.paymentTerms);
  }

  if (draft.showBankDetails && (draft.companyProfile.bankName || draft.companyProfile.bankAccount)) {
    ensureSpace(ctx, 14);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    setColor(ctx, theme.primary);
    pdf.text('BANK DETAILS FOR PAYMENT', MARGIN_L, ctx.y);
    ctx.y += 5;

    const bankItems = [
      ['Bank Name', draft.companyProfile.bankName],
      ['Account Name', draft.companyProfile.companyName],
      ['Account Number', draft.companyProfile.bankAccount],
      ['IFSC Code', draft.companyProfile.bankIfsc],
      ['Branch', draft.companyProfile.bankBranch],
    ].filter(([, v]) => v);

    const bCols: ColDef[] = [{ w: 40 }, { w: CONTENT_W - 40 }];
    for (let i = 0; i < bankItems.length; i++) {
      const bgColor = i % 2 === 0 ? [248, 248, 252] : undefined;
      drawTableRow(ctx, bCols, [bankItems[i][0], bankItems[i][1]], { fontSize: 7.5, fontStyle: 'normal', rowH: 6, bgColor });
    }
    ctx.y += 3;
  }

  const legalSections: [string, string][] = [
    ['Special Conditions & Compliance', draft.specialConditions],
    ['Termination', draft.terminationClause],
    ['Confidentiality & Non-Disclosure', draft.confidentiality],
    ['Intellectual Property Rights', draft.intellectualProperty],
    ['Limitation of Liability', draft.limitationOfLiability],
    ['Warranties & Representations', draft.warranty],
    ['Dispute Resolution', draft.disputeResolution],
    ['Force Majeure', draft.forcemajeure],
  ];

  for (const [title, content] of legalSections) {
    if (content) {
      drawSectionHeader(ctx, title);
      drawTextBlock(ctx, content);
    }
  }

  if (draft.governingLaw) {
    drawSectionHeader(ctx, 'Governing Law & Jurisdiction');
    drawTextBlock(ctx, `This Agreement shall be governed by and construed in accordance with the ${draft.governingLaw}. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts in the jurisdiction specified herein.`);
  }

  if (draft.amendment) {
    drawSectionHeader(ctx, 'Amendment, Notices & Entire Agreement');
    drawTextBlock(ctx, draft.amendment);
  }

  drawSectionHeader(ctx, 'Execution & Signatures');
  drawTextBlock(ctx, `IN WITNESS WHEREOF, the parties hereto have executed this ${draft.agreementType} as of the date first written above. Each party represents and warrants that the person signing below has the authority to bind such party to this Agreement.`);

  ensureSpace(ctx, 50);

  const sigColW = CONTENT_W / 2;
  const sigStartY = ctx.y;

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  setFill(ctx, theme.primary);
  pdf.rect(MARGIN_L, ctx.y - 4, sigColW, 7, 'F');
  pdf.rect(MARGIN_L + sigColW, ctx.y - 4, sigColW, 7, 'F');
  setColor(ctx, [255, 255, 255]);
  pdf.text('FOR AND ON BEHALF OF SERVICE PROVIDER', MARGIN_L + 3, ctx.y);
  pdf.text('FOR AND ON BEHALF OF CLIENT', MARGIN_L + sigColW + 3, ctx.y);
  ctx.y += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(ctx, theme.text);
  pdf.text(draft.companyProfile.companyName, MARGIN_L + 3, ctx.y);
  pdf.text(draft.client.clientName || 'CLIENT NAME', MARGIN_L + sigColW + 3, ctx.y);
  ctx.y += 4;

  if (draft.companyProfile.gstin) {
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    setColor(ctx, theme.subtext);
    pdf.text('GSTIN: ' + draft.companyProfile.gstin, MARGIN_L + 3, ctx.y);
  }
  if (draft.client.gstin) {
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    setColor(ctx, theme.subtext);
    pdf.text('GSTIN: ' + draft.client.gstin, MARGIN_L + sigColW + 3, ctx.y);
  }
  ctx.y += 12;

  setDraw(ctx, theme.accent);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN_L + 3, ctx.y, MARGIN_L + sigColW - 10, ctx.y);
  pdf.line(MARGIN_L + sigColW + 3, ctx.y, MARGIN_L + CONTENT_W - 10, ctx.y);
  ctx.y += 3;

  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  setColor(ctx, theme.subtext);
  pdf.text('Authorised Signature', MARGIN_L + 3, ctx.y);
  pdf.text('Authorised Signature', MARGIN_L + sigColW + 3, ctx.y);
  ctx.y += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(ctx, theme.text);
  pdf.text(draft.companyProfile.signatoryName, MARGIN_L + 3, ctx.y);
  pdf.text(draft.client.signatoryName || draft.client.clientName, MARGIN_L + sigColW + 3, ctx.y);
  ctx.y += 4;

  if (draft.companyProfile.designation) {
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    setColor(ctx, theme.subtext);
    pdf.text(draft.companyProfile.designation, MARGIN_L + 3, ctx.y);
  }
  if (draft.client.designation) {
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    setColor(ctx, theme.subtext);
    pdf.text(draft.client.designation, MARGIN_L + sigColW + 3, ctx.y);
  }
  ctx.y += 4;

  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  setColor(ctx, theme.subtext);
  pdf.text('Date: ' + formatIndianDate(draft.agreementDate), MARGIN_L + 3, ctx.y);
  pdf.text('Date: ____________________', MARGIN_L + sigColW + 3, ctx.y);
  ctx.y += 4;

  if (draft.companyProfile.address) {
    pdf.setFontSize(6);
    pdf.text('Place: ' + draft.companyProfile.address.split(',').slice(-2).join(',').trim(), MARGIN_L + 3, ctx.y);
  }
  if (draft.client.address) {
    pdf.setFontSize(6);
    pdf.text('Place: ' + draft.client.address.split(',').slice(-2).join(',').trim(), MARGIN_L + sigColW + 3, ctx.y);
  }
  ctx.y += 4;

  setDraw(ctx, theme.border);
  pdf.setLineWidth(0.15);
  pdf.line(MARGIN_L + sigColW, sigStartY - 4, MARGIN_L + sigColW, ctx.y);

  if (draft.witnessName1 || draft.witnessName2) {
    ctx.y += 5;
    ensureSpace(ctx, 30);

    setFill(ctx, theme.lightBg);
    pdf.rect(MARGIN_L, ctx.y - 4, CONTENT_W, 7, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    setColor(ctx, theme.subtext);
    pdf.text('WITNESS 1', MARGIN_L + 3, ctx.y);
    pdf.text('WITNESS 2', MARGIN_L + sigColW + 3, ctx.y);
    ctx.y += 10;

    setDraw(ctx, theme.accent);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_L + 3, ctx.y, MARGIN_L + sigColW - 10, ctx.y);
    pdf.line(MARGIN_L + sigColW + 3, ctx.y, MARGIN_L + CONTENT_W - 10, ctx.y);
    ctx.y += 3;

    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    setColor(ctx, theme.subtext);
    pdf.text('Signature', MARGIN_L + 3, ctx.y);
    pdf.text('Signature', MARGIN_L + sigColW + 3, ctx.y);
    ctx.y += 5;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    setColor(ctx, theme.text);
    pdf.text(draft.witnessName1 || '____________________', MARGIN_L + 3, ctx.y);
    pdf.text(draft.witnessName2 || '____________________', MARGIN_L + sigColW + 3, ctx.y);
    ctx.y += 5;

    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    setColor(ctx, theme.subtext);
    pdf.text('Date: ____________________', MARGIN_L + 3, ctx.y);
    pdf.text('Date: ____________________', MARGIN_L + sigColW + 3, ctx.y);
    ctx.y += 4;
  }

  ctx.y += 6;
  ensureSpace(ctx, 14);
  setDraw(ctx, theme.primary);
  pdf.setLineWidth(0.6);
  pdf.line(MARGIN_L, ctx.y, PAGE_W - MARGIN_R, ctx.y);
  ctx.y += 4;

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  setColor(ctx, theme.subtext);
  const closingText = 'This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter hereof.';
  const closingLines = wrapText(ctx, closingText, CONTENT_W);
  for (const line of closingLines) {
    ensureSpace(ctx, 4);
    pdf.text(line, PAGE_W / 2, ctx.y, { align: 'center' });
    ctx.y += 4;
  }

  ctx.totalPages = ctx.pageNum;

  for (let p = 1; p <= ctx.totalPages; p++) {
    pdf.setPage(p);
    ctx.pageNum = p;
    drawPageFooter(ctx);
  }

  return pdf;
}
