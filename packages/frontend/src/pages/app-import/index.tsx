import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from 'antd';
import { AppstoreOutlined, DeploymentUnitOutlined, ApiOutlined, GroupOutlined, ThunderboltOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { AppUploadContent } from '../app-upload/index';
import { DeploymentUploadContent } from '../deployment-upload/index';
import { ConnectionUploadContent } from '../connection-upload/index';
import SimpleImportContent from '../infra-import/SimpleImportContent';
import AppQuickImportContent from './AppQuickImportContent';
import type { TargetField } from '../../components/common/ColumnMapper';

const TAB_KEYS = ['quick', 'app', 'app_group', 'deployment', 'connection'] as const;
type TabKey = typeof TAB_KEYS[number];

const GROUP_TYPE_OPTIONS = [
  { label: 'BUSINESS', value: 'BUSINESS' },
  { label: 'INFRASTRUCTURE', value: 'INFRASTRUCTURE' },
];

const APP_GROUP_FIELDS: TargetField[] = [
  {
    key: 'code',
    label: 'Mã nhóm (code)',
    required: true,
    aliases: ['group_code', 'ma_nhom', 'ma'],
  },
  {
    key: 'name',
    label: 'Tên nhóm (name)',
    required: true,
    aliases: ['group_name', 'ten_nhom', 'ten'],
  },
  {
    key: 'group_type',
    label: 'Loại nhóm (group_type)',
    aliases: ['type', 'loai', 'loai_nhom'],
    options: GROUP_TYPE_OPTIONS,
    valueAliases: {
      business: 'BUSINESS', nghiep_vu: 'BUSINESS',
      infrastructure: 'INFRASTRUCTURE', infra: 'INFRASTRUCTURE', ha_tang: 'INFRASTRUCTURE',
    },
  },
  {
    key: 'description',
    label: 'Mô tả (description)',
    aliases: ['desc', 'mo_ta', 'ghi_chu'],
  },
];

const TAB_ITEMS = [
  {
    key: 'quick' as TabKey,
    label: (
      <span>
        <ThunderboltOutlined /> Nhập nhanh (Quick Import)
      </span>
    ),
    children: <AppQuickImportContent />,
  },
  {
    key: 'app' as TabKey,
    label: (
      <span>
        <AppstoreOutlined /> Ứng dụng (Application)
      </span>
    ),
    children: <AppUploadContent />,
  },
  {
    key: 'app_group' as TabKey,
    label: (
      <span>
        <GroupOutlined /> Nhóm ứng dụng (App Group)
      </span>
    ),
    children: (
      <SimpleImportContent
        type="app_group"
        title="Nhóm ứng dụng (App Group)"
        targetFields={APP_GROUP_FIELDS}
      />
    ),
  },
  {
    key: 'deployment' as TabKey,
    label: (
      <span>
        <DeploymentUnitOutlined /> Triển khai (Deployment)
      </span>
    ),
    children: <DeploymentUploadContent />,
  },
  {
    key: 'connection' as TabKey,
    label: (
      <span>
        <ApiOutlined /> Kết nối (Connection)
      </span>
    ),
    children: <ConnectionUploadContent />,
  },
];

export default function AppImportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabKey) ?? 'quick';
  const activeTab: TabKey = TAB_KEYS.includes(tab) ? tab : 'quick';

  // Normalize invalid tab param
  useEffect(() => {
    if (!TAB_KEYS.includes(tab)) {
      setSearchParams({ tab: 'quick' }, { replace: true });
    }
  }, [tab, setSearchParams]);

  return (
    <div className="p-6">
      <PageHeader
        title="Nhập dữ liệu ứng dụng (App CSV Import)"
        subtitle="Nhập dữ liệu từ file CSV: Ứng dụng (Application), Nhóm ứng dụng (App Group), Triển khai (Deployment) và Kết nối (Connection)"
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
