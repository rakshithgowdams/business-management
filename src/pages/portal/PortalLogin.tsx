import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { portalLogin, savePortalSession, getStoredPortalSession, validatePortalSession } from '../../lib/portal/api';

export default function PortalLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

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
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-dark-800 border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 pb-0 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-600/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold mb-1">Client Portal</h1>
            <p className="text-sm text-gray-400">
              Enter the access code provided by your service provider to view their portfolio and project updates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Access Code</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Enter your access code"
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-sm tracking-wider font-mono focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-orange text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/20 transition-all group"
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
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Secure portal access. Your activity may be logged.
        </p>
      </div>
    </div>
  );
}
