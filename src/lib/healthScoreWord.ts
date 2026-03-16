import type { HealthScoreExportData } from './healthScorePdf';

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getScoreLabel(score: number) {
  if (score >= 91) return { label: 'Excellent', color: '#3B82F6' };
  if (score >= 76) return { label: 'Healthy', color: '#10B981' };
  if (score >= 61) return { label: 'Moderate', color: '#F59E0B' };
  if (score >= 41) return { label: 'At Risk', color: '#FF6B00' };
  return { label: 'Critical', color: '#EF4444' };
}

function statusStyle(status: string) {
  const s = status.toLowerCase();
  if (['good', 'healthy', 'strong', 'growing', 'productive', 'controlled'].includes(s))
    return { bg: '#DCFCE7', text: '#166534' };
  if (['flat', 'watch', 'thin', 'slow', 'delayed', 'high'].includes(s))
    return { bg: '#FEF3C7', text: '#92400E' };
  return { bg: '#FEE2E2', text: '#991B1B' };
}

function impactStyle(impact: string) {
  if (impact === 'High') return { bg: '#FEE2E2', text: '#991B1B' };
  if (impact === 'Medium') return { bg: '#FEF3C7', text: '#92400E' };
  return { bg: '#F3F4F6', text: '#374151' };
}

function insightCfg(key: string) {
  const m: Record<string, { label: string; color: string; bg: string; badge: string }> = {
    TOP_STRENGTH: { label: 'Top Strength', color: '#166534', bg: '#DCFCE7', badge: 'STRENGTH' },
    TOP_RISK: { label: 'Biggest Risk', color: '#991B1B', bg: '#FEE2E2', badge: 'RISK' },
    QUICK_WIN: { label: 'Quick Win This Week', color: '#9A3412', bg: '#FFF7ED', badge: 'QUICK WIN' },
    MONTHLY_GOAL: { label: 'Monthly Goal', color: '#1E40AF', bg: '#EFF6FF', badge: 'GOAL' },
    SCORE_PREDICTION: { label: 'Score Prediction', color: '#92400E', bg: '#FEF3C7', badge: 'FORECAST' },
  };
  return m[key] || { label: key, color: '#374151', bg: '#F3F4F6', badge: '' };
}

function fmtINR(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export function exportHealthScoreWord(data: HealthScoreExportData) {
  const { score, monthLabel, metrics, aiInsights, actions, history, completedActionIds, rawMetrics } = data;
  const scoreInfo = getScoreLabel(score);
  const completedSet = new Set(completedActionIds);
  const generated = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  let execSummaryHtml = '';
  if (rawMetrics) {
    const profit = rawMetrics.income.thisMonth - rawMetrics.expenses.thisMonth;
    const marginPct = rawMetrics.income.thisMonth > 0 ? ((profit / rawMetrics.income.thisMonth) * 100).toFixed(0) : 'N/A';
    const revGrowth = rawMetrics.income.lastMonth > 0 ? ((rawMetrics.income.thisMonth - rawMetrics.income.lastMonth) / rawMetrics.income.lastMonth * 100).toFixed(0) : 'N/A';
    const expRatio = rawMetrics.income.thisMonth > 0 ? (rawMetrics.expenses.thisMonth / rawMetrics.income.thisMonth * 100).toFixed(0) : 'N/A';

    execSummaryHtml = `
      <h2 style="color:#0F172A;font-size:14pt;margin:24px 0 12px 0;border-bottom:3px solid #FF6B00;padding-bottom:6px;">Executive Summary</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:33%;padding:8px;vertical-align:top;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:3px solid #10B981;border-radius:0 0 8px 8px;padding:14px;">
              <p style="margin:0;font-size:8pt;font-weight:bold;color:#64748B;text-transform:uppercase;">Revenue</p>
              <p style="margin:4px 0 2px 0;font-size:16pt;font-weight:bold;color:#0F172A;">${fmtINR(rawMetrics.income.thisMonth)}</p>
              <p style="margin:0;font-size:8pt;color:#10B981;">${revGrowth}% vs last month</p>
            </div>
          </td>
          <td style="width:33%;padding:8px;vertical-align:top;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:3px solid ${rawMetrics.income.thisMonth > 0 && rawMetrics.expenses.thisMonth / rawMetrics.income.thisMonth > 0.7 ? '#EF4444' : '#FF6B00'};border-radius:0 0 8px 8px;padding:14px;">
              <p style="margin:0;font-size:8pt;font-weight:bold;color:#64748B;text-transform:uppercase;">Expenses</p>
              <p style="margin:4px 0 2px 0;font-size:16pt;font-weight:bold;color:#0F172A;">${fmtINR(rawMetrics.expenses.thisMonth)}</p>
              <p style="margin:0;font-size:8pt;color:#FF6B00;">${expRatio}% of revenue</p>
            </div>
          </td>
          <td style="width:33%;padding:8px;vertical-align:top;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:3px solid ${profit >= 0 ? '#10B981' : '#EF4444'};border-radius:0 0 8px 8px;padding:14px;">
              <p style="margin:0;font-size:8pt;font-weight:bold;color:#64748B;text-transform:uppercase;">Net Profit</p>
              <p style="margin:4px 0 2px 0;font-size:16pt;font-weight:bold;color:#0F172A;">${fmtINR(profit)}</p>
              <p style="margin:0;font-size:8pt;color:${profit >= 0 ? '#10B981' : '#EF4444'};">${marginPct}% margin</p>
            </div>
          </td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr>
          <td style="width:25%;padding:6px;">
            <div style="background:white;border:1px solid #E2E8F0;border-radius:8px;padding:10px;text-align:center;">
              <p style="margin:0;font-size:7pt;color:#94A3B8;">Active Projects</p>
              <p style="margin:2px 0 0 0;font-size:14pt;font-weight:bold;color:#3B82F6;">${rawMetrics.projects.active}</p>
            </div>
          </td>
          <td style="width:25%;padding:6px;">
            <div style="background:white;border:1px solid #E2E8F0;border-radius:8px;padding:10px;text-align:center;">
              <p style="margin:0;font-size:7pt;color:#94A3B8;">Invoices Overdue</p>
              <p style="margin:2px 0 0 0;font-size:14pt;font-weight:bold;color:${rawMetrics.invoices.overdue > 0 ? '#EF4444' : '#10B981'};">${rawMetrics.invoices.overdue}</p>
            </div>
          </td>
          <td style="width:25%;padding:6px;">
            <div style="background:white;border:1px solid #E2E8F0;border-radius:8px;padding:10px;text-align:center;">
              <p style="margin:0;font-size:7pt;color:#94A3B8;">Total Clients</p>
              <p style="margin:2px 0 0 0;font-size:14pt;font-weight:bold;color:#10B981;">${rawMetrics.clients.total}</p>
            </div>
          </td>
          <td style="width:25%;padding:6px;">
            <div style="background:white;border:1px solid #E2E8F0;border-radius:8px;padding:10px;text-align:center;">
              <p style="margin:0;font-size:7pt;color:#94A3B8;">Team Size</p>
              <p style="margin:2px 0 0 0;font-size:14pt;font-weight:bold;color:#3B82F6;">${rawMetrics.employees.total}</p>
            </div>
          </td>
        </tr>
      </table>`;
  }

  let metricsHtml = '';
  metrics.forEach((m) => {
    const pct = Math.round((m.scoreEarned / m.scoreMax) * 100);
    const sc = statusStyle(m.status);
    metricsHtml += `
      <tr>
        <td style="padding:10px 12px;border-left:3px solid ${sc.text};font-weight:bold;color:#0F172A;font-size:10pt;">${esc(m.name)}</td>
        <td style="padding:10px 12px;color:#475569;font-size:9pt;">${esc(m.value)}</td>
        <td style="padding:10px 12px;text-align:center;">
          <span style="background:${sc.bg};color:${sc.text};padding:3px 10px;border-radius:12px;font-size:8pt;font-weight:bold;">${esc(m.status)}</span>
        </td>
        <td style="padding:10px 12px;text-align:center;font-weight:bold;color:#FF6B00;font-size:11pt;">${m.scoreEarned}/${m.scoreMax}</td>
        <td style="padding:10px 12px;text-align:center;">
          <div style="background:#E2E8F0;border-radius:6px;height:8px;width:80px;display:inline-block;">
            <div style="background:#FF6B00;border-radius:6px;height:8px;width:${pct}%;"></div>
          </div>
        </td>
      </tr>`;
  });

  type InsightKey = 'TOP_STRENGTH' | 'TOP_RISK' | 'QUICK_WIN' | 'MONTHLY_GOAL' | 'SCORE_PREDICTION';
  let insightsHtml = '';
  if (aiInsights) {
    const keys: InsightKey[] = ['TOP_STRENGTH', 'TOP_RISK', 'QUICK_WIN', 'MONTHLY_GOAL', 'SCORE_PREDICTION'];
    keys.forEach((key) => {
      const cfg = insightCfg(key);
      insightsHtml += `
        <div style="background:${cfg.bg};border-left:4px solid ${cfg.color};padding:12px 16px;margin-bottom:8px;border-radius:0 8px 8px 0;">
          <table style="width:100%;">
            <tr>
              <td style="vertical-align:top;width:auto;">
                <span style="background:${cfg.color};color:white;padding:2px 8px;border-radius:8px;font-size:7pt;font-weight:bold;">${cfg.badge}</span>
              </td>
              <td style="padding-left:8px;">
                <p style="margin:0 0 3px 0;font-weight:bold;color:${cfg.color};font-size:10pt;">${cfg.label}</p>
                <p style="margin:0;color:#334155;font-size:9pt;line-height:1.5;">${esc(aiInsights[key])}</p>
              </td>
            </tr>
          </table>
        </div>`;
    });
  }

  let historyHtml = '';
  if (history.length >= 2) {
    let bars = '';
    history.forEach((entry) => {
      const info = getScoreLabel(entry.score);
      const hPx = Math.max(entry.score * 1.2, 8);
      bars += `
        <td style="padding:4px 6px;vertical-align:bottom;text-align:center;">
          <div style="color:${info.color};font-size:9pt;font-weight:bold;margin-bottom:4px;">${entry.score}</div>
          <div style="background:${info.color};width:28px;height:${hPx}px;border-radius:4px 4px 0 0;margin:0 auto;"></div>
          <div style="color:#64748B;font-size:7pt;margin-top:4px;">${entry.month.slice(0, 3)} ${String(entry.year).slice(2)}</div>
        </td>`;
    });
    const last = history[history.length - 1].score;
    const prev = history[history.length - 2].score;
    const diff = last - prev;
    const trendLabel = diff > 0 ? `+${diff} points improvement` : diff < 0 ? `${diff} points decline` : 'No change';
    const trendColor = diff > 0 ? '#10B981' : diff < 0 ? '#EF4444' : '#F59E0B';
    historyHtml = `
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;">
        <p style="text-align:right;margin:0 0 8px 0;font-size:8pt;font-weight:bold;color:${trendColor};">${trendLabel}</p>
        <table style="width:auto;border-collapse:collapse;margin:0 auto;">
          <tr>${bars}</tr>
        </table>
      </div>`;
  }

  let actionsHtml = '';
  if (actions.length > 0) {
    const completedCount = actions.filter(a => completedSet.has(a.id)).length;
    const progressPct = Math.round((completedCount / actions.length) * 100);
    let rows = '';
    actions.forEach((item, i) => {
      const imp = impactStyle(item.impact);
      const isDone = completedSet.has(item.id);
      const bg = isDone ? '#ECFDF5' : (i % 2 === 0 ? '#F8FAFC' : '#FFFFFF');
      const statusBadge = isDone
        ? '<span style="background:#10B981;color:white;padding:2px 8px;border-radius:8px;font-size:7pt;font-weight:bold;">DONE</span>'
        : '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:8px;font-size:7pt;font-weight:bold;">PENDING</span>';
      rows += `
        <tr style="background:${bg};">
          <td style="padding:8px 10px;text-align:center;color:#64748B;font-size:9pt;font-weight:bold;">${i + 1}</td>
          <td style="padding:8px 10px;">${statusBadge}</td>
          <td style="padding:8px 10px;color:${isDone ? '#94A3B8' : '#0F172A'};font-size:9pt;${isDone ? 'text-decoration:line-through;' : 'font-weight:bold;'}">${esc(item.action)}</td>
          <td style="padding:8px 10px;text-align:center;">
            <span style="background:${imp.bg};color:${imp.text};padding:2px 8px;border-radius:10px;font-size:8pt;font-weight:bold;">${esc(item.impact)}</span>
          </td>
          <td style="padding:8px 10px;color:#64748B;font-size:8pt;">${esc(item.metric)}</td>
        </tr>`;
    });
    actionsHtml = `
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px;margin-bottom:10px;">
        <table style="width:100%;">
          <tr>
            <td style="font-size:9pt;font-weight:bold;color:#0F172A;">Progress: ${completedCount}/${actions.length} completed (${progressPct}%)</td>
            <td style="text-align:right;width:120px;">
              <div style="background:#E2E8F0;border-radius:6px;height:8px;width:100px;display:inline-block;">
                <div style="background:#10B981;border-radius:6px;height:8px;width:${progressPct}%;"></div>
              </div>
            </td>
          </tr>
        </table>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;">
        <tr style="background:#0F172A;">
          <th style="padding:8px 10px;color:white;font-size:8pt;text-align:center;width:30px;">#</th>
          <th style="padding:8px 10px;color:white;font-size:8pt;text-align:center;width:60px;">Status</th>
          <th style="padding:8px 10px;color:white;font-size:8pt;text-align:left;">Action Item</th>
          <th style="padding:8px 10px;color:white;font-size:8pt;text-align:center;width:70px;">Impact</th>
          <th style="padding:8px 10px;color:white;font-size:8pt;text-align:left;width:110px;">Metric</th>
        </tr>
        ${rows}
      </table>`;
  }

  let breakdownHtml = '';
  if (rawMetrics) {
    const sections: { title: string; rows: [string, string][] }[] = [
      {
        title: 'Income & Expenses',
        rows: [
          ['Income (This Month)', fmtINR(rawMetrics.income.thisMonth)],
          ['Income (Last Month)', fmtINR(rawMetrics.income.lastMonth)],
          ['Income (This Week)', fmtINR(rawMetrics.income.thisWeek)],
          ['Expenses (This Month)', fmtINR(rawMetrics.expenses.thisMonth)],
          ['Expenses (This Week)', fmtINR(rawMetrics.expenses.thisWeek)],
        ],
      },
      {
        title: 'Invoices',
        rows: [
          ['Total Invoices', `${rawMetrics.invoices.total}`],
          ['Paid', `${rawMetrics.invoices.paid}`],
          ['Overdue', `${rawMetrics.invoices.overdue} (${fmtINR(rawMetrics.invoices.overdueAmount)})`],
          ['Pending Amount', fmtINR(rawMetrics.invoices.pendingAmount)],
        ],
      },
      {
        title: 'Projects',
        rows: [
          ['Active', `${rawMetrics.projects.active}`],
          ['Completed', `${rawMetrics.projects.completed}`],
          ['Delayed', `${rawMetrics.projects.delayed}`],
          ['Total Revenue', fmtINR(rawMetrics.projects.totalRevenue)],
          ['Total Expenses', fmtINR(rawMetrics.projects.totalExpenses)],
          ['Avg Margin', `${rawMetrics.projects.avgMargin.toFixed(1)}%`],
        ],
      },
      {
        title: 'Clients & Team',
        rows: [
          ['Total Clients', `${rawMetrics.clients.total}`],
          ['New This Month', `${rawMetrics.clients.newThisMonth}`],
          ['Active Leads', `${rawMetrics.clients.activeLeads}`],
          ['Team Size', `${rawMetrics.employees.total}`],
          ['Tasks Completed', `${rawMetrics.employees.tasksCompleted}/${rawMetrics.employees.tasksTotal}`],
          ['Hours Logged', `${rawMetrics.employees.hoursLogged.toFixed(0)}h`],
        ],
      },
    ];

    let tblPairs = '';
    for (let i = 0; i < sections.length; i += 2) {
      const left = sections[i];
      const right = sections[i + 1];
      const makeRows = (s: typeof left) =>
        s.rows.map((r, ri) => `
          <tr style="background:${ri % 2 === 0 ? '#F8FAFC' : 'white'};">
            <td style="padding:5px 8px;font-size:8pt;color:#64748B;">${r[0]}</td>
            <td style="padding:5px 8px;font-size:8pt;font-weight:bold;color:#0F172A;text-align:right;">${r[1]}</td>
          </tr>`).join('');

      tblPairs += `
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
          <tr>
            <td style="width:49%;vertical-align:top;padding-right:6px;">
              <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;">
                <tr style="background:#0F172A;"><th colspan="2" style="padding:8px;color:white;font-size:8pt;text-align:left;">${left.title}</th></tr>
                ${makeRows(left)}
              </table>
            </td>
            ${right ? `
            <td style="width:49%;vertical-align:top;padding-left:6px;">
              <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;">
                <tr style="background:#0F172A;"><th colspan="2" style="padding:8px;color:white;font-size:8pt;text-align:left;">${right.title}</th></tr>
                ${makeRows(right)}
              </table>
            </td>` : '<td></td>'}
          </tr>
        </table>`;
    }
    breakdownHtml = tblPairs;
  }

  const sectionHeading = (title: string) =>
    `<h2 style="color:#0F172A;font-size:14pt;margin:28px 0 12px 0;border-bottom:3px solid #FF6B00;padding-bottom:6px;">${title}</h2>`;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: A4; margin: 20mm 16mm; }
        body { font-family: Calibri, Arial, sans-serif; color: #334155; margin: 0; padding: 0; }
        table { border-collapse: collapse; }
      </style>
    </head>
    <body>
      <div style="background:#0F172A;padding:20px 24px;">
        <table style="width:100%;">
          <tr>
            <td style="vertical-align:top;">
              <h1 style="margin:0;color:white;font-size:20pt;">Business Health Score</h1>
              <p style="margin:6px 0 0 0;color:#94A3B8;font-size:10pt;">Report Period: ${monthLabel}</p>
              <p style="margin:4px 0 0 0;color:#64748B;font-size:8pt;">Generated: ${generated}</p>
              <p style="margin:4px 0 0 0;color:#64748B;font-size:7pt;">MyFinance OS - AI-Powered Business Intelligence</p>
            </td>
            <td style="text-align:right;vertical-align:top;width:140px;">
              <div style="background:#1E293B;border:3px solid ${scoreInfo.color};border-radius:12px;padding:12px 20px;display:inline-block;text-align:center;">
                <div style="font-size:28pt;font-weight:bold;color:${scoreInfo.color};margin:0;">${score}</div>
                <div style="color:#94A3B8;font-size:9pt;">/100</div>
                <div style="color:${scoreInfo.color};font-size:10pt;font-weight:bold;">${scoreInfo.label}</div>
              </div>
            </td>
          </tr>
        </table>
      </div>
      <div style="background:#FF6B00;height:3px;margin-bottom:4px;"></div>

      ${execSummaryHtml}

      ${sectionHeading('Performance Metrics')}
      <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;">
        <tr style="background:#0F172A;">
          <th style="padding:10px 12px;color:white;font-size:8pt;text-align:left;">Metric</th>
          <th style="padding:10px 12px;color:white;font-size:8pt;text-align:left;">Details</th>
          <th style="padding:10px 12px;color:white;font-size:8pt;text-align:center;">Status</th>
          <th style="padding:10px 12px;color:white;font-size:8pt;text-align:center;">Score</th>
          <th style="padding:10px 12px;color:white;font-size:8pt;text-align:center;">Progress</th>
        </tr>
        ${metricsHtml}
      </table>

      ${aiInsights ? `
      ${sectionHeading('AI Business Intelligence')}
      ${insightsHtml}
      <p style="color:#94A3B8;font-size:7pt;text-align:right;margin-top:4px;font-style:italic;">Powered by Gemini 2.5 Flash</p>
      ` : ''}

      ${history.length >= 2 ? `
      ${sectionHeading('Score Trend')}
      ${historyHtml}
      ` : ''}

      ${actions.length > 0 ? `
      ${sectionHeading("This Month's Action Plan")}
      ${actionsHtml}
      ` : ''}

      ${rawMetrics ? `
      ${sectionHeading('Detailed Financial Breakdown')}
      ${breakdownHtml}
      ` : ''}

      <div style="border-top:2px solid #E2E8F0;margin-top:30px;padding-top:10px;">
        <table style="width:100%;">
          <tr>
            <td style="font-size:7pt;color:#94A3B8;">MyFinance OS - Business Health Score Report</td>
            <td style="font-size:7pt;color:#94A3B8;text-align:center;">Confidential</td>
            <td style="font-size:7pt;color:#94A3B8;text-align:right;">${generated}</td>
          </tr>
        </table>
      </div>
    </body>
    </html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `health-score-${data.monthLabel.replace(/\s/g, '-').toLowerCase()}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
