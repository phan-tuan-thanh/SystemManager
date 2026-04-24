import { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sidebar collapsed={collapsed} />
      <Layout style={{ overflow: 'hidden' }}>
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 64px - 24px - 24px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
