import type { BriefData } from '../pages/dashboard/meetingprep/MeetingBrief';

type JsPDF = import('jspdf').jsPDF;
type RGB = [number, number, number];

const BRAND: RGB = [255, 107, 0];
const NAVY: RGB = [15, 23, 42];
const WHITE: RGB = [255, 255, 255];
const SLATE_50: RGB = [248, 250, 252];
const SLATE_200: RGB = [226, 232, 240];
const SLATE_400: RGB = [148, 163, 184];
const SLATE_600: RGB = [71, 85, 105];
const GREEN: RGB = [16, 185, 129];
const RED: RGB = [239, 68, 68];
const YELLOW: RGB = [245, 158, 11];
const BLUE: RGB = [59, 130, 246];

const LH = 4.2;
const PW = 210;
const MX = 16;
const CW = PW - MX * 2;
const MAX_Y = 275;

interface ExportMeetingData {
  brief: BriefData;
  clientName: string;
  meetingType: string;
  date?: string;
  businessLogoUrl?: string;
}

function rr(doc: JsPDF, x: number, y: number, w: number, h: number, r: number, fill?: RGB, stroke?: RGB) {
  if (fill) doc.setFillColor(...fill);
  if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(0.3); }
  doc.roundedRect(x, y, w, h, r, r, fill && stroke ? 'FD' : fill ? 'F' : 'S');
}

function wrapText(doc: JsPDF, text: string, maxW: number, fontSize: number): string[] {
  if (!text) return [''];
  doc.setFontSize(fontSize);
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (doc.getTextWidth(test) > maxW) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

class PdfBuilder {
  doc: JsPDF;
  y = 0;

  constructor(doc: JsPDF) { this.doc = doc; }

  checkPage(need: number) {
    if (this.y + need > MAX_Y) { this.doc.addPage(); this.y = 16; }
  }

  sectionTitle(title: string) {
    this.checkPage(14);
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...NAVY);
    this.doc.text(title, MX, this.y);
    this.doc.setFillColor(...BRAND);
    this.doc.rect(MX, this.y + 2, 32, 1, 'F');
    this.y += 10;
  }

  drawBulletCard(text: string, bulletColor: RGB, bgColor: RGB, borderColor: RGB, textInset = 10) {
    const lines = wrapText(this.doc, text, CW - textInset - 8, 8.5);
    const pad = 5;
    const h = pad * 2 + lines.length * LH;
    this.checkPage(h + 2);

    rr(this.doc, MX, this.y, CW, h, 2, bgColor, borderColor);
    this.doc.setFillColor(...bulletColor);
    this.doc.circle(MX + 5, this.y + pad + 1, 1.2, 'F');
    this.doc.setFontSize(8.5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...SLATE_600);
    lines.forEach((l, i) => this.doc.text(l, MX + textInset, this.y + pad + 1.5 + i * LH));
    this.y += h + 2;
  }

  drawNumberedCard(text: string, num: number) {
    const lines = wrapText(this.doc, text, CW - 20, 8.5);
    const pad = 5;
    const h = pad * 2 + Math.max(7, lines.length * LH);
    this.checkPage(h + 2);

    rr(this.doc, MX, this.y, CW, h, 2, SLATE_50, SLATE_200);
    const numW = 7;
    rr(this.doc, MX + 3, this.y + pad - 1, numW, numW, 3, BRAND);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...WHITE);
    this.doc.text(`${num}`, MX + 3 + numW / 2, this.y + pad + 2.5, { align: 'center' });

    this.doc.setFontSize(8.5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...NAVY);
    lines.forEach((l, i) => this.doc.text(l, MX + 14, this.y + pad + 1.5 + i * LH));
    this.y += h + 2;
  }

  drawObjectionCard(objection: string, handling: string, num: number) {
    const objLines = wrapText(this.doc, `"${objection}"`, CW - 18, 9);
    const handleLines = wrapText(this.doc, handling, CW - 18, 8.5);
    const badgeH = 8;
    const gap = 3;
    const handleLabelH = 6;
    const padTop = 5;
    const padBot = 6;
    const h = padTop + badgeH + gap + objLines.length * LH + gap + handleLabelH + handleLines.length * LH + padBot;
    this.checkPage(h + 4);

    rr(this.doc, MX, this.y, CW, h, 3, WHITE, SLATE_200);
    this.doc.setFillColor(...YELLOW);
    this.doc.rect(MX, this.y, 3, h, 'F');

    let ly = this.y + padTop;
    const numBadgeW = 20;
    rr(this.doc, MX + 7, ly, numBadgeW, 5.5, 2, YELLOW);
    this.doc.setFontSize(6.5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...WHITE);
    this.doc.text(`OBJECTION ${num}`, MX + 7 + numBadgeW / 2, ly + 3.8, { align: 'center' });
    ly += badgeH + gap;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...NAVY);
    objLines.forEach((l) => { this.doc.text(l, MX + 8, ly); ly += LH; });
    ly += gap;

    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...GREEN);
    this.doc.text('HOW TO HANDLE:', MX + 8, ly);
    ly += handleLabelH;

    this.doc.setFontSize(8.5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...SLATE_600);
    handleLines.forEach((l) => { this.doc.text(l, MX + 8, ly); ly += LH; });

    this.y += h + 4;
  }

  drawStrategyCard(label: string, badge: string, text: string, color: RGB, bg: RGB) {
    const lines = wrapText(this.doc, text, CW - 14, 8.5);
    const topPad = 5;
    const badgeRow = 8;
    const gap = 3;
    const botPad = 5;
    const h = topPad + badgeRow + gap + lines.length * LH + botPad;
    this.checkPage(h + 3);

    rr(this.doc, MX, this.y, CW, h, 3, bg, SLATE_200);
    this.doc.setFillColor(...color);
    this.doc.rect(MX, this.y, 2.5, h, 'F');

    let ly = this.y + topPad;
    this.doc.setFontSize(6.5);
    this.doc.setFont('helvetica', 'bold');
    const badgeW = this.doc.getTextWidth(badge) + 8;
    rr(this.doc, MX + 7, ly - 1, badgeW, 5.5, 2, color);
    this.doc.setTextColor(...WHITE);
    this.doc.text(badge, MX + 7 + badgeW / 2, ly + 2.5, { align: 'center' });

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...color);
    this.doc.text(label, MX + 9 + badgeW, ly + 2);
    ly += badgeRow + gap;

    this.doc.setFontSize(8.5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...SLATE_600);
    lines.forEach((l) => { this.doc.text(l, MX + 8, ly); ly += LH; });

    this.y += h + 3;
  }
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportMeetingPrepPDF(data: ExportMeetingData) {
  const jsPDF = (await import('jspdf')).default;
  const doc = new jsPDF('p', 'mm', 'a4');
  const b = new PdfBuilder(doc);

  const { brief, clientName, meetingType, date, businessLogoUrl } = data;
  const generated = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  let logoDataUrl: string | null = null;
  if (businessLogoUrl) logoDataUrl = await loadImageAsDataUrl(businessLogoUrl);

  rr(doc, 0, 0, PW, 50, 0, NAVY);
  doc.setFillColor(...BRAND);
  doc.rect(0, 48, PW, 2.5, 'F');

  const textStartX = logoDataUrl ? MX + 20 : MX;
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', MX, 8, 14, 14); } catch { /* skip */ }
  }

  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Meeting Prep Brief', textStartX, 16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  doc.text(clientName, textStartX, 25);

  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE_400);
  doc.text(`${meetingType}${date ? `  |  ${date}` : ''}`, textStartX, 32);
  doc.setFontSize(7);
  doc.text(`Generated: ${generated}`, textStartX, 38);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const typeBadgeW = doc.getTextWidth(meetingType) + 10;
  rr(doc, PW - MX - typeBadgeW, 9, typeBadgeW, 7, 3, BRAND);
  doc.setTextColor(...WHITE);
  doc.text(meetingType, PW - MX - typeBadgeW / 2, 13.5, { align: 'center' });

  b.y = 56;

  // Opening Line
  const olLines = wrapText(doc, `"${brief.OPENING_LINE}"`, CW - 18, 9);
  const olPad = 5;
  const olLabelH = 6;
  const olH = olPad + olLabelH + olLines.length * LH + olPad;
  b.checkPage(olH + 6);
  rr(doc, MX, b.y, CW, olH, 3, [255, 247, 237], [255, 237, 213]);
  doc.setFillColor(...BRAND);
  doc.rect(MX, b.y, 3, olH, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND);
  doc.text('OPENING LINE', MX + 8, b.y + olPad + 3);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...NAVY);
  olLines.forEach((l, i) => doc.text(l, MX + 8, b.y + olPad + olLabelH + 2 + i * LH));
  b.y += olH + 6;

  // Client Snapshot
  b.sectionTitle('Client Snapshot');
  brief.CLIENT_SNAPSHOT.forEach((item) => {
    b.drawBulletCard(item, BLUE, SLATE_50, SLATE_200);
  });
  b.y += 3;

  // Relationship Status & Last Discussed
  const halfW = (CW - 6) / 2;
  const rsLines = wrapText(doc, brief.RELATIONSHIP_STATUS, halfW - 12, 8.5);
  const ldLines = wrapText(doc, brief.LAST_DISCUSSED, halfW - 12, 8.5);
  const maxPairLines = Math.max(rsLines.length, ldLines.length);
  const pairPadTop = 10;
  const pairPadBot = 5;
  const pairTopBorder = 2;
  const pairH = pairTopBorder + pairPadTop + maxPairLines * LH + pairPadBot;
  b.checkPage(pairH + 6);

  rr(doc, MX, b.y, halfW, pairH, 3, WHITE, SLATE_200);
  doc.setFillColor(...GREEN);
  doc.rect(MX, b.y, halfW, pairTopBorder, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text('RELATIONSHIP STATUS', MX + 5, b.y + pairTopBorder + 6);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_600);
  rsLines.forEach((l, i) => doc.text(l, MX + 5, b.y + pairTopBorder + pairPadTop + i * LH));

  const rx = MX + halfW + 6;
  rr(doc, rx, b.y, halfW, pairH, 3, WHITE, SLATE_200);
  doc.setFillColor(...BLUE);
  doc.rect(rx, b.y, halfW, pairTopBorder, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('LAST DISCUSSED', rx + 5, b.y + pairTopBorder + 6);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE_600);
  ldLines.forEach((l, i) => doc.text(l, rx + 5, b.y + pairTopBorder + pairPadTop + i * LH));
  b.y += pairH + 6;

  // Talking Points
  b.sectionTitle('Talking Points');
  brief.TALKING_POINTS.forEach((point, i) => b.drawNumberedCard(point, i + 1));
  b.y += 3;

  // Pain Points
  b.sectionTitle('Client Pain Points');
  brief.PAIN_POINTS.forEach((p) => b.drawBulletCard(p, RED, [254, 242, 242], [254, 202, 202]));
  b.y += 3;

  // Buying Signals
  if (brief.BUYING_SIGNALS.length > 0) {
    b.sectionTitle('Buying Signals');
    brief.BUYING_SIGNALS.forEach((s) => b.drawBulletCard(s, GREEN, [236, 253, 245], [167, 243, 208]));
    b.y += 3;
  }

  // Objections
  if (brief.OBJECTIONS.length > 0) {
    b.sectionTitle('Handle Objections');
    brief.OBJECTIONS.forEach((o, i) => b.drawObjectionCard(o.objection, o.handling, i + 1));
    b.y += 2;
  }

  // Strategy Cards
  b.sectionTitle('Strategy & Reminders');
  b.drawStrategyCard('Close Strategy', 'CLOSE', brief.CLOSE_STRATEGY, GREEN, [236, 253, 245]);
  b.drawStrategyCard('Upsell Opportunity', 'UPSELL', brief.UPSELL_OPPORTUNITY, BLUE, [239, 246, 255]);
  b.drawStrategyCard('Danger Zone', 'AVOID', brief.DANGER_ZONE, RED, [254, 242, 242]);
  b.drawStrategyCard('Success Metric', 'SUCCESS', brief.SUCCESS_METRIC, GREEN, [236, 253, 245]);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...SLATE_50);
    doc.rect(0, 287, PW, 10, 'F');
    doc.setDrawColor(...SLATE_200);
    doc.line(MX, 287, PW - MX, 287);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_400);
    doc.text('MyFinance OS - AI Meeting Prep Brief', MX, 292);
    doc.text('Confidential', PW / 2, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, PW - MX, 292, { align: 'right' });
  }

  doc.save(`meeting-brief-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function exportMeetingPrepWord(data: ExportMeetingData) {
  const { brief, clientName, meetingType, date } = data;
  const generated = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const sectionHeading = (title: string) =>
    `<h2 style="color:#0F172A;font-size:13pt;margin:20px 0 8px 0;border-bottom:2px solid #FF6B00;padding-bottom:5px;">${title}</h2>`;

  const bulletItem = (item: string, color: string) =>
    `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:3px solid ${color};padding:6px 10px;margin-bottom:3px;">
      <p style="margin:0;font-size:9pt;color:#475569;line-height:1.4;">${escHtml(item)}</p>
    </div>`;

  const snapshotHtml = brief.CLIENT_SNAPSHOT.map(i => bulletItem(i, '#3B82F6')).join('');
  const painHtml = brief.PAIN_POINTS.map(i => bulletItem(i, '#EF4444')).join('');
  const signalsHtml = brief.BUYING_SIGNALS.map(i => bulletItem(i, '#10B981')).join('');

  let talkingHtml = '';
  brief.TALKING_POINTS.forEach((point, i) => {
    talkingHtml += `
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;padding:8px 10px;margin-bottom:3px;">
        <table style="width:100%;"><tr>
          <td style="width:22px;vertical-align:top;">
            <div style="background:#FF6B00;color:white;width:18px;height:18px;border-radius:9px;text-align:center;line-height:18px;font-size:8pt;font-weight:bold;">${i + 1}</div>
          </td>
          <td style="padding-left:6px;font-size:9pt;color:#0F172A;line-height:1.4;">${escHtml(point)}</td>
        </tr></table>
      </div>`;
  });

  let objectionsHtml = '';
  brief.OBJECTIONS.forEach((o, i) => {
    objectionsHtml += `
      <div style="background:white;border:1px solid #E2E8F0;border-left:3px solid #F59E0B;padding:10px 12px;margin-bottom:6px;">
        <span style="background:#F59E0B;color:white;padding:1px 8px;border-radius:6px;font-size:7pt;font-weight:bold;">OBJECTION ${i + 1}</span>
        <p style="margin:6px 0 4px 0;font-size:9pt;font-style:italic;color:#0F172A;line-height:1.4;">"${escHtml(o.objection)}"</p>
        <p style="margin:0;font-size:7pt;font-weight:bold;color:#10B981;">HOW TO HANDLE:</p>
        <p style="margin:3px 0 0 0;font-size:9pt;color:#475569;line-height:1.4;">${escHtml(o.handling)}</p>
      </div>`;
  });

  const stratCards: { label: string; badge: string; text: string; color: string; bg: string }[] = [
    { label: 'Close Strategy', badge: 'CLOSE', text: brief.CLOSE_STRATEGY, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Upsell Opportunity', badge: 'UPSELL', text: brief.UPSELL_OPPORTUNITY, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Danger Zone', badge: 'AVOID', text: brief.DANGER_ZONE, color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Success Metric', badge: 'SUCCESS', text: brief.SUCCESS_METRIC, color: '#10B981', bg: '#ECFDF5' },
  ];

  let strategyHtml = '';
  stratCards.forEach((card) => {
    strategyHtml += `
      <div style="background:${card.bg};border-left:3px solid ${card.color};padding:10px 12px;margin-bottom:6px;">
        <table style="width:100%;"><tr>
          <td style="vertical-align:top;width:auto;">
            <span style="background:${card.color};color:white;padding:1px 6px;border-radius:6px;font-size:7pt;font-weight:bold;">${card.badge}</span>
          </td>
          <td style="padding-left:6px;">
            <p style="margin:0 0 2px 0;font-weight:bold;color:${card.color};font-size:9pt;">${card.label}</p>
            <p style="margin:0;color:#334155;font-size:9pt;line-height:1.4;">${escHtml(card.text)}</p>
          </td>
        </tr></table>
      </div>`;
  });

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word"
        xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    body { font-family: Calibri, Arial, sans-serif; color: #334155; margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    p { margin: 0; }
  </style>
</head>
<body>
  <div style="background:#0F172A;padding:16px 20px;">
    <table style="width:100%;"><tr>
      <td style="vertical-align:top;">
        <h1 style="margin:0;color:white;font-size:18pt;">Meeting Prep Brief</h1>
        <p style="margin:4px 0 0 0;color:#B4C8DC;font-size:11pt;">${escHtml(clientName)}</p>
        <p style="margin:3px 0 0 0;color:#94A3B8;font-size:8pt;">${escHtml(meetingType)}${date ? `  |  ${escHtml(date)}` : ''}</p>
        <p style="margin:3px 0 0 0;color:#64748B;font-size:7pt;">Generated: ${generated}</p>
      </td>
      <td style="text-align:right;vertical-align:top;width:120px;">
        <div style="background:#FF6B00;color:white;padding:5px 12px;border-radius:6px;display:inline-block;text-align:center;font-size:8pt;font-weight:bold;">
          ${escHtml(meetingType)}
        </div>
      </td>
    </tr></table>
  </div>
  <div style="background:#FF6B00;height:2px;margin-bottom:2px;"></div>

  <div style="background:#FFF7ED;border:1px solid #FFEDD5;border-left:3px solid #FF6B00;padding:10px 14px;margin:12px 0;">
    <p style="margin:0 0 2px 0;font-size:7pt;font-weight:bold;color:#FF6B00;">OPENING LINE</p>
    <p style="margin:0;font-size:9pt;font-style:italic;color:#0F172A;line-height:1.4;">"${escHtml(brief.OPENING_LINE)}"</p>
  </div>

  ${sectionHeading('Client Snapshot')}
  ${snapshotHtml}

  <table style="width:100%;margin-top:8px;"><tr>
    <td style="width:49%;vertical-align:top;padding-right:4px;">
      <div style="background:white;border:1px solid #E2E8F0;border-top:2px solid #10B981;padding:8px 10px;">
        <p style="margin:0 0 3px 0;font-size:7pt;font-weight:bold;color:#10B981;text-transform:uppercase;">Relationship Status</p>
        <p style="margin:0;font-size:8pt;color:#475569;line-height:1.4;">${escHtml(brief.RELATIONSHIP_STATUS)}</p>
      </div>
    </td>
    <td style="width:49%;vertical-align:top;padding-left:4px;">
      <div style="background:white;border:1px solid #E2E8F0;border-top:2px solid #3B82F6;padding:8px 10px;">
        <p style="margin:0 0 3px 0;font-size:7pt;font-weight:bold;color:#3B82F6;text-transform:uppercase;">Last Discussed</p>
        <p style="margin:0;font-size:8pt;color:#475569;line-height:1.4;">${escHtml(brief.LAST_DISCUSSED)}</p>
      </div>
    </td>
  </tr></table>

  ${sectionHeading('Talking Points')}
  ${talkingHtml}

  ${sectionHeading('Client Pain Points')}
  ${painHtml}

  ${brief.BUYING_SIGNALS.length > 0 ? `
    ${sectionHeading('Buying Signals')}
    ${signalsHtml}
  ` : ''}

  ${brief.OBJECTIONS.length > 0 ? `
    ${sectionHeading('Handle Objections')}
    ${objectionsHtml}
  ` : ''}

  ${sectionHeading('Strategy & Reminders')}
  ${strategyHtml}

  <div style="border-top:1px solid #E2E8F0;margin-top:20px;padding-top:8px;">
    <table style="width:100%;"><tr>
      <td style="font-size:7pt;color:#94A3B8;">MyFinance OS - AI Meeting Prep Brief</td>
      <td style="font-size:7pt;color:#94A3B8;text-align:center;">Confidential</td>
      <td style="font-size:7pt;color:#94A3B8;text-align:right;">${generated}</td>
    </tr></table>
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meeting-brief-${clientName.toLowerCase().replace(/\s+/g, '-')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
