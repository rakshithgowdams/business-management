import type { BusinessMetrics } from './businessData';

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

interface AIWeeklyInsight {
  WEEK_SUMMARY: string;
  BEST_THING: string;
  CONCERN: string;
  NEXT_WEEK_PRIORITY: string[];
  MOTIVATION: string;
}

interface WeeklySummaryExportData {
  metrics: BusinessMetrics;
  insight: AIWeeklyInsight;
  weekLabel: string;
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

function fmtINR(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
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

  drawKPIRow(cards: { label: string; value: string; sub: string; color: RGB }[]) {
    const gap = 4;
    const count = cards.length;
    const cardW = (CW - gap * (count - 1)) / count;
    const cardH = 26;
    this.checkPage(cardH + 4);

    cards.forEach((card, i) => {
      const cx = MX + i * (cardW + gap);
      rr(this.doc, cx, this.y, cardW, cardH, 3, SLATE_50, SLATE_200);
      this.doc.setFillColor(...card.color);
      this.doc.rect(cx, this.y, cardW, 2, 'F');

      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...SLATE_400);
      this.doc.text(card.label, cx + cardW / 2, this.y + 8, { align: 'center' });

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...NAVY);
      this.doc.text(card.value, cx + cardW / 2, this.y + 15, { align: 'center' });

      this.doc.setFontSize(6.5);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...SLATE_600);
      const subTrunc = this.doc.getTextWidth(card.sub) > cardW - 4
        ? card.sub.substring(0, Math.floor(card.sub.length * (cardW - 6) / this.doc.getTextWidth(card.sub))) + '...'
        : card.sub;
      this.doc.text(subTrunc, cx + cardW / 2, this.y + 21, { align: 'center' });
    });

    this.y += cardH + 5;
  }

  drawMetricPair(left: { label: string; value: string; color: RGB }, right: { label: string; value: string; color: RGB }) {
    const halfW = (CW - 6) / 2;
    const h = 18;
    this.checkPage(h + 4);

    rr(this.doc, MX, this.y, halfW, h, 3, WHITE, SLATE_200);
    this.doc.setFillColor(...left.color);
    this.doc.rect(MX, this.y, 2.5, h, 'F');
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...left.color);
    this.doc.text(left.label.toUpperCase(), MX + 7, this.y + 7);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...NAVY);
    this.doc.text(left.value, MX + 7, this.y + 14);

    const rx = MX + halfW + 6;
    rr(this.doc, rx, this.y, halfW, h, 3, WHITE, SLATE_200);
    this.doc.setFillColor(...right.color);
    this.doc.rect(rx, this.y, 2.5, h, 'F');
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...right.color);
    this.doc.text(right.label.toUpperCase(), rx + 7, this.y + 7);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...NAVY);
    this.doc.text(right.value, rx + 7, this.y + 14);

    this.y += h + 4;
  }

  drawHighlightCard(label: string, text: string, color: RGB, bg: RGB) {
    const lines = wrapText(this.doc, text, CW - 14, 8.5);
    const topPad = 5;
    const labelH = 7;
    const botPad = 5;
    const h = topPad + labelH + lines.length * LH + botPad;
    this.checkPage(h + 3);

    rr(this.doc, MX, this.y, CW, h, 3, bg, SLATE_200);
    this.doc.setFillColor(...color);
    this.doc.rect(MX, this.y, 2.5, h, 'F');

    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...color);
    this.doc.text(label.toUpperCase(), MX + 8, this.y + topPad + 3);

    this.doc.setFontSize(8.5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...SLATE_600);
    lines.forEach((l, i) => this.doc.text(l, MX + 8, this.y + topPad + labelH + i * LH));

    this.y += h + 3;
  }

  drawNumberedList(items: string[], color: RGB) {
    items.forEach((item, i) => {
      const lines = wrapText(this.doc, item, CW - 20, 8.5);
      const pad = 4;
      const h = pad * 2 + Math.max(7, lines.length * LH);
      this.checkPage(h + 2);

      rr(this.doc, MX, this.y, CW, h, 2, SLATE_50, SLATE_200);
      const numW = 6;
      rr(this.doc, MX + 3, this.y + pad - 0.5, numW, numW, 3, color);
      this.doc.setFontSize(7.5);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...WHITE);
      this.doc.text(`${i + 1}`, MX + 3 + numW / 2, this.y + pad + 2.5, { align: 'center' });

      this.doc.setFontSize(8.5);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...NAVY);
      lines.forEach((l, li) => this.doc.text(l, MX + 13, this.y + pad + 1.5 + li * LH));
      this.y += h + 2;
    });
  }
}

export async function exportWeeklySummaryPDF(data: WeeklySummaryExportData) {
  const jsPDF = (await import('jspdf')).default;
  const doc = new jsPDF('p', 'mm', 'a4');
  const b = new PdfBuilder(doc);

  const { metrics: m, insight, weekLabel } = data;
  const generated = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  rr(doc, 0, 0, PW, 46, 0, NAVY);
  doc.setFillColor(...BRAND);
  doc.rect(0, 44, PW, 2.5, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Business Summary', MX, 16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  doc.text(weekLabel, MX, 25);

  doc.setFontSize(7);
  doc.setTextColor(...SLATE_400);
  doc.text(`Generated: ${generated}`, MX, 32);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const badgeText = 'Weekly Report';
  const badgeW = doc.getTextWidth(badgeText) + 10;
  rr(doc, PW - MX - badgeW, 9, badgeW, 7, 3, BRAND);
  doc.setTextColor(...WHITE);
  doc.text(badgeText, PW - MX - badgeW / 2, 13.5, { align: 'center' });

  b.y = 52;

  // KPI Cards Row 1
  b.sectionTitle('Key Performance Indicators');

  const lastWeekIncome = m.income.lastMonth > 0 ? m.income.lastMonth / 4 : 0;
  const incomeChange = lastWeekIncome > 0 ? ((m.income.thisWeek - lastWeekIncome) / lastWeekIncome) * 100 : 0;
  const incomeChangeTxt = `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(0)}% vs last week`;

  b.drawKPIRow([
    { label: 'Revenue Collected', value: fmtINR(m.income.thisWeek), sub: incomeChangeTxt, color: GREEN },
    { label: 'Invoices Sent', value: fmtINR(m.invoices.thisWeek.amount), sub: `${m.invoices.thisWeek.sent} invoices this week`, color: BLUE },
    { label: 'Expenses', value: fmtINR(m.expenses.thisWeek), sub: `Net: ${fmtINR(m.income.thisWeek - m.expenses.thisWeek)}`, color: RED },
  ]);

  b.drawKPIRow([
    { label: 'Active Projects', value: `${m.projects.active}`, sub: `${m.projects.completed} done | ${m.projects.delayed} delayed`, color: BRAND },
    { label: 'New Leads', value: `${m.clients.newThisWeek}`, sub: `${m.clients.activeLeads} follow-ups pending`, color: BLUE },
    { label: 'Hours Logged', value: `${m.employees.hoursLogged.toFixed(0)}h`, sub: `${m.employees.tasksCompleted}/${m.employees.tasksTotal} tasks done`, color: GREEN },
  ]);

  // Financial Summary
  b.sectionTitle('Financial Summary');
  b.drawMetricPair(
    { label: 'Payments Received', value: `${m.invoices.thisWeek.received} (${fmtINR(m.invoices.thisWeek.receivedAmount)})`, color: GREEN },
    { label: 'Pending Invoices', value: fmtINR(m.invoices.pendingAmount), color: YELLOW }
  );
  b.drawMetricPair(
    { label: 'Overdue Invoices', value: `${m.invoices.overdue} (${fmtINR(m.invoices.overdueAmount)})`, color: RED },
    { label: 'Project Margin', value: `${m.projects.avgMargin.toFixed(1)}%`, color: BLUE }
  );

  // AI Intelligence Section
  b.sectionTitle('AI Weekly Intelligence');

  const summaryLines = wrapText(doc, insight.WEEK_SUMMARY, CW - 14, 9);
  const summaryPad = 6;
  const summaryH = summaryPad * 2 + summaryLines.length * LH;
  b.checkPage(summaryH + 4);
  rr(doc, MX, b.y, CW, summaryH, 3, [255, 247, 237], [255, 237, 213]);
  doc.setFillColor(...BRAND);
  doc.rect(MX, b.y, 3, summaryH, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...NAVY);
  summaryLines.forEach((l, i) => doc.text(l, MX + 8, b.y + summaryPad + 2 + i * LH));
  b.y += summaryH + 5;

  b.drawHighlightCard('Best Thing This Week', insight.BEST_THING, GREEN, [236, 253, 245]);
  b.drawHighlightCard('Needs Attention', insight.CONCERN, YELLOW, [255, 251, 235]);

  b.checkPage(14);
  b.sectionTitle("Next Week's Priorities");
  b.drawNumberedList(insight.NEXT_WEEK_PRIORITY, BRAND);
  b.y += 3;

  b.drawHighlightCard('Motivation', insight.MOTIVATION, BLUE, [239, 246, 255]);

  // Team Performance
  const memberEntries = Object.entries(m.employees.memberHours).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (memberEntries.length > 0) {
    b.sectionTitle('Team Performance');
    memberEntries.forEach(([name, hours]) => {
      const h = 12;
      b.checkPage(h + 2);
      rr(doc, MX, b.y, CW, h, 2, SLATE_50, SLATE_200);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...NAVY);
      doc.text(name, MX + 6, b.y + 7.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BRAND);
      doc.text(`${hours.toFixed(0)}h`, PW - MX - 6, b.y + 7.5, { align: 'right' });

      b.y += h + 2;
    });
    b.y += 3;
  }

  // Footer
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
    doc.text('MyFinance OS - Weekly Business Summary', MX, 292);
    doc.text('Confidential', PW / 2, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, PW - MX, 292, { align: 'right' });
  }

  doc.save(`weekly-summary-${weekLabel.replace(/\s+/g, '-').replace(/[^\w-]/g, '')}.pdf`);
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function exportWeeklySummaryWord(data: WeeklySummaryExportData) {
  const { metrics: m, insight, weekLabel } = data;
  const generated = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const lastWeekIncome = m.income.lastMonth > 0 ? m.income.lastMonth / 4 : 0;
  const incomeChange = lastWeekIncome > 0 ? ((m.income.thisWeek - lastWeekIncome) / lastWeekIncome) * 100 : 0;
  const incomeChangeTxt = `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(0)}% vs last week`;
  const netIncome = m.income.thisWeek - m.expenses.thisWeek;

  const sectionHeading = (title: string) =>
    `<h2 style="color:#0F172A;font-size:13pt;margin:18px 0 8px 0;border-bottom:2px solid #FF6B00;padding-bottom:4px;">${title}</h2>`;

  const kpiCard = (label: string, value: string, sub: string, borderColor: string) =>
    `<td style="width:33%;vertical-align:top;padding:3px;">
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:2px solid ${borderColor};padding:8px 6px;text-align:center;">
        <p style="margin:0;font-size:7pt;color:#94A3B8;">${label}</p>
        <p style="margin:3px 0;font-size:12pt;font-weight:bold;color:#0F172A;">${value}</p>
        <p style="margin:0;font-size:7pt;color:#64748B;">${sub}</p>
      </div>
    </td>`;

  const highlightCard = (label: string, text: string, color: string, bg: string) =>
    `<div style="background:${bg};border-left:3px solid ${color};padding:8px 12px;margin-bottom:5px;">
      <p style="margin:0 0 2px 0;font-size:7pt;font-weight:bold;color:${color};">${label.toUpperCase()}</p>
      <p style="margin:0;font-size:9pt;color:#334155;line-height:1.4;">${escHtml(text)}</p>
    </div>`;

  let prioritiesHtml = '';
  insight.NEXT_WEEK_PRIORITY.forEach((p, i) => {
    prioritiesHtml += `
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;padding:6px 8px;margin-bottom:2px;">
        <table style="width:100%;"><tr>
          <td style="width:20px;vertical-align:top;">
            <div style="background:#FF6B00;color:white;width:16px;height:16px;border-radius:8px;text-align:center;line-height:16px;font-size:7pt;font-weight:bold;">${i + 1}</div>
          </td>
          <td style="padding-left:5px;font-size:9pt;color:#0F172A;line-height:1.4;">${escHtml(p)}</td>
        </tr></table>
      </div>`;
  });

  let teamHtml = '';
  const memberEntries = Object.entries(m.employees.memberHours).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (memberEntries.length > 0) {
    teamHtml = sectionHeading('Team Performance');
    memberEntries.forEach(([name, hours]) => {
      teamHtml += `
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;padding:6px 10px;margin-bottom:2px;">
          <table style="width:100%;"><tr>
            <td style="font-size:9pt;color:#0F172A;">${escHtml(name)}</td>
            <td style="text-align:right;font-size:10pt;font-weight:bold;color:#FF6B00;">${hours.toFixed(0)}h</td>
          </tr></table>
        </div>`;
    });
  }

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
  <div style="background:#0F172A;padding:14px 20px;">
    <table style="width:100%;"><tr>
      <td style="vertical-align:top;">
        <h1 style="margin:0;color:white;font-size:18pt;">Weekly Business Summary</h1>
        <p style="margin:4px 0 0 0;color:#B4C8DC;font-size:10pt;">${weekLabel}</p>
        <p style="margin:3px 0 0 0;color:#64748B;font-size:7pt;">Generated: ${generated}</p>
      </td>
      <td style="text-align:right;vertical-align:top;width:100px;">
        <div style="background:#FF6B00;color:white;padding:4px 10px;border-radius:5px;display:inline-block;font-size:8pt;font-weight:bold;">Weekly Report</div>
      </td>
    </tr></table>
  </div>
  <div style="background:#FF6B00;height:2px;margin-bottom:2px;"></div>

  ${sectionHeading('Key Performance Indicators')}
  <table style="width:100%;"><tr>
    ${kpiCard('Revenue Collected', fmtINR(m.income.thisWeek), incomeChangeTxt, '#10B981')}
    ${kpiCard('Invoices Sent', fmtINR(m.invoices.thisWeek.amount), `${m.invoices.thisWeek.sent} invoices`, '#3B82F6')}
    ${kpiCard('Expenses', fmtINR(m.expenses.thisWeek), `Net: ${fmtINR(netIncome)}`, '#EF4444')}
  </tr></table>
  <table style="width:100%;margin-top:4px;"><tr>
    ${kpiCard('Active Projects', `${m.projects.active}`, `${m.projects.completed} done | ${m.projects.delayed} delayed`, '#FF6B00')}
    ${kpiCard('New Leads', `${m.clients.newThisWeek}`, `${m.clients.activeLeads} follow-ups`, '#3B82F6')}
    ${kpiCard('Hours Logged', `${m.employees.hoursLogged.toFixed(0)}h`, `${m.employees.tasksCompleted}/${m.employees.tasksTotal} tasks`, '#10B981')}
  </tr></table>

  ${sectionHeading('Financial Summary')}
  <table style="width:100%;"><tr>
    <td style="width:49%;vertical-align:top;padding-right:3px;">
      <div style="background:white;border:1px solid #E2E8F0;border-left:3px solid #10B981;padding:8px 10px;">
        <p style="margin:0 0 2px 0;font-size:7pt;font-weight:bold;color:#10B981;">PAYMENTS RECEIVED</p>
        <p style="margin:0;font-size:10pt;font-weight:bold;color:#0F172A;">${m.invoices.thisWeek.received} (${fmtINR(m.invoices.thisWeek.receivedAmount)})</p>
      </div>
    </td>
    <td style="width:49%;vertical-align:top;padding-left:3px;">
      <div style="background:white;border:1px solid #E2E8F0;border-left:3px solid #F59E0B;padding:8px 10px;">
        <p style="margin:0 0 2px 0;font-size:7pt;font-weight:bold;color:#F59E0B;">PENDING INVOICES</p>
        <p style="margin:0;font-size:10pt;font-weight:bold;color:#0F172A;">${fmtINR(m.invoices.pendingAmount)}</p>
      </div>
    </td>
  </tr></table>
  <table style="width:100%;margin-top:4px;"><tr>
    <td style="width:49%;vertical-align:top;padding-right:3px;">
      <div style="background:white;border:1px solid #E2E8F0;border-left:3px solid #EF4444;padding:8px 10px;">
        <p style="margin:0 0 2px 0;font-size:7pt;font-weight:bold;color:#EF4444;">OVERDUE INVOICES</p>
        <p style="margin:0;font-size:10pt;font-weight:bold;color:#0F172A;">${m.invoices.overdue} (${fmtINR(m.invoices.overdueAmount)})</p>
      </div>
    </td>
    <td style="width:49%;vertical-align:top;padding-left:3px;">
      <div style="background:white;border:1px solid #E2E8F0;border-left:3px solid #3B82F6;padding:8px 10px;">
        <p style="margin:0 0 2px 0;font-size:7pt;font-weight:bold;color:#3B82F6;">PROJECT MARGIN</p>
        <p style="margin:0;font-size:10pt;font-weight:bold;color:#0F172A;">${m.projects.avgMargin.toFixed(1)}%</p>
      </div>
    </td>
  </tr></table>

  ${sectionHeading('AI Weekly Intelligence')}
  <div style="background:#FFF7ED;border:1px solid #FFEDD5;border-left:3px solid #FF6B00;padding:10px 14px;margin-bottom:8px;">
    <p style="margin:0;font-size:9pt;color:#0F172A;line-height:1.4;">${escHtml(insight.WEEK_SUMMARY)}</p>
  </div>

  ${highlightCard('Best Thing This Week', insight.BEST_THING, '#10B981', '#ECFDF5')}
  ${highlightCard('Needs Attention', insight.CONCERN, '#F59E0B', '#FFFBEB')}

  ${sectionHeading("Next Week's Priorities")}
  ${prioritiesHtml}

  ${highlightCard('Motivation', insight.MOTIVATION, '#3B82F6', '#EFF6FF')}

  ${teamHtml}

  <div style="border-top:1px solid #E2E8F0;margin-top:18px;padding-top:6px;">
    <table style="width:100%;"><tr>
      <td style="font-size:7pt;color:#94A3B8;">MyFinance OS - Weekly Business Summary</td>
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
  link.download = `weekly-summary-${weekLabel.replace(/\s+/g, '-').replace(/[^\w-]/g, '')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
