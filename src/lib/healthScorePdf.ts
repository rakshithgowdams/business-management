import type { MetricData } from '../pages/dashboard/healthscore/MetricCard';
import type { BusinessMetrics } from './businessData';

interface AIInsights {
  TOP_STRENGTH: string;
  TOP_RISK: string;
  QUICK_WIN: string;
  MONTHLY_GOAL: string;
  SCORE_PREDICTION: string;
}

interface ActionItem {
  id: string;
  action: string;
  impact: 'High' | 'Medium' | 'Low';
  metric: string;
  completed: boolean;
}

interface ScoreEntry {
  month: string;
  year: number;
  score: number;
}

export interface HealthScoreExportData {
  score: number;
  monthLabel: string;
  metrics: MetricData[];
  aiInsights: AIInsights | null;
  actions: ActionItem[];
  history: ScoreEntry[];
  completedActionIds: string[];
  rawMetrics: BusinessMetrics | null;
  businessLogoUrl?: string;
}

type JsPDF = import('jspdf').jsPDF;
type RGB = [number, number, number];

const BRAND: RGB = [255, 107, 0];
const NAVY: RGB = [15, 23, 42];
const NAVY_LIGHT: RGB = [30, 41, 59];
const WHITE: RGB = [255, 255, 255];
const SLATE_50: RGB = [248, 250, 252];
const SLATE_200: RGB = [226, 232, 240];
const SLATE_400: RGB = [148, 163, 184];
const SLATE_600: RGB = [71, 85, 105];
const GREEN: RGB = [16, 185, 129];
const RED: RGB = [239, 68, 68];
const YELLOW: RGB = [245, 158, 11];
const BLUE: RGB = [59, 130, 246];

function getScoreLabel(score: number): { label: string; color: RGB } {
  if (score >= 91) return { label: 'Excellent', color: BLUE };
  if (score >= 76) return { label: 'Healthy', color: GREEN };
  if (score >= 61) return { label: 'Moderate', color: YELLOW };
  if (score >= 41) return { label: 'At Risk', color: BRAND };
  return { label: 'Critical', color: RED };
}

function getStatusColor(status: string): RGB {
  const s = status.toLowerCase();
  if (['good', 'healthy', 'strong', 'growing', 'productive', 'controlled'].includes(s)) return GREEN;
  if (['flat', 'watch', 'thin', 'slow', 'delayed', 'high'].includes(s)) return YELLOW;
  return RED;
}

function getImpactColor(impact: string): RGB {
  if (impact === 'High') return RED;
  if (impact === 'Medium') return YELLOW;
  return SLATE_400;
}

function rr(doc: JsPDF, x: number, y: number, w: number, h: number, r: number, fill?: RGB, stroke?: RGB) {
  if (fill) doc.setFillColor(...fill);
  if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(0.3); }
  doc.roundedRect(x, y, w, h, r, r, fill && stroke ? 'FD' : fill ? 'F' : 'S');
}

function wrap(doc: JsPDF, text: string, maxW: number): string[] {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (doc.getTextWidth(t) > maxW) { if (cur) lines.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function sectionTitle(doc: JsPDF, title: string, x: number, y: number): number {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text(title, x, y);
  doc.setFillColor(...BRAND);
  doc.rect(x, y + 2, 32, 1, 'F');
  return y + 10;
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

export async function exportHealthScorePDF(data: HealthScoreExportData) {
  const jsPDF = (await import('jspdf')).default;
  const doc = new jsPDF('p', 'mm', 'a4');
  const PW = 210;
  const MX = 16;
  const CW = PW - MX * 2;
  let y = 0;

  const checkPage = (need: number) => {
    if (y + need > 278) { doc.addPage(); y = 16; }
  };

  const { score, monthLabel, metrics, aiInsights, actions, history, completedActionIds, rawMetrics, businessLogoUrl } = data;
  const scoreInfo = getScoreLabel(score);
  const generated = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  let logoDataUrl: string | null = null;
  if (businessLogoUrl) {
    logoDataUrl = await loadImageAsDataUrl(businessLogoUrl);
  }

  // ============ HEADER ============
  rr(doc, 0, 0, PW, 54, 0, NAVY);
  doc.setFillColor(...BRAND);
  doc.rect(0, 52, PW, 2.5, 'F');

  const textStartX = logoDataUrl ? MX + 20 : MX;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', MX, 8, 16, 16);
    } catch {
      // skip logo on error
    }
  }

  doc.setTextColor(...WHITE);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Business Health Score', textStartX, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  doc.text(`Report Period: ${monthLabel}`, textStartX, 28);
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_400);
  doc.text(`Generated: ${generated}`, textStartX, 35);
  doc.setFontSize(7);
  doc.text('MyFinance OS - AI-Powered Business Intelligence', textStartX, 42);

  const sbW = 46;
  const sbX = PW - MX - sbW;
  rr(doc, sbX, 8, sbW, 38, 4, NAVY_LIGHT);
  doc.setDrawColor(...scoreInfo.color);
  doc.setLineWidth(1);
  doc.roundedRect(sbX, 8, sbW, 38, 4, 4, 'S');

  doc.setTextColor(...scoreInfo.color);
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.text(`${score}`, sbX + sbW / 2, 27, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(180, 200, 220);
  doc.text('/100', sbX + sbW / 2, 33, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(...scoreInfo.color);
  doc.setFont('helvetica', 'bold');
  doc.text(scoreInfo.label, sbX + sbW / 2, 41, { align: 'center' });

  y = 62;

  // ============ EXECUTIVE SUMMARY (from rawMetrics) ============
  if (rawMetrics) {
    y = sectionTitle(doc, 'Executive Summary', MX, y);

    const summaryBoxH = 28;
    const boxW = (CW - 8) / 3;

    const summaryCards: { label: string; value: string; sub: string; color: RGB }[] = [
      {
        label: 'Revenue',
        value: formatINR(rawMetrics.income.thisMonth),
        sub: rawMetrics.income.lastMonth > 0
          ? `${((rawMetrics.income.thisMonth - rawMetrics.income.lastMonth) / rawMetrics.income.lastMonth * 100).toFixed(0)}% vs last month`
          : 'No prior month data',
        color: GREEN,
      },
      {
        label: 'Expenses',
        value: formatINR(rawMetrics.expenses.thisMonth),
        sub: rawMetrics.income.thisMonth > 0
          ? `${(rawMetrics.expenses.thisMonth / rawMetrics.income.thisMonth * 100).toFixed(0)}% of revenue`
          : 'No revenue yet',
        color: rawMetrics.income.thisMonth > 0 && rawMetrics.expenses.thisMonth / rawMetrics.income.thisMonth > 0.7 ? RED : BRAND,
      },
      {
        label: 'Net Profit',
        value: formatINR(rawMetrics.income.thisMonth - rawMetrics.expenses.thisMonth),
        sub: rawMetrics.income.thisMonth > 0
          ? `${((rawMetrics.income.thisMonth - rawMetrics.expenses.thisMonth) / rawMetrics.income.thisMonth * 100).toFixed(0)}% margin`
          : 'N/A',
        color: rawMetrics.income.thisMonth - rawMetrics.expenses.thisMonth >= 0 ? GREEN : RED,
      },
    ];

    summaryCards.forEach((card, i) => {
      const cx = MX + i * (boxW + 4);
      rr(doc, cx, y, boxW, summaryBoxH, 3, SLATE_50, SLATE_200);
      doc.setFillColor(...card.color);
      doc.roundedRect(cx, y, boxW, 2, 3, 0, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...SLATE_600);
      doc.text(card.label.toUpperCase(), cx + 5, y + 9);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(card.value, cx + 5, y + 18);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...card.color);
      doc.text(card.sub, cx + 5, y + 24);
    });
    y += summaryBoxH + 6;

    const miniH = 20;
    const mboxW = (CW - 12) / 4;
    const miniCards: { label: string; value: string; color: RGB }[] = [
      { label: 'Active Projects', value: `${rawMetrics.projects.active}`, color: BLUE },
      { label: 'Invoices Overdue', value: `${rawMetrics.invoices.overdue} (${formatINR(rawMetrics.invoices.overdueAmount)})`, color: rawMetrics.invoices.overdue > 0 ? RED : GREEN },
      { label: 'Total Clients', value: `${rawMetrics.clients.total} (+${rawMetrics.clients.newThisMonth} new)`, color: GREEN },
      { label: 'Team Size', value: `${rawMetrics.employees.total} members`, color: BLUE },
    ];

    miniCards.forEach((card, i) => {
      const cx = MX + i * (mboxW + 4);
      rr(doc, cx, y, mboxW, miniH, 3, WHITE, SLATE_200);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_400);
      doc.text(card.label, cx + 4, y + 7);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...card.color);
      const valLines = wrap(doc, card.value, mboxW - 8);
      valLines.forEach((l, li) => {
        if (li < 2) doc.text(l, cx + 4, y + 14 + li * 4);
      });
    });
    y += miniH + 8;
  }

  // ============ PERFORMANCE METRICS ============
  checkPage(70);
  y = sectionTitle(doc, 'Performance Metrics', MX, y);

  const cardW = (CW - 6) / 2;
  const cardH = 32;

  metrics.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    if (col === 0) checkPage(cardH + 6);
    const cx = MX + col * (cardW + 6);
    const cy = y + row * (cardH + 5);
    const statusCol = getStatusColor(m.status);

    rr(doc, cx, cy, cardW, cardH, 3, SLATE_50, SLATE_200);

    doc.setFillColor(...statusCol);
    doc.roundedRect(cx, cy, 3, cardH, 3, 0, 'F');
    doc.roundedRect(cx, cy, 3, cardH, 0, 0, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(`${m.name}`, cx + 8, cy + 8);

    const badgeX = cx + cardW - 5;
    const badgeW = doc.getTextWidth(m.status) + 7;
    rr(doc, badgeX - badgeW, cy + 3.5, badgeW, 6.5, 2, statusCol);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(m.status, badgeX - badgeW / 2, cy + 8, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_600);
    const valueLines = wrap(doc, m.value, cardW - 18);
    valueLines.forEach((line, li) => {
      if (li < 2) doc.text(line, cx + 8, cy + 15 + li * 4);
    });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND);
    doc.text(`${m.scoreEarned}/${m.scoreMax} pts`, cx + cardW - 5, cy + 15, { align: 'right' });

    const pct = (m.scoreEarned / m.scoreMax) * 100;
    const barY = cy + cardH - 5;
    const barW = cardW - 16;
    rr(doc, cx + 8, barY, barW, 2.5, 1, SLATE_200);
    if (pct > 0) {
      doc.setFillColor(...BRAND);
      doc.roundedRect(cx + 8, barY, Math.max((barW * pct) / 100, 2), 2.5, 1, 1, 'F');
    }
  });

  const totalMetricRows = Math.ceil(metrics.length / 2);
  y += totalMetricRows * (cardH + 5) + 8;

  // ============ AI BUSINESS INTELLIGENCE ============
  if (aiInsights) {
    checkPage(40);
    y = sectionTitle(doc, 'AI Business Intelligence', MX, y);

    const insightCards: { label: string; text: string; color: RGB; badge: string }[] = [
      { label: 'Top Strength', text: aiInsights.TOP_STRENGTH || 'N/A', color: GREEN, badge: 'STRENGTH' },
      { label: 'Biggest Risk', text: aiInsights.TOP_RISK || 'N/A', color: RED, badge: 'RISK' },
      { label: 'Quick Win This Week', text: aiInsights.QUICK_WIN || 'N/A', color: BRAND, badge: 'QUICK WIN' },
      { label: 'Monthly Goal', text: aiInsights.MONTHLY_GOAL || 'N/A', color: BLUE, badge: 'GOAL' },
      { label: 'Score Prediction', text: aiInsights.SCORE_PREDICTION || 'N/A', color: YELLOW, badge: 'FORECAST' },
    ];

    insightCards.forEach((card) => {
      doc.setFontSize(8);
      const lines = wrap(doc, card.text, CW - 24);
      const ch = Math.max(14, 10 + lines.length * 4);
      checkPage(ch + 4);

      rr(doc, MX, y, CW, ch, 3, WHITE, SLATE_200);
      doc.setFillColor(...card.color);
      doc.rect(MX, y, 2.5, ch, 'F');

      const badgeTxt = card.badge;
      const badgeW = doc.getTextWidth(badgeTxt) + 7;
      rr(doc, MX + 6, y + 2.5, badgeW, 5.5, 2, card.color);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(badgeTxt, MX + 6 + badgeW / 2, y + 6.2, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...card.color);
      doc.text(card.label, MX + 8 + badgeW, y + 6.5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_600);
      lines.forEach((line, li) => {
        doc.text(line, MX + 8, y + 12 + li * 4);
      });

      y += ch + 3;
    });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...SLATE_400);
    doc.text('Powered by Gemini 2.5 Flash', MX + CW, y, { align: 'right' });
    y += 8;
  }

  // ============ SCORE TREND ============
  if (history.length >= 2) {
    checkPage(55);
    y = sectionTitle(doc, 'Score Trend', MX, y);

    const chartH = 40;
    rr(doc, MX, y, CW, chartH, 3, SLATE_50, SLATE_200);

    const barPad = 10;
    const barAreaW = CW - barPad * 2;
    const cnt = history.length;
    const gap = 5;
    const barW = Math.min(18, (barAreaW - (cnt - 1) * gap) / cnt);
    const totalW = cnt * barW + (cnt - 1) * gap;
    const startX = MX + (CW - totalW) / 2;
    const barMaxH = chartH - 18;

    doc.setDrawColor(...SLATE_200);
    doc.setLineWidth(0.15);
    [25, 50, 75].forEach((pct) => {
      const gy = y + chartH - 8 - (pct / 100) * barMaxH;
      doc.line(MX + 4, gy, MX + CW - 4, gy);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_400);
      doc.text(`${pct}`, MX + 3, gy - 0.5, { align: 'right' });
    });

    history.forEach((entry, i) => {
      const bx = startX + i * (barW + gap);
      const bh = Math.max((entry.score / 100) * barMaxH, 2);
      const by = y + chartH - 8 - bh;
      const entryColor = getScoreLabel(entry.score).color;

      doc.setFillColor(...entryColor);
      doc.roundedRect(bx, by, barW, bh, 1.5, 1.5, 'F');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...entryColor);
      doc.text(`${entry.score}`, bx + barW / 2, by - 2, { align: 'center' });

      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_600);
      doc.text(`${entry.month.slice(0, 3)} ${String(entry.year).slice(2)}`, bx + barW / 2, y + chartH - 2, { align: 'center' });
    });

    if (history.length >= 2) {
      const last = history[history.length - 1].score;
      const prev = history[history.length - 2].score;
      const diff = last - prev;
      const trendText = diff > 0 ? `+${diff} points improvement` : diff < 0 ? `${diff} points decline` : 'No change';
      const trendColor = diff > 0 ? GREEN : diff < 0 ? RED : YELLOW;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...trendColor);
      doc.text(trendText, MX + CW - 5, y + 6, { align: 'right' });
    }

    y += chartH + 8;
  }

  // ============ ACTION PLAN ============
  if (actions.length > 0) {
    checkPage(30);
    y = sectionTitle(doc, "This Month's Action Plan", MX, y);

    const completedSet = new Set(completedActionIds);
    const completedCount = actions.filter(a => completedSet.has(a.id)).length;
    const progressPct = Math.round((completedCount / actions.length) * 100);

    rr(doc, MX, y, CW, 12, 3, SLATE_50, SLATE_200);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(`Progress: ${completedCount}/${actions.length} completed (${progressPct}%)`, MX + 5, y + 5.5);
    const progBarW = 50;
    const progBarX = MX + CW - progBarW - 5;
    rr(doc, progBarX, y + 6, progBarW, 3, 1.5, SLATE_200);
    if (progressPct > 0) {
      doc.setFillColor(...GREEN);
      doc.roundedRect(progBarX, y + 6, Math.max((progBarW * progressPct) / 100, 2), 3, 1.5, 1.5, 'F');
    }
    y += 15;

    rr(doc, MX, y, CW, 8, 2, NAVY);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('#', MX + 5, y + 5.5);
    doc.text('Status', MX + 14, y + 5.5);
    doc.text('Action Item', MX + 30, y + 5.5);
    doc.text('Impact', MX + CW - 38, y + 5.5);
    doc.text('Metric', MX + CW - 18, y + 5.5);
    y += 9;

    actions.forEach((item, i) => {
      checkPage(12);
      const isDone = completedSet.has(item.id);
      const bg: RGB = isDone ? [236, 253, 245] : (i % 2 === 0 ? SLATE_50 : WHITE);
      rr(doc, MX, y, CW, 9, 1, bg);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_600);
      doc.text(`${i + 1}`, MX + 5, y + 6);

      if (isDone) {
        rr(doc, MX + 14, y + 2.5, 10, 5, 1.5, GREEN);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...WHITE);
        doc.text('DONE', MX + 19, y + 5.8, { align: 'center' });
      } else {
        rr(doc, MX + 14, y + 2.5, 12, 5, 1.5, [254, 243, 199]);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(146, 64, 14);
        doc.text('PENDING', MX + 20, y + 5.8, { align: 'center' });
      }

      doc.setFontSize(7.5);
      doc.setFont('helvetica', isDone ? 'normal' : 'bold');
      const textCol: RGB = isDone ? [148, 163, 184] : NAVY;
      doc.setTextColor(...textCol);
      const act = item.action || '';
      const actionText = act.length > 50 ? act.slice(0, 47) + '...' : act;
      doc.text(actionText, MX + 30, y + 6);

      const impactCol = getImpactColor(item.impact);
      const impBadgeW = doc.getTextWidth(item.impact) + 5;
      rr(doc, MX + CW - 40, y + 2, impBadgeW, 5.5, 1.5, impactCol);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(item.impact, MX + CW - 40 + impBadgeW / 2, y + 5.8, { align: 'center' });

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_400);
      const met = item.metric || '';
      const metricText = met.length > 14 ? met.slice(0, 11) + '...' : met;
      doc.text(metricText, MX + CW - 18, y + 6);

      y += 10;
    });

    y += 5;
  }

  // ============ DETAILED BREAKDOWN (rawMetrics) ============
  if (rawMetrics) {
    checkPage(60);
    y = sectionTitle(doc, 'Detailed Financial Breakdown', MX, y);

    const tblW = CW;
    const col1 = 60;
    const col2 = (tblW - col1) / 2;

    const sections: { title: string; rows: { label: string; value: string }[] }[] = [
      {
        title: 'Income & Expenses',
        rows: [
          { label: 'Income (This Month)', value: formatINR(rawMetrics.income.thisMonth) },
          { label: 'Income (Last Month)', value: formatINR(rawMetrics.income.lastMonth) },
          { label: 'Income (This Week)', value: formatINR(rawMetrics.income.thisWeek) },
          { label: 'Expenses (This Month)', value: formatINR(rawMetrics.expenses.thisMonth) },
          { label: 'Expenses (This Week)', value: formatINR(rawMetrics.expenses.thisWeek) },
        ],
      },
      {
        title: 'Invoices',
        rows: [
          { label: 'Total Invoices', value: `${rawMetrics.invoices.total}` },
          { label: 'Paid', value: `${rawMetrics.invoices.paid}` },
          { label: 'Overdue', value: `${rawMetrics.invoices.overdue} (${formatINR(rawMetrics.invoices.overdueAmount)})` },
          { label: 'Pending Amount', value: formatINR(rawMetrics.invoices.pendingAmount) },
        ],
      },
      {
        title: 'Projects',
        rows: [
          { label: 'Active Projects', value: `${rawMetrics.projects.active}` },
          { label: 'Completed Projects', value: `${rawMetrics.projects.completed}` },
          { label: 'Delayed Projects', value: `${rawMetrics.projects.delayed}` },
          { label: 'Total Revenue', value: formatINR(rawMetrics.projects.totalRevenue) },
          { label: 'Total Expenses', value: formatINR(rawMetrics.projects.totalExpenses) },
          { label: 'Avg Margin', value: `${rawMetrics.projects.avgMargin.toFixed(1)}%` },
        ],
      },
      {
        title: 'Clients & Team',
        rows: [
          { label: 'Total Clients', value: `${rawMetrics.clients.total}` },
          { label: 'New This Month', value: `${rawMetrics.clients.newThisMonth}` },
          { label: 'Active Leads', value: `${rawMetrics.clients.activeLeads}` },
          { label: 'Team Size', value: `${rawMetrics.employees.total}` },
          { label: 'Tasks Completed', value: `${rawMetrics.employees.tasksCompleted}/${rawMetrics.employees.tasksTotal}` },
          { label: 'Hours Logged', value: `${rawMetrics.employees.hoursLogged.toFixed(0)}h` },
        ],
      },
    ];

    const halfW = (CW - 6) / 2;

    sections.forEach((section, si) => {
      const col = si % 2;
      if (col === 0) checkPage(12 + section.rows.length * 7);
      const sx = MX + col * (halfW + 6);
      const sy = col === 0 ? y : y;

      rr(doc, sx, sy, halfW, 7, 2, NAVY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(section.title, sx + 4, sy + 5);

      let ry = sy + 8;
      section.rows.forEach((row, ri) => {
        const rowBg: RGB = ri % 2 === 0 ? SLATE_50 : WHITE;
        rr(doc, sx, ry, halfW, 6.5, 0, rowBg);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...SLATE_600);
        doc.text(row.label, sx + 4, ry + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...NAVY);
        doc.text(row.value, sx + halfW - 4, ry + 4.5, { align: 'right' });

        ry += 6.5;
      });

      if (col === 1 || si === sections.length - 1) {
        const maxRows = Math.max(
          col === 1 && si > 0 ? sections[si - 1].rows.length : 0,
          section.rows.length
        );
        y += 8 + maxRows * 6.5 + 6;
      }
    });

    y += 4;
  }

  // ============ FOOTER ON ALL PAGES ============
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
    doc.text('MyFinance OS - Business Health Score Report', MX, 292);
    doc.text(`Confidential`, PW / 2, 292, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, PW - MX, 292, { align: 'right' });
  }

  doc.save(`health-score-${data.monthLabel.replace(/\s/g, '-').toLowerCase()}.pdf`);
}
