import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from 'antd';
import { AppstoreOutlined, DeploymentUnitOutlined, ApiOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { AppUploadContent } from '../app-upload/index';
import { DeploymentUploadContent } from '../deployment-upload/index';
import { ConnectionUploadContent } from '../connection-upload/index';

const TAB_KEYS = ['app', 'deployment', 'connection'] as const;
type TabKey = typeof TAB_KEYS[number];

const TAB_ITEMS = [
  {
    key: 'app' as TabKey,
    label: (
      <span>
        <AppstoreOutlined /> Ứng dụng
      </span>
    ),
    children: <AppUploadContent />,
  },
  {
    key: 'deployment' as TabKey,
    label: (
      <span>
        <DeploymentUnitOutlined /> Deployment
      </span>
    ),
    children: <DeploymentUploadContent />,
  },
  {
    key: 'connection' as TabKey,
    label: (
      <span>
        <ApiOutlined /> Connection
      </span>
    ),
    children: <ConnectionUploadContent />,
  },
];

export default function AppImportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabKey) ?? 'app';
  const activeTab: TabKey = TAB_KEYS.includes(tab) ? tab : 'app';

  // Normalize invalid tab param
  useEffect(() => {
    if (!TAB_KEYS.includes(tab)) {
      setSearchParams({ tab: 'app' }, { replace: true });
    }
  }, [tab, setSearchParams]);

  return (
    <div className="p-6">
      <PageHeader
        title="Import CSV"
        subtitle="Nhập dữ liệu ứng dụng, deployment và kết nối từ file CSV"
        helpKey="application"
      />
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
        items={TAB_ITEMS}
        destroyInactiveTabPane
        size="large"
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
