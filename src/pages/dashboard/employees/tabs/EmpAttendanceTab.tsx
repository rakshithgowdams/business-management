import { useState, useMemo } from 'react';
import { Plus, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { ATTENDANCE_STATUSES, ATTENDANCE_COLORS, MONTHS } from '../../../../lib/employees/constants';
import type { Attendance } from '../../../../lib/employees/types';

interface Props {
  employeeId: string;
  attendance: Attendance[];
  onRefresh: () => void;
}

export default function EmpAttendanceTab({ employeeId, attendance, onRefresh }: Props) {
  const { user } = useAuth();
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: now.toISOString().split('T')[0],
    status: 'Present' as string,
    check_in: '09:00',
    check_out: '18:00',
    notes: '',
  });

  const monthAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });
  }, [attendance, viewMonth, viewYear]);

  const attendanceMap = useMemo(() => {
    const map: Record<string, Attendance> = {};
    monthAttendance.forEach((a) => { map[a.date] = a; });
    return map;
  }, [monthAttendance]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const present = monthAttendance.filter((a) => a.status === 'Present' || a.status === 'Work from Home').length;
  const absent = monthAttendance.filter((a) => a.status === 'Absent').length;
  const leaves = monthAttendance.filter((a) => a.status === 'Leave').length;
  const totalHours = monthAttendance.reduce((s, a) => s + a.hours_worked, 0);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const resetForm = () => {
    setShowForm(false);
    setForm({ date: now.toISOString().split('T')[0], status: 'Present', check_in: '09:00', check_out: '18:00', notes: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hoursWorked = 0;
    if (form.check_in && form.check_out && (form.status === 'Present' || form.status === 'Work from Home')) {
      const [inH, inM] = form.check_in.split(':').map(Number);
      const [outH, outM] = form.check_out.split(':').map(Number);
      hoursWorked = Math.max(0, (outH + outM / 60) - (inH + inM / 60));
    }

    const { error } = await supabase.from('employee_attendance').upsert({
      employee_id: employeeId,
      user_id: user!.id,
      date: form.date,
      status: form.status,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      hours_worked: hoursWorked,
      notes: form.notes,
    }, { onConflict: 'employee_id,date' });

    if (error) { toast.error(error.message); return; }
    toast.success('Attendance logged');
    resetForm();
    onRefresh();
  };

  const exportCSV = () => {
    const headers = ['Date', 'Status', 'Check In', 'Check Out', 'Hours', 'Notes'];
    const rows = monthAttendance.map((a) => [a.date, a.status, a.check_in || '', a.check_out || '', a.hours_worked.toFixed(1), a.notes]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${MONTHS[viewMonth]}_${viewYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><ChevronLeft className="w-5 h-5" /></button>
          <h3 className="text-lg font-semibold">{MONTHS[viewMonth]} {viewYear}</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Log Attendance
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = attendanceMap[dateStr];
            return (
              <div key={day} className="aspect-square flex flex-col items-center justify-center rounded-lg bg-dark-700/50 text-xs relative">
                <span className="text-gray-400">{day}</span>
                {record && (
                  <div className={`w-2 h-2 rounded-full mt-0.5 ${ATTENDANCE_COLORS[record.status] || 'bg-gray-500'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Present</p>
          <p className="text-lg font-bold text-green-400">{present}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Absent</p>
          <p className="text-lg font-bold text-red-400">{absent}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Leaves</p>
          <p className="text-lg font-bold text-yellow-400">{leaves}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Total Hours</p>
          <p className="text-lg font-bold">{totalHours.toFixed(1)}h</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Log Attendance</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
                  {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {(form.status === 'Present' || form.status === 'Work from Home') && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm text-gray-400 mb-1">Check-in</label><input type="time" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
                  <div><label className="block text-sm text-gray-400 mb-1">Check-out</label><input type="time" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
                </div>
              )}
              <div><label className="block text-sm text-gray-400 mb-1">Notes</label><input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">Log Attendance</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
