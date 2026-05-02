import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from 'antd';
import {
  CloudServerOutlined,
  GlobalOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { InfraUploadContent } from '../infra-upload/index';
import SimpleImportContent from './SimpleImportContent';
import FirewallImportContent from './FirewallImportContent';
import type { TargetField } from '../../components/common/ColumnMapper';

const TAB_KEYS = ['server', 'network_zone', 'zone_ip', 'firewall'] as const;
type TabKey = typeof TAB_KEYS[number];

const ZONE_TYPE_OPTIONS = [
  { label: 'LOCAL', value: 'LOCAL' },
  { label: 'DMZ', value: 'DMZ' },
  { label: 'DB', value: 'DB' },
  { label: 'INTERNET', value: 'INTERNET' },
  { label: 'MANAGEMENT', value: 'MANAGEMENT' },
  { label: 'DEV', value: 'DEV' },
  { label: 'UAT', value: 'UAT' },
  { label: 'PROD', value: 'PROD' },
  { label: 'STORAGE', value: 'STORAGE' },
  { label: 'BACKUP', value: 'BACKUP' },
  { label: 'CUSTOM', value: 'CUSTOM' },
];

const ENV_OPTIONS = [
  { label: 'DEV', value: 'DEV' },
  { label: 'UAT', value: 'UAT' },
  { label: 'PROD', value: 'PROD' },
];

const NETWORK_ZONE_FIELDS: TargetField[] = [
  {
    key: 'code',
    label: 'Mã vùng (code)',
    required: true,
    aliases: ['zone_code', 'ma_vung', 'zone'],
  },
  {
    key: 'name',
    label: 'Tên vùng (name)',
    required: true,
    aliases: ['zone_name', 'ten_vung'],
  },
  {
    key: 'zone_type',
    label: 'Loại vùng (zone_type)',
    required: true,
    aliases: ['type', 'loai_vung'],
    options: ZONE_TYPE_OPTIONS,
    valueAliases: { local: 'LOCAL', dmz: 'DMZ', db: 'DB', internet: 'INTERNET', management: 'MANAGEMENT' },
  },
  {
    key: 'environment',
    label: 'Môi trường (environment)',
    required: true,
    aliases: ['env', 'moi_truong'],
    options: ENV_OPTIONS,
    valueAliases: { dev: 'DEV', development: 'DEV', uat: 'UAT', staging: 'UAT', prod: 'PROD', production: 'PROD' },
  },
  {
    key: 'color',
    label: 'Màu sắc (color)',
    aliases: ['colour', 'mau'],
  },
  {
    key: 'description',
    label: 'Mô tả (description)',
    aliases: ['desc', 'mo_ta'],
  },
];

const ZONE_IP_FIELDS: TargetField[] = [
  {
    key: 'zone_code',
    label: 'Mã vùng (zone_code)',
    required: true,
    aliases: ['zone', 'ma_vung'],
  },
  {
    key: 'environment',
    label: 'Môi trường (environment)',
    required: true,
    aliases: ['env', 'moi_truong'],
    options: ENV_OPTIONS,
    valueAliases: { dev: 'DEV', development: 'DEV', uat: 'UAT', staging: 'UAT', prod: 'PROD', production: 'PROD' },
  },
  {
    key: 'ip_address',
    label: 'Địa chỉ IP (ip_address)',
    required: true,
    aliases: ['ip', 'ip_addr', 'private_ip', 'dia_chi_ip'],
  },
  {
    key: 'label',
    label: 'Nhãn / Server code (label)',
    aliases: ['name', 'server_code', 'server_name', 'nhan'],
  },
  {
    key: 'is_range',
    label: 'Là dải IP (is_range)',
    aliases: ['range', 'is_cidr', 'la_dai'],
  },
  {
    key: 'description',
    label: 'Mô tả (description)',
    aliases: ['desc', 'mo_ta'],
  },
];

const TAB_ITEMS = [
  {
    key: 'server' as TabKey,
    label: (
      <span>
        <CloudServerOutlined /> Server
      </span>
    ),
    children: <InfraUploadContent />,
  },
  {
    key: 'network_zone' as TabKey,
    label: (
      <span>
        <GlobalOutlined /> Phân vùng mạng
      </span>
    ),
    children: (
      <SimpleImportContent
        type="network_zone"
        title="Phân vùng mạng"
        targetFields={NETWORK_ZONE_FIELDS}
      />
    ),
  },
  {
    key: 'zone_ip' as TabKey,
    label: (
      <span>
        <NodeIndexOutlined /> Zone IPs
      </span>
    ),
    children: (
      <SimpleImportContent
        type="zone_ip"
        title="Zone IP Entries"
        targetFields={ZONE_IP_FIELDS}
      />
    ),
  },
  {
    key: 'firewall' as TabKey,
    label: (
      <span>
        <SafetyCertificateOutlined /> Firewall Rules
      </span>
    ),
    children: <FirewallImportContent />,
  },
];

export default function InfraImportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabKey) ?? 'server';
  const activeTab: TabKey = TAB_KEYS.includes(tab) ? tab : 'server';

  useEffect(() => {
    if (!TAB_KEYS.includes(tab)) {
      setSearchParams({ tab: 'server' }, { replace: true });
    }
  }, [tab, setSearchParams]);

  return (
    <div className="p-6">
      <PageHeader
        title="Import CSV"
        subtitle="Nhập dữ liệu hạ tầng: server, phân vùng mạng, zone IPs và firewall rules từ file CSV"
        helpKey="network"
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
