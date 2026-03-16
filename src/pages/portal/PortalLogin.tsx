import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, AlertCircle, Sun, Moon } from 'lucide-react';
import { portalLogin, savePortalSession, getStoredPortalSession, validatePortalSession } from '../../lib/portal/api';
import { usePortalTheme } from '../../context/PortalThemeContext';

export default function PortalLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toggleTheme, isDark } = usePortalTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredPortalSession();
    if (stored && stored.slug === slug) {
      validatePortalSession(stored.token)
        .then(() => navigate(`/portal/${slug}/view`, { replace: true }))
        .catch(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    if (!checking) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [checking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !code.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await portalLogin(slug, code.trim());
      savePortalSession(res.data.session_token, slug);
      navigate(`/portal/${slug}/view`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF6B00', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'} ${isDark ? 'bg-orange-600/5' : 'bg-orange-200/30'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-1000 delay-300 ${visible ? 'opacity-100' : 'opacity-0'} ${isDark ? 'bg-blue-600/5' : 'bg-blue-200/20'}`} />
      </div>

      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2.5 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className={`relative w-full max-w-md transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className={`border rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-900 border-white/[0.06]' : 'bg-white border-gray-200'}`}>
          <div className="p-8 pb-0 text-center">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-600/20 transition-all duration-500 ${visible ? 'scale-100' : 'scale-75'}`}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-xl font-bold mb-1 transition-all duration-500 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              Client Portal
            </h1>
            <p className={`text-sm transition-all duration-500 delay-200 ${isDark ? 'text-gray-400' : 'text-gray-500'} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              Enter the access code provided by your service provider to view their portfolio and project updates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className={`transition-all duration-500 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Access Code</label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Enter your access code"
                  autoFocus
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl text-sm tracking-wider font-mono focus:outline-none focus:ring-1 transition-all ${
                    isDark
                      ? 'bg-gray-800 border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20'
                      : 'bg-gray-50 border-gray-200 focus:border-orange-500/50 focus:ring-orange-500/20'
                  }`}
                />
              </div>
            </div>

            <div className={`transition-all duration-500 delay-[400ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/20 transition-all group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Access Portal
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className={`text-center text-xs mt-6 transition-all duration-500 delay-500 ${isDark ? 'text-gray-600' : 'text-gray-400'} ${visible ? 'opacity-100' : 'opacity-0'}`}>
          Secure portal access. Your activity may be logged.
        </p>
      </div>
    </div>
  );
}
