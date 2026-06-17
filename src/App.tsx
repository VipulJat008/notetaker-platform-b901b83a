import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './hooks/useToast';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

/* ─── Pages ─────────────────────────────────────────────── */
import LoginSSO from './pages/LoginSSO';
import LoginStandard from './pages/LoginStandard';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import CSVIngestion from './pages/CSVIngestion';
import IngestionMonitoring from './pages/IngestionMonitoring';
import CallNoteDetails from './pages/CallNoteDetails';
import PredictionAPIConsole from './pages/PredictionAPIConsole';
import TenantAuthMiddleware from './pages/TenantAuthMiddleware';
import TenantDataIsolation from './pages/TenantDataIsolation';
import MonitoringDashboard from './pages/MonitoringDashboard';
import JobManagement from './pages/JobManagement';

/* ─── Query Client ───────────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,        // 1 minute
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/* ─── Dashboard route — resolves by role ─────────────────── */
function DashboardRouter() {
  // The role-based split is handled inside ProtectedRoute and the
  // AdminDashboard / AgentDashboard components themselves.
  // Operators also see the AdminDashboard view (read-write on jobs,
  // read-only on user management).
  return (
    <ProtectedRoute allowedRoles={['admin', 'operator', 'agent']}>
      {/* Render the correct dashboard based on role via lazy switch */}
      <RoleDashboard />
    </ProtectedRoute>
  );
}

import { useAuth } from './contexts/AuthContext';

function RoleDashboard() {
  const { user } = useAuth();
  if (user?.role === 'agent') return <AgentDashboard />;
  return <AdminDashboard />;
}

/* ─── Call Notes list placeholder ───────────────────────── */
function CallNotesList() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="font-code text-[20px] font-semibold text-[#F8FAFC] mb-2">Call Notes</p>
      <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)]">Select a call note from the list to view details.</p>
    </div>
  );
}

/* ─── 404 ────────────────────────────────────────────────── */
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="font-code text-[48px] font-bold text-[rgba(248,250,252,0.1)] mb-2">404</p>
      <p className="font-code text-[20px] font-semibold text-[#F8FAFC] mb-2">Page not found</p>
      <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)]">The page you are looking for does not exist.</p>
    </div>
  );
}

/* ─── App ────────────────────────────────────────────────── */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <Routes>
                {/* ── Public auth routes ── */}
                <Route path="/login" element={<LoginSSO />} />
                <Route path="/login/standard" element={<LoginStandard />} />

                {/* ── Protected app routes — wrapped in AppShell ── */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'operator', 'agent']}>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  {/* Root redirect */}
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  {/* Dashboard — role-aware */}
                  <Route path="/dashboard" element={<DashboardRouter />} />

                  {/* Call Notes */}
                  <Route
                    path="/call-notes"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'operator', 'agent']}>
                        <CallNotesList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/call-notes/:id"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'operator', 'agent']}>
                        <CallNoteDetails />
                      </ProtectedRoute>
                    }
                  />

                  {/* Monitoring — operator + admin */}
                  <Route
                    path="/monitoring"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'operator']}>
                        <Navigate to="/monitoring/dashboard" replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/monitoring/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'operator']}>
                        <MonitoringDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/monitoring/ingestion"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'operator']}>
                        <IngestionMonitoring />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/monitoring/jobs"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'operator']}>
                        <JobManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* Ingestion — admin only */}
                  <Route
                    path="/ingestion"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <CSVIngestion />
                      </ProtectedRoute>
                    }
                  />

                  {/* API Console — admin only */}
                  <Route
                    path="/api-console"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <PredictionAPIConsole />
                      </ProtectedRoute>
                    }
                  />

                  {/* Settings — admin only */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Navigate to="/settings/auth-config" replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/auth-config"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <TenantAuthMiddleware />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/tenants"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <TenantDataIsolation />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 within shell */}
                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* 404 outside shell */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
