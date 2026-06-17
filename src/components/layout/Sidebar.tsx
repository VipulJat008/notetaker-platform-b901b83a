import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Activity, Upload, Settings,
  Users, LogOut, ChevronDown, ChevronRight, Monitor, Briefcase,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../ui/Modal';
import type { UserRole } from '../../types';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  roles: UserRole[];
  children?: Array<{ label: string; path: string; roles: UserRole[] }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   path: '/dashboard',    icon: LayoutDashboard, roles: ['admin', 'operator', 'agent'] },
  { label: 'Call Notes',  path: '/call-notes',   icon: FileText,        roles: ['admin', 'operator', 'agent'] },
  {
    label: 'Monitoring', path: '/monitoring',   icon: Monitor,         roles: ['admin', 'operator'],
    children: [
      { label: 'Ingestion', path: '/monitoring/ingestion', roles: ['admin', 'operator'] },
      { label: 'Jobs',      path: '/monitoring/jobs',      roles: ['admin', 'operator'] },
    ],
  },
  { label: 'Ingestion',   path: '/ingestion',    icon: Upload,          roles: ['admin', 'operator'] },
  { label: 'API Console', path: '/api-console',  icon: Activity,        roles: ['admin'] },
  {
    label: 'Settings',   path: '/settings',     icon: Settings,        roles: ['admin'],
    children: [
      { label: 'Auth Config', path: '/settings/auth-config', roles: ['admin'] },
      { label: 'Tenants',     path: '/settings/tenants',     roles: ['admin'] },
    ],
  },
  { label: 'Users',       path: '/admin/users',  icon: Users,           roles: ['admin'] },
];

/* ─── Presentational ───────────────────────────────────── */
interface SidebarViewProps {
  user: { name: string; role: string; avatarInitials: string } | null;
  filteredItems: NavItem[];
  openGroups: Set<string>;
  collapsed: boolean;
  showLogoutModal: boolean;
  isLoggingOut: boolean;
  onToggleGroup: (label: string) => void;
  onLogoutRequest: () => void;
  onLogoutConfirm: () => void;
  onLogoutCancel: () => void;
}

function SidebarView({
  user, filteredItems, openGroups, collapsed,
  showLogoutModal, isLoggingOut,
  onToggleGroup, onLogoutRequest, onLogoutConfirm, onLogoutCancel,
}: SidebarViewProps) {
  return (
    <>
      <nav
        className={clsx(
          'fixed left-0 bottom-0 flex flex-col border-r border-[rgba(255,255,255,0.07)] transition-all duration-[200ms] z-[40]',
          collapsed ? 'w-16' : 'w-[240px]',
        )}
        style={{ top: '64px', background: 'var(--color-primary)' }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Nav items */}
        <ul className="flex-1 overflow-y-auto py-4 px-3 space-y-1" role="menu">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const hasChildren = !!item.children?.length;
            const isOpen = openGroups.has(item.label);

            return (
              <li key={item.label} role="none">
                {hasChildren ? (
                  <div>
                    <button
                      onClick={() => onToggleGroup(item.label)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[rgba(248,250,252,0.7)] hover:text-[#F8FAFC] hover:bg-[rgba(255,255,255,0.06)] transition-colors duration-[200ms] cursor-pointer focus-visible:outline-[#22C55E]',
                        isOpen && 'text-[#F8FAFC] bg-[rgba(255,255,255,0.04)]',
                      )}
                      aria-expanded={isOpen}
                      role="menuitem"
                    >
                      <Icon size={18} aria-hidden={true} className="flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 font-sans text-[14px] font-medium text-left">{item.label}</span>
                          {isOpen ? <ChevronDown size={14} aria-hidden={true} /> : <ChevronRight size={14} aria-hidden={true} />}
                        </>
                      )}
                    </button>
                    {isOpen && !collapsed && (
                      <ul className="mt-1 ml-6 space-y-1">
                        {item.children!.map(child => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              className={({ isActive }) => clsx(
                                'block px-3 py-2 rounded-[6px] font-sans text-[13px] transition-colors duration-[150ms] focus-visible:outline-[#22C55E]',
                                isActive
                                  ? 'text-[#22C55E] bg-[rgba(34,197,94,0.08)] font-semibold'
                                  : 'text-[rgba(248,250,252,0.6)] hover:text-[#F8FAFC] hover:bg-[rgba(255,255,255,0.04)]',
                              )}
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    role="menuitem"
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-[8px] font-sans text-[14px] font-medium transition-colors duration-[200ms] focus-visible:outline-[#22C55E]',
                      isActive
                        ? 'text-[#22C55E] bg-[rgba(34,197,94,0.08)] border-l-[3px] border-[#22C55E] pl-[9px]'
                        : 'text-[rgba(248,250,252,0.7)] hover:text-[#F8FAFC] hover:bg-[rgba(255,255,255,0.06)]',
                    )}
                  >
                    <Icon size={18} aria-hidden={true} className="flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>

        {/* User identity + logout */}
        <div className="border-t border-[rgba(255,255,255,0.07)] p-3">
          {!collapsed && user && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-sans text-[12px] font-semibold flex-shrink-0" aria-hidden="true">
                {user.avatarInitials}
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[13px] font-medium text-[#F8FAFC] truncate">{user.name}</p>
                <p className="font-sans text-[11px] text-[#22C55E] capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogoutRequest}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors duration-[200ms] cursor-pointer focus-visible:outline-[#22C55E]"
            role="button"
            aria-label="Sign out of your account"
          >
            <LogOut size={16} aria-hidden="true" className="flex-shrink-0" />
            {!collapsed && <span className="font-sans text-[14px] font-medium">Sign Out</span>}
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={onLogoutCancel}
        title="Sign Out?"
        titleId="sidebar-logout-title"
        descId="sidebar-logout-desc"
        maxWidth="max-w-[400px]"
        role="alertdialog"
      >
        <div className="flex flex-col pt-2">
          <p id="sidebar-logout-desc" className="font-sans text-[14px] text-[rgba(248,250,252,0.6)] leading-relaxed mb-6">
            You'll be signed out of your current session. Any unsaved work will be lost.
          </p>
          <div className="flex items-center gap-2 justify-end">
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
export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['Monitoring']));

  const filteredItems = NAV_ITEMS.filter(
    item => user && item.roles.includes(user.role),
  );

  const handleToggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      showToast('Sign out failed. Please try again.', 'error');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <SidebarView
      user={user ? { name: user.name, role: user.role, avatarInitials: user.avatarInitials } : null}
      filteredItems={filteredItems}
      openGroups={openGroups}
      collapsed={collapsed}
      showLogoutModal={showLogoutModal}
      isLoggingOut={isLoggingOut}
      onToggleGroup={handleToggleGroup}
      onLogoutRequest={() => setShowLogoutModal(true)}
      onLogoutConfirm={handleLogoutConfirm}
      onLogoutCancel={() => setShowLogoutModal(false)}
    />
  );
}
