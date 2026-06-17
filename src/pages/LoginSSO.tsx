import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

/* ─── Presentational Component ─────────────────────────── */
interface LoginSSOViewProps {
  isLoading: boolean;
  ssoError: string | null;
  onSSOClick: () => void;
}

function LoginSSOView({ isLoading, ssoError, onSSOClick }: LoginSSOViewProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--color-background)', backgroundImage: 'radial-gradient(ellipse at 50% 0%, #0F172A 0%, #020617 70%)' }}
    >
      {/* Logo */}
      <a href="/" className="mb-8 focus-visible:outline-[#22C55E] rounded" aria-label="Notetaker Platform home">
        <div className="flex items-center gap-2">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect width="40" height="40" rx="10" fill="#22C55E" />
            <path d="M10 13h20M10 20h14M10 27h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="font-code text-[18px] font-semibold text-[#F8FAFC]">Notetaker Platform</span>
        </div>
      </a>

      {/* Login Card */}
      <main
        role="main"
        className="w-full max-w-[480px] rounded-[16px] p-12 border border-[rgba(255,255,255,0.06)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Heading Block */}
        <div className="mb-8 text-center">
          <p className="font-code text-[11px] font-semibold tracking-[0.15em] text-[#22C55E] uppercase mb-2">
            Welcome Back
          </p>
          <h1 className="font-code text-[26px] font-semibold text-[#F8FAFC]">
            Sign in to your account
          </h1>
        </div>

        {/* SSO Login Button */}
        <button
          onClick={onSSOClick}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-[14px] rounded-[8px] bg-[#22C55E] text-white font-sans text-[15px] font-semibold transition-all duration-[200ms] hover:opacity-[0.92] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-[#22C55E] focus-visible:outline-offset-2"
          style={{ boxShadow: isLoading ? undefined : undefined }}
          aria-label="Sign in using Keycloak Single Sign-On"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <Loader2 size={20} className="spin" aria-hidden="true" />
          ) : (
            <KeyRound size={20} aria-hidden="true" />
          )}
          {isLoading ? 'Redirecting…' : 'Continue with SSO'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6" aria-hidden="true">
          <hr className="flex-1 border-[rgba(255,255,255,0.08)]" />
          <span className="font-sans text-[13px] text-[rgba(248,250,252,0.4)]">or</span>
          <hr className="flex-1 border-[rgba(255,255,255,0.08)]" />
        </div>

        {/* Fallback link */}
        <div className="text-center">
          <Link
            to="/login/standard"
            className="font-sans text-[14px] font-medium text-[#22C55E] underline-offset-2 hover:underline transition-colors duration-[150ms] cursor-pointer focus-visible:outline-[#22C55E] focus-visible:outline-offset-2 rounded"
          >
            Use username &amp; password instead →
          </Link>
        </div>

        {/* SSO Unavailability Notice */}
        {ssoError && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 p-4 rounded-[8px] border border-[rgba(239,68,68,0.3)]"
            style={{ background: 'rgba(239,68,68,0.1)' }}
          >
            <AlertCircle size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="font-sans text-[13px] text-[rgba(248,250,252,0.8)] leading-snug">
              {ssoError}
            </p>
          </div>
        )}

        {/* Status region for screen readers */}
        <div role="status" aria-live="polite" className="sr-only">
          {isLoading ? 'Redirecting to SSO provider…' : ''}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8">
        <p className="font-sans text-[12px] text-[rgba(248,250,252,0.35)] text-center">
          © 2026 Notetaker Platform
        </p>
      </footer>
    </div>
  );
}

/* ─── Container Component ──────────────────────────────── */
export default function LoginSSO() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);

  /* Auto-redirect if already authenticated */
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /* Check for invalid token return from SSO */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'sso_failed') {
      showToast('Authentication failed. Please try again.', 'error');
    }
  }, [showToast]);

  const handleSSOClick = async () => {
    setIsLoading(true);
    setSsoError(null);
    try {
      /* Ping SSO health then redirect */
      const res = await fetch('/api/v1/auth/sso/redirect');
      if (!res.ok) throw new Error('SSO unavailable');
      const { redirectUrl } = await res.json() as { redirectUrl: string };
      window.location.href = redirectUrl;
    } catch {
      setIsLoading(false);
      setSsoError(
        'SSO service is currently unavailable. Please try standard login or contact IT support.',
      );
    }
  };

  return (
    <LoginSSOView
      isLoading={isLoading}
      ssoError={ssoError}
      onSSOClick={handleSSOClick}
    />
  );
}
