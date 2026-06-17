import { useState, useEffect, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import type { User as UserType } from '../types';

/* ─── Presentational Component ─────────────────────────── */
interface LoginStandardViewProps {
  username: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  authError: string | null;
  usernameError: string | null;
  passwordError: string | null;
  usernameId: string;
  passwordId: string;
  usernameErrorId: string;
  passwordErrorId: string;
  authErrorId: string;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function LoginStandardView({
  username, password, showPassword, isLoading, authError,
  usernameError, passwordError,
  usernameId, passwordId, usernameErrorId, passwordErrorId, authErrorId,
  onUsernameChange, onPasswordChange, onTogglePassword, onSubmit,
}: LoginStandardViewProps) {
  const canSubmit = username.trim().length > 0 && password.length > 0 && !isLoading;

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
      <div
        className="w-full max-w-[480px] rounded-[16px] p-12 border border-[rgba(255,255,255,0.06)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Heading */}
        <div className="mb-8 text-center">
          <p className="font-code text-[11px] font-semibold tracking-[0.15em] text-[#22C55E] uppercase mb-2">
            Sign In
          </p>
          <h1 className="font-code text-[26px] font-semibold text-[#F8FAFC]">
            Use your platform credentials
          </h1>
        </div>

        <form onSubmit={onSubmit} aria-label="Standard login form" noValidate>
          {/* Username Field */}
          <div className="mb-4">
            <label
              htmlFor={usernameId}
              className="block font-sans text-[13px] font-medium text-[rgba(248,250,252,0.7)] mb-1"
            >
              Username
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(248,250,252,0.4)] pointer-events-none"
                aria-hidden="true"
              />
              <input
                id={usernameId}
                type="text"
                value={username}
                onChange={e => onUsernameChange(e.target.value)}
                placeholder="username@company.com"
                autoComplete="username"
                aria-invalid={!!usernameError}
                aria-describedby={usernameError ? usernameErrorId : undefined}
                className="w-full pl-10 pr-4 py-3 rounded-[8px] font-sans text-[15px] text-[#F8FAFC] placeholder-[rgba(248,250,252,0.35)] border transition-all duration-[200ms] focus:outline-none focus-visible:outline-[#22C55E]"
                style={{
                  background: 'rgba(15,23,42,0.8)',
                  borderColor: usernameError ? '#EF4444' : 'rgba(255,255,255,0.12)',
                  boxShadow: usernameError
                    ? '0 0 0 3px rgba(239,68,68,0.15)'
                    : undefined,
                }}
                onFocus={e => { if (!usernameError) e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.2)'; }}
                onBlur={e => { if (!usernameError) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = ''; } }}
              />
            </div>
            {usernameError && (
              <p id={usernameErrorId} className="mt-1 flex items-center gap-1 font-sans text-[12px] text-[#EF4444]">
                <AlertCircle size={12} aria-hidden="true" />
                {usernameError}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label
              htmlFor={passwordId}
              className="block font-sans text-[13px] font-medium text-[rgba(248,250,252,0.7)] mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(248,250,252,0.4)] pointer-events-none"
                aria-hidden="true"
              />
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => onPasswordChange(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? passwordErrorId : undefined}
                className="w-full pl-10 pr-12 py-3 rounded-[8px] font-sans text-[15px] text-[#F8FAFC] placeholder-[rgba(248,250,252,0.35)] border transition-all duration-[200ms] focus:outline-none focus-visible:outline-[#22C55E]"
                style={{
                  background: 'rgba(15,23,42,0.8)',
                  borderColor: passwordError ? '#EF4444' : 'rgba(255,255,255,0.12)',
                  boxShadow: passwordError ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined,
                }}
                onFocus={e => { if (!passwordError) e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.2)'; }}
                onBlur={e => { if (!passwordError) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = ''; } }}
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(248,250,252,0.5)] hover:text-[#F8FAFC] transition-colors duration-[150ms] cursor-pointer p-1 rounded focus-visible:outline-[#22C55E]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <EyeOff size={16} aria-hidden="true" />
                  : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {passwordError && (
              <p id={passwordErrorId} className="mt-1 flex items-center gap-1 font-sans text-[12px] text-[#EF4444]">
                <AlertCircle size={12} aria-hidden="true" />
                {passwordError}
              </p>
            )}
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div
              id={authErrorId}
              role="alert"
              aria-live="assertive"
              className="mb-4 flex items-start gap-3 p-4 rounded-[8px] border border-[rgba(239,68,68,0.3)]"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <AlertCircle size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="font-sans text-[13px] text-[rgba(248,250,252,0.85)] leading-snug">{authError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-[8px] bg-[#22C55E] text-white font-sans text-[15px] font-semibold transition-all duration-[200ms] cursor-pointer focus-visible:outline-[#22C55E] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ opacity: canSubmit ? undefined : undefined }}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <Loader2 size={18} className="spin" aria-hidden="true" />
            ) : (
              <LogIn size={18} aria-hidden="true" />
            )}
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* DEV-ONLY: dummy credential hint */}
        <div className="mt-5 p-3 rounded-[8px] border border-[rgba(251,191,36,0.3)]" style={{ background: 'rgba(251,191,36,0.07)' }}>
          <p className="font-code text-[11px] font-semibold tracking-widest text-[#F59E0B] uppercase mb-1">Dev mode — dummy credentials</p>
          <p className="font-code text-[12px] text-[rgba(248,250,252,0.6)]">admin / admin123</p>
          <p className="font-code text-[12px] text-[rgba(248,250,252,0.6)]">operator / op123</p>
          <p className="font-code text-[12px] text-[rgba(248,250,252,0.6)]">agent / agent123</p>
        </div>

        {/* Divider + SSO Link */}
        <div className="flex items-center gap-4 my-6" aria-hidden="true">
          <hr className="flex-1 border-[rgba(255,255,255,0.08)]" />
          <span className="font-sans text-[13px] text-[rgba(248,250,252,0.4)]">or sign in with SSO</span>
          <hr className="flex-1 border-[rgba(255,255,255,0.08)]" />
        </div>

        <div className="text-center">
          <Link
            to="/login/sso"
            className="font-sans text-[14px] font-medium text-[#22C55E] underline-offset-2 hover:underline transition-colors duration-[150ms] cursor-pointer focus-visible:outline-[#22C55E] focus-visible:outline-offset-2 rounded"
          >
            ← Back to SSO Login
          </Link>
        </div>
      </div>

      <footer className="mt-8">
        <p className="font-sans text-[12px] text-[rgba(248,250,252,0.35)] text-center">
          © 2026 Notetaker Platform
        </p>
      </footer>
    </div>
  );
}

/* ─── DEV-ONLY: dummy credentials (remove before production) ─ */
const DEV_USERS: Record<string, { password: string; user: UserType }> = {
  admin: {
    password: 'admin123',
    user: { id: 'dev-admin', name: 'Dev Admin', email: 'admin@dev.local', role: 'admin', tenantId: 'tenant-1', avatarInitials: 'DA' },
  },
  operator: {
    password: 'op123',
    user: { id: 'dev-operator', name: 'Dev Operator', email: 'operator@dev.local', role: 'operator', tenantId: 'tenant-1', avatarInitials: 'DO' },
  },
  agent: {
    password: 'agent123',
    user: { id: 'dev-agent', name: 'Dev Agent', email: 'agent@dev.local', role: 'agent', tenantId: 'tenant-1', avatarInitials: 'DA' },
  },
};

/* ─── Container Component ──────────────────────────────── */
export default function LoginStandard() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const usernameId      = useId();
  const passwordId      = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const authErrorId     = useId();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const validate = (): boolean => {
    let valid = true;
    if (!username.trim()) { setUsernameError('Username is required'); valid = false; }
    else setUsernameError(null);
    if (!password) { setPasswordError('Password is required'); valid = false; }
    else setPasswordError(null);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setAuthError(null);

    // DEV: match dummy credentials before hitting the real API
    const devEntry = DEV_USERS[username.trim().toLowerCase()];
    if (devEntry && password === devEntry.password) {
      login('dev-token', devEntry.user);
      showToast(`Logged in as ${devEntry.user.role} (dev mode)`, 'success');
      navigate('/dashboard', { replace: true });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 423) {
        setAuthError('Your account is locked. Contact your administrator.');
        return;
      }
      if (!res.ok) {
        setAuthError('Incorrect username or password. Please try again.');
        return;
      }

      const data = await res.json() as { token: string; user: UserType };
      login(data.token, data.user);
      showToast('Welcome back!', 'success');
      navigate('/dashboard', { replace: true });
    } catch {
      showToast('Network error. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginStandardView
      username={username}
      password={password}
      showPassword={showPassword}
      isLoading={isLoading}
      authError={authError}
      usernameError={usernameError}
      passwordError={passwordError}
      usernameId={usernameId}
      passwordId={passwordId}
      usernameErrorId={usernameErrorId}
      passwordErrorId={passwordErrorId}
      authErrorId={authErrorId}
      onUsernameChange={v => { setUsername(v); setUsernameError(null); setAuthError(null); }}
      onPasswordChange={v => { setPassword(v); setPasswordError(null); setAuthError(null); }}
      onTogglePassword={() => setShowPassword(p => !p)}
      onSubmit={handleSubmit}
    />
  );
}
