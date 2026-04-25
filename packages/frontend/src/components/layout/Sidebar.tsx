import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  CloudServerOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  AuditOutlined,
  SettingOutlined,
  DeploymentUnitOutlined,
  ShareAltOutlined,
  ApiOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  CodeOutlined,
  DiffOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    type: 'divider' as const,
  },
  {
    key: 'infra-group',
    icon: <DatabaseOutlined />,
    label: 'Hạ tầng',
    children: [
      { key: '/infra-systems', icon: <ClusterOutlined />, label: 'Hệ thống' },
      { key: '/servers', icon: <CloudServerOutlined />, label: 'Servers' },
      { key: '/networks', icon: <ApartmentOutlined />, label: 'Networks' },
      { key: '/infra-upload', icon: <UploadOutlined />, label: 'Upload Server' },
    ],
  },
  {
    key: 'app-group',
    icon: <AppstoreOutlined />,
    label: 'Ứng dụng',
    children: [
      { key: '/applications', icon: <AppstoreOutlined />, label: 'Ứng dụng' },
      { key: '/applications?tab=infra', icon: <CodeOutlined />, label: 'Phần mềm hạ tầng' },
      { key: '/deployments', icon: <DeploymentUnitOutlined />, label: 'Deployments' },
      { key: '/connections', icon: <ApiOutlined />, label: 'Connections' },
      { key: '/app-import', icon: <UploadOutlined />, label: 'Import CSV' },
    ],
  },
  {
    key: 'monitor-group',
    icon: <ShareAltOutlined />,
    label: 'Giám sát',
    children: [
      { key: '/topology', icon: <ShareAltOutlined />, label: 'Topology 2D' },
      { key: '/changesets', icon: <DiffOutlined />, label: 'ChangeSets' },
      { key: '/audit-logs', icon: <AuditOutlined />, label: 'Audit Log' },
    ],
  },
  {
    type: 'divider' as const,
  },
  {
    key: 'admin-group',
    icon: <SettingOutlined />,
    label: 'Quản trị',
    children: [
      { key: '/admin/users', label: 'Người dùng' },
      { key: '/admin/user-groups', label: 'Nhóm người dùng' },
      { key: '/admin/modules', label: 'Modules' },
      { key: '/admin/system-config', label: 'Cài đặt hệ thống' },
      { key: '/admin/doc-types', label: 'Loại tài liệu' },
    ],
  },
  {
    type: 'divider' as const,
  },
  {
    key: '/guide',
    icon: <QuestionCircleOutlined />,
    label: 'Hướng dẫn sử dụng',
  },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which group should be open based on current path
  const openKeys = (() => {
    const path = location.pathname;
    const keys: string[] = [];
    if (['/infra-systems', '/servers', '/networks', '/infra-upload'].some((p) => path.startsWith(p))) keys.push('infra-group');
    if (['/applications', '/deployments', '/connections', '/app-upload', '/deployment-upload', '/connection-upload', '/app-import'].some((p) => path.startsWith(p))) keys.push('app-group');
    if (['/topology', '/changesets', '/audit-logs'].some((p) => path.startsWith(p))) keys.push('monitor-group');
    if (path.startsWith('/admin')) keys.push('admin-group');
    return keys;
  })();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 700,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {collapsed ? 'SM' : 'SystemManager'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={openKeys}
        items={menuItems}
        onClick={({ key }) => {
          if (key.startsWith('/')) navigate(key);
        }}
      />
    </Sider>
  );
}
