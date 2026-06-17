import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';

export function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Fixed Top Nav */}
      <TopNav
        alertCount={2}
        onMenuToggle={() => setMobileSidebarOpen(prev => !prev)}
      />

      {/* Fixed Sidebar — hidden on mobile, toggled via overlay */}
      <div className="hidden lg:block">
        <Sidebar collapsed={false} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-[39] bg-black/60 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden">
            <Sidebar collapsed={false} />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main
        id="main-content"
        className="min-h-screen lg:ml-[240px] pt-16 flex flex-col focus:outline-none"
        tabIndex={-1}
      >
        <div className="flex-1 max-w-[1280px] w-full mx-auto p-8">
          <Outlet />
        </div>
      </main>

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* ARIA live region for route announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="route-announcer"
      />
    </div>
  );
}
