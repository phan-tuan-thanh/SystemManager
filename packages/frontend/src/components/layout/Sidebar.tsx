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
  DiffOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  NodeIndexOutlined,
  ImportOutlined,
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
  { type: 'divider' as const },
  {
    key: 'infra-group',
    icon: <DatabaseOutlined />,
    label: 'Hạ tầng (Infrastructure)',
    children: [
      { key: '/infra-systems', icon: <ClusterOutlined />, label: 'Hệ thống' },
      { key: '/servers', icon: <CloudServerOutlined />, label: 'Servers' },
      { key: '/networks', icon: <ApartmentOutlined />, label: 'Cấu hình mạng' },
      { key: '/network-zones', icon: <GlobalOutlined />, label: 'Vùng mạng' },
      { key: '/firewall-rules', icon: <SafetyCertificateOutlined />, label: 'Firewall Rules' },
    ],
  },
  {
    key: 'app-group',
    icon: <AppstoreOutlined />,
    label: 'Ứng dụng (Applications)',
    children: [
      { key: '/applications', icon: <AppstoreOutlined />, label: 'Applications' },
      { key: '/deployments', icon: <DeploymentUnitOutlined />, label: 'Deployments' },
      { key: '/connections', icon: <ApiOutlined />, label: 'Connections' },
    ],
  },
  {
    key: 'topology-group',
    icon: <NodeIndexOutlined />,
    label: 'Topology & ChangeSet',
    children: [
      { key: '/topology', icon: <ShareAltOutlined />, label: 'Topology 2D' },
      { key: '/changesets', icon: <DiffOutlined />, label: 'ChangeSets' },
    ],
  },
  {
    key: '/audit-logs',
    icon: <AuditOutlined />,
    label: 'Audit Log',
  },
  {
    key: 'import-group',
    icon: <ImportOutlined />,
    label: 'Import dữ liệu',
    children: [
      { key: '/infra-import', icon: <CloudServerOutlined />, label: 'Hạ tầng & Mạng' },
      { key: '/app-import', icon: <AppstoreOutlined />, label: 'Ứng dụng' },
    ],
  },
  { type: 'divider' as const },
  {
    key: 'admin-group',
    icon: <SettingOutlined />,
    label: 'Quản trị (Admin)',
    children: [
      { key: '/admin/users', label: 'Users' },
      { key: '/admin/user-groups', label: 'User Groups' },
      { key: '/admin/modules', label: 'Modules' },
      { key: '/admin/system-config', label: 'System Config' },
      { key: '/admin/doc-types', label: 'Doc Types' },
    ],
  },
  { type: 'divider' as const },
  {
    key: '/guide',
    icon: <QuestionCircleOutlined />,
    label: 'Hướng dẫn',
  },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which group should be open based on current path
  const openKeys = (() => {
    const path = location.pathname;
    const keys: string[] = [];
    if (['/infra-systems', '/servers', '/networks', '/network-zones', '/firewall-rules'].some((p) => path.startsWith(p))) keys.push('infra-group');
    if (['/applications', '/deployments', '/connections'].some((p) => path.startsWith(p))) keys.push('app-group');
    if (['/topology', '/changesets'].some((p) => path.startsWith(p))) keys.push('topology-group');
    if (['/infra-import', '/infra-upload', '/app-import', '/app-upload', '/deployment-upload', '/connection-upload'].some((p) => path.startsWith(p))) keys.push('import-group');
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
