import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const missingEnv =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

if (missingEnv) {
  document.getElementById('root')!.innerHTML = `
    <div style="background:#0a0a0a;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;color:#fff;padding:2rem;text-align:center;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" style="margin-bottom:1rem"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      <h2 style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem">Configuration Error</h2>
      <p style="color:#9ca3af;max-width:420px;font-size:0.875rem;line-height:1.6">
        The application is missing required environment variables.<br/><br/>
        Please add <strong style="color:#fff">VITE_SUPABASE_URL</strong> and <strong style="color:#fff">VITE_SUPABASE_ANON_KEY</strong> to your Vercel project's Environment Variables (Settings → Environment Variables), then redeploy.
      </p>
    </div>
  `;
} else {

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackMessage="The application encountered an unexpected error. Please refresh the page.">
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1E1E1E',
                color: '#fff',
                border: '1px solid rgba(255, 107, 0, 0.2)',
              },
              success: { iconTheme: { primary: '#FF6B00', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
}
