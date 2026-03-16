import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTeamAuth } from '../context/TeamAuthContext';
import { Loader2, Eye, EyeOff, Briefcase, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  role: 'employee' | 'management';
}

export default function TeamLogin({ role }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useTeamAuth();
  const navigate = useNavigate();

  const isManagement = role === 'management';
  const title = isManagement ? 'Management Portal' : 'Employee Portal';
  const subtitle = isManagement
    ? 'Sign in to access management tools and reports.'
    : 'Sign in to access your workspace and tasks.';
  const Icon = isManagement ? Briefcase : Users;
  const accentColor = isManagement ? 'from-blue-500 to-cyan-500' : 'from-emerald-500 to-teal-500';
  const accentBorder = isManagement ? 'border-blue-500' : 'border-emerald-500';
  const accentText = isManagement ? 'text-blue-400' : 'text-emerald-400';
  const accentBg = isManagement ? 'bg-blue-500' : 'bg-emerald-500';
  const dashboardPath = isManagement ? '/management/dashboard' : '/employee/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password, role);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Welcome!');
      navigate(dashboardPath);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold gradient-text">MyFinance OS</Link>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
          </div>
          <p className="text-gray-400 mt-2 text-sm">{subtitle}</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:${accentBorder} transition-colors`}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:${accentBorder} transition-colors pr-12`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl bg-gradient-to-r ${accentColor} text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-center text-gray-500 text-xs">
              {isManagement ? (
                <>
                  Are you an employee?{' '}
                  <Link to="/employee" className="text-emerald-400 hover:text-emerald-300 font-medium">
                    Employee Login
                  </Link>
                </>
              ) : (
                <>
                  Are you a manager?{' '}
                  <Link to="/management" className="text-blue-400 hover:text-blue-300 font-medium">
                    Management Login
                  </Link>
                </>
              )}
            </p>
            <p className="text-center text-gray-600 text-xs mt-2">
              Business owner?{' '}
              <Link to="/login" className={`${accentText} font-medium hover:opacity-80`}>
                Owner Login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${accentBg}/10 border ${accentBorder}/20`}>
            <div className={`w-2 h-2 rounded-full ${accentBg} animate-pulse`} />
            <span className={`text-xs font-medium ${accentText}`}>
              {isManagement ? 'Management Access' : 'Employee Access'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
