import { useMemo } from 'react';
import { TrendingUp, Calendar, Target, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface LogEntry {
  timestamp: string;
  estimatedCost: number;
}

interface Props {
  logs: LogEntry[];
}

export default function SpendingForecast({ logs }: Props) {
  const forecast = useMemo(() => {
    if (logs.length < 3) return null;

    const dailyCosts: Record<string, number> = {};
    for (const log of logs) {
      const day = new Date(log.timestamp).toISOString().split('T')[0];
      dailyCosts[day] = (dailyCosts[day] || 0) + log.estimatedCost;
    }

    const sortedDays = Object.keys(dailyCosts).sort();
    if (sortedDays.length < 2) return null;

    const daySpends = sortedDays.map((d) => ({ date: d, cost: dailyCosts[d] }));
    const avgDaily = daySpends.reduce((s, d) => s + d.cost, 0) / daySpends.length;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - currentDayOfMonth;

    const spentThisMonth = daySpends
      .filter((d) => {
        const dt = new Date(d.date);
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      })
      .reduce((s, d) => s + d.cost, 0);

    const projectedMonth = spentThisMonth + avgDaily * daysRemaining;

    const trend = daySpends.length >= 7
      ? daySpends.slice(-7).reduce((s, d) => s + d.cost, 0) / 7
      : avgDaily;

    const projectedMonthTrend = spentThisMonth + trend * daysRemaining;

    const chartData: { date: string; actual?: number; forecast?: number }[] = [];

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(now.getFullYear(), now.getMonth(), d).toISOString().split('T')[0];
      const label = `${String(d).padStart(2, '0')}`;
      if (d <= currentDayOfMonth) {
        chartData.push({ date: label, actual: dailyCosts[dateStr] || 0 });
      } else {
        chartData.push({ date: label, forecast: trend });
      }
    }

    const weeklyRates = [];
    for (let i = 0; i < daySpends.length - 6; i++) {
      const weekCost = daySpends.slice(i, i + 7).reduce((s, d) => s + d.cost, 0);
      weeklyRates.push(weekCost / 7);
    }
    const isIncreasing = weeklyRates.length >= 2 && weeklyRates[weeklyRates.length - 1] > weeklyRates[0] * 1.1;
    const isDecreasing = weeklyRates.length >= 2 && weeklyRates[weeklyRates.length - 1] < weeklyRates[0] * 0.9;

    return {
      avgDaily,
      spentThisMonth,
      projectedMonth,
      projectedMonthTrend,
      currentDayOfMonth,
      daysRemaining,
      chartData,
      trend,
      isIncreasing,
      isDecreasing,
      totalDays: daySpends.length,
    };
  }, [logs]);

  if (!forecast) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Need at least 3 days of data to generate forecasts.</p>
        <p className="text-xs text-gray-600 mt-1">Keep using AI features and check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <Calendar className="w-5 h-5 text-[#FF6B00] mb-2" />
          <p className="text-xs text-gray-400">Avg Daily Spend</p>
          <p className="text-xl font-bold text-white mt-1">{forecast.avgDaily.toFixed(2)} INR</p>
          <p className="text-[10px] text-gray-600 mt-1">Based on {forecast.totalDays} days of data</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <Target className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-xs text-gray-400">Spent This Month</p>
          <p className="text-xl font-bold text-white mt-1">{forecast.spentThisMonth.toFixed(2)} INR</p>
          <p className="text-[10px] text-gray-600 mt-1">Day {forecast.currentDayOfMonth}, {forecast.daysRemaining} remaining</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-xs text-gray-400">Projected Month Total</p>
          <p className="text-xl font-bold text-white mt-1">{forecast.projectedMonth.toFixed(2)} INR</p>
          <p className="text-[10px] text-gray-600 mt-1">Based on average daily spend</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <AlertCircle className={`w-5 h-5 mb-2 ${forecast.isIncreasing ? 'text-orange-400' : forecast.isDecreasing ? 'text-emerald-400' : 'text-gray-400'}`} />
          <p className="text-xs text-gray-400">7-Day Trend</p>
          <p className={`text-xl font-bold mt-1 ${forecast.isIncreasing ? 'text-orange-400' : forecast.isDecreasing ? 'text-emerald-400' : 'text-white'}`}>
            {forecast.trend.toFixed(2)} INR/day
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            {forecast.isIncreasing ? 'Usage is increasing' : forecast.isDecreasing ? 'Usage is decreasing' : 'Usage is stable'}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold text-white text-sm mb-4">Monthly Spend -- Actual vs Forecast</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast.chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                formatter={(value: number, name: string) => [`${value.toFixed(2)} INR`, name === 'actual' ? 'Actual' : 'Forecast']}
              />
              <ReferenceLine x={String(forecast.currentDayOfMonth).padStart(2, '0')} stroke="#555" strokeDasharray="3 3" label={{ value: 'Today', fill: '#999', fontSize: 10 }} />
              <Line type="monotone" dataKey="actual" stroke="#FF6B00" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" stroke="#FF6B00" strokeWidth={2} strokeDasharray="6 4" dot={false} opacity={0.4} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {forecast.projectedMonthTrend > 0 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold text-white text-sm mb-4">Projection Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-700/30 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Conservative (avg)</p>
              <p className="text-lg font-bold text-white">{forecast.projectedMonth.toFixed(2)} INR</p>
              <p className="text-[10px] text-gray-600 mt-1">Based on overall average</p>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-4 border border-[#FF6B00]/20">
              <p className="text-xs text-[#FF9A00] mb-1">Trend-Based</p>
              <p className="text-lg font-bold text-white">{forecast.projectedMonthTrend.toFixed(2)} INR</p>
              <p className="text-[10px] text-gray-600 mt-1">Based on 7-day trend</p>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Yearly Estimate</p>
              <p className="text-lg font-bold text-white">{(forecast.projectedMonth * 12).toFixed(2)} INR</p>
              <p className="text-[10px] text-gray-600 mt-1">Annualized from projection</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
