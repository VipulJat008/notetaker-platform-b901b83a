import { useState } from 'react';
import { Bell, LogOut, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../ui/Modal';

interface TopNavProps {
  onMenuToggle?: () => void;
  alertCount?: number;
}

/* ─── Presentational ───────────────────────────────────── */
interface TopNavViewProps {
  userName: string;
  userInitials: string;
  userRole: string;
  alertCount: number;
  theme: string;
  isLoggingOut: boolean;
  showLogoutModal: boolean;
  onToggleTheme: () => void;
  onLogoutRequest: () => void;
  onLogoutConfirm: () => void;
  onLogoutCancel: () => void;
  onMenuToggle?: () => void;
}

function TopNavView({
  userName, userInitials, userRole, alertCount,
  theme, isLoggingOut, showLogoutModal,
  onToggleTheme, onLogoutRequest, onLogoutConfirm, onLogoutCancel, onMenuToggle,
}: TopNavViewProps) {
  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 h-16 flex items-center px-6 gap-4 border-b border-[rgba(255,255,255,0.07)] z-[50]"
        style={{ background: 'var(--color-primary)', backdropFilter: 'blur(8px)' }}
      >
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-[rgba(248,250,252,0.6)] hover:text-[#F8FAFC] transition-colors duration-[150ms] cursor-pointer p-2 rounded focus-visible:outline-[#22C55E]"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="6" fill="#22C55E" />
            <path d="M7 9h14M7 14h10M7 19h7" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-code text-[15px] font-semibold text-[#F8FAFC] hidden sm:block">
            Notetaker Platform
          </span>
        </div>

        <div className="flex-1" />

        {/* Alerts */}
        <button
          className="relative text-[rgba(248,250,252,0.6)] hover:text-[#F8FAFC] transition-colors duration-[150ms] cursor-pointer p-2 rounded focus-visible:outline-[#22C55E]"
          aria-label={alertCount > 0 ? `${alertCount} alerts` : 'No alerts'}
        >
          <Bell size={20} aria-hidden="true" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[10px] font-semibold flex items-center justify-center leading-none" aria-hidden="true">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="text-[rgba(248,250,252,0.6)] hover:text-[#F8FAFC] transition-colors duration-[150ms] cursor-pointer p-2 rounded focus-visible:outline-[#22C55E]"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun size={18} aria-hidden="true" />
            : <Moon size={18} aria-hidden="true" />
          }
        </button>

        {/* User info */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-sans text-[12px] font-semibold flex-shrink-0"
            aria-hidden="true"
          >
            {userInitials}
          </div>
          <div className="hidden md:block">
            <p className="font-sans text-[14px] font-medium text-[#F8FAFC] leading-tight">{userName}</p>
            <p className="font-sans text-[11px] text-[#22C55E] capitalize leading-tight">{userRole}</p>
          </div>
        </div>

        {/* Logout icon button */}
        <button
          onClick={onLogoutRequest}
          className="text-[rgba(248,250,252,0.6)] hover:text-[#EF4444] transition-colors duration-[200ms] cursor-pointer p-2 rounded focus-visible:outline-[#22C55E]"
          aria-label="Sign out"
          tabIndex={0}
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </header>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={onLogoutCancel}
        title="Sign Out?"
        titleId="logout-modal-title"
        descId="logout-modal-desc"
        maxWidth="max-w-[400px]"
        role="alertdialog"
      >
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center mb-4">
            <LogOut size={24} className="text-[#EF4444]" aria-hidden="true" />
          </div>
          <p id="logout-modal-desc" className="font-sans text-[14px] text-[rgba(248,250,252,0.6)] leading-relaxed mb-6">
            You'll be signed out of your current session. Any unsaved work will be lost.
          </p>
          <div className="flex items-center gap-2 w-full justify-end">
            <button
              onClick={onLogoutCancel}
              className="px-4 py-2 rounded-[8px] font-sans text-[14px] font-semibold text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] transition-colors duration-[200ms] cursor-pointer focus-visible:outline-[#22C55E]"
            >
              Cancel
            </button>
            <button
              onClick={onLogoutConfirm}
              disabled={isLoggingOut}
              className="px-4 py-2 rounded-[8px] font-sans text-[14px] font-semibold text-white bg-[#EF4444] hover:opacity-90 transition-opacity duration-[200ms] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-[#22C55E] flex items-center gap-2"
              aria-busy={isLoggingOut}
            >
              {isLoggingOut && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full spin" aria-hidden="true" />}
              Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ─── Container ────────────────────────────────────────── */
export function TopNav({ onMenuToggle, alertCount = 0 }: TopNavProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      /* redirect handled by ProtectedRoute detecting unauthenticated state */
    } catch {
      showToast('Sign out failed. Please try again.', 'error');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <TopNavView
      userName={user?.name ?? 'User'}
      userInitials={user?.avatarInitials ?? 'U'}
      userRole={user?.role ?? ''}
      alertCount={alertCount}
      theme={theme}
      isLoggingOut={isLoggingOut}
      showLogoutModal={showLogoutModal}
      onToggleTheme={toggleTheme}
      onLogoutRequest={() => setShowLogoutModal(true)}
      onLogoutConfirm={handleLogoutConfirm}
      onLogoutCancel={() => setShowLogoutModal(false)}
      onMenuToggle={onMenuToggle}
    />
  );
}
