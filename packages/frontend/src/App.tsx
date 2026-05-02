import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './stores/authStore';
import { useSystemStatus } from './hooks/useSystemStatus';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import ProfilePage from './pages/auth/ProfilePage';
import SetupPage from './pages/setup/SetupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import UserGroupsPage from './pages/admin/UserGroupsPage';
import ModulesPage from './pages/admin/ModulesPage';
import SystemConfigPage from './pages/admin/SystemConfigPage';
import DeploymentDocTypePage from './pages/admin/DeploymentDocTypePage';
import ServerListPage from './pages/server/index';
import ServerDetailPage from './pages/server/[id]';
import NetworkListPage from './pages/network/index';
import ApplicationListPage from './pages/application/index';
import ApplicationDetailPage from './pages/application/[id]';
import DeploymentListPage from './pages/deployment/index';
import DeploymentDetailPage from './pages/deployment/[id]';
import AuditLogPage from './pages/audit/AuditLogPage';
import ConnectionListPage from './pages/connection/index';
import TopologyPage from './pages/topology/index';
import InfraSystemListPage from './pages/infra-system/index';
import InfraImportPage from './pages/infra-import/index';
import AppImportPage from './pages/app-import/index';
import ChangeSetListPage from './pages/changeset/index';
import ChangeSetDetailPage from './pages/changeset/[id]';
import ChangeSetPreviewPage from './pages/changeset/preview';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import GuidePage from './pages/guide/GuidePage';
import NetworkZonePage from './pages/network-zone/index';
import FirewallRulePage from './pages/firewall-rule/index';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { data: status, isLoading } = useSystemStatus();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (status && !status.initialized && user?.roles.includes('ADMIN')) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Admin routes */}
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/user-groups" element={<UserGroupsPage />} />
                <Route path="/admin/modules" element={<ModulesPage />} />
                <Route path="/admin/system-config" element={<SystemConfigPage />} />
                <Route path="/admin/doc-types" element={<DeploymentDocTypePage />} />

                {/* Server routes */}
                <Route path="/servers" element={<ServerListPage />} />
                <Route path="/servers/:id" element={<ServerDetailPage />} />

                {/* Network routes */}
                <Route path="/networks" element={<NetworkListPage />} />
                <Route path="/network-zones" element={<NetworkZonePage />} />
                <Route path="/firewall-rules" element={<FirewallRulePage />} />

                {/* Infra System routes */}
                <Route path="/infra-systems" element={<InfraSystemListPage />} />
                <Route path="/infra-import" element={<InfraImportPage />} />
                {/* Legacy — redirect to unified import */}
                <Route path="/infra-upload" element={<Navigate to="/infra-import?tab=server" replace />} />

                {/* Application routes */}
                <Route path="/applications" element={<ApplicationListPage />} />
                <Route path="/app-import" element={<AppImportPage />} />
                {/* Legacy upload routes — redirect to unified import page */}
                <Route path="/app-upload" element={<Navigate to="/app-import?tab=app" replace />} />
                <Route path="/deployment-upload" element={<Navigate to="/app-import?tab=deployment" replace />} />
                <Route path="/connection-upload" element={<Navigate to="/app-import?tab=connection" replace />} />
                <Route path="/applications/:id" element={<ApplicationDetailPage />} />
                <Route path="/system-software" element={<Navigate to="/applications?tab=infra" replace />} />

                {/* Deployment routes */}
                <Route path="/deployments" element={<DeploymentListPage />} />
                <Route path="/deployments/:id" element={<DeploymentDetailPage />} />

                {/* Connection routes */}
                <Route path="/connections" element={<ConnectionListPage />} />

                {/* Topology routes */}
                <Route path="/topology" element={<TopologyPage />} />

                {/* ChangeSet routes */}
                <Route path="/changesets" element={<ChangeSetListPage />} />
                <Route path="/changesets/:id" element={<ChangeSetDetailPage />} />
                <Route path="/changesets/:id/preview" element={<ChangeSetPreviewPage />} />

                {/* Audit log routes */}
                <Route path="/audit-logs" element={<AuditLogPage />} />

                {/* Guide routes */}
                <Route path="/guide" element={<GuidePage />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
