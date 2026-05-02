import { useState } from 'react';
import {
  Button, Input, Select, Space, App, Popconfirm, Tag, Modal, Skeleton,
  Tooltip,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ZoneForm from './components/ZoneForm';
import ZoneIpDrawer from './components/ZoneIpDrawer';
import {
  useNetworkZoneList,
  useCreateNetworkZone,
  useUpdateNetworkZone,
  useDeleteNetworkZone,
} from './hooks/useNetworkZones';
import type { ZoneFormValues } from './components/ZoneForm';
import type { NetworkZone, NetworkZoneType, FirewallEnvironment } from '../../types/network-zone';
import { useAuthStore } from '../../stores/authStore';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ZONE_TYPE_COLOR: Record<NetworkZoneType, string> = {
  LOCAL: '#52C41A',
  DMZ: '#FF4D4F',
  DB: '#1890FF',
  DEV: '#722ED1',
  UAT: '#FA8C16',
  PROD: '#F5222D',
  INTERNET: '#08979C',
  MANAGEMENT: '#13C2C2',
  STORAGE: '#EB2F96',
  BACKUP: '#FAAD14',
  CUSTOM: '#8C8C8C',
};

const ENV_ANTD_COLOR: Record<FirewallEnvironment, string> = {
  DEV: 'blue',
  UAT: 'orange',
  PROD: 'red',
};

const ZONE_TYPE_OPTIONS: { value: NetworkZoneType; label: string }[] = [
  { value: 'LOCAL', label: 'LOCAL' },
  { value: 'DMZ', label: 'DMZ' },
  { value: 'DB', label: 'DB' },
  { value: 'DEV', label: 'DEV' },
  { value: 'UAT', label: 'UAT' },
  { value: 'PROD', label: 'PROD' },
  { value: 'INTERNET', label: 'INTERNET' },
  { value: 'MANAGEMENT', label: 'MANAGEMENT' },
  { value: 'STORAGE', label: 'STORAGE' },
  { value: 'BACKUP', label: 'BACKUP' },
  { value: 'CUSTOM', label: 'CUSTOM' },
];

// ─── Create / Edit Modal ────────────────────────────────────────────────────────

interface ZoneModalProps {
  open: boolean;
  editZone: NetworkZone | null;
  onClose: () => void;
}

function ZoneModal({ open, editZone, onClose }: ZoneModalProps) {
  const { message } = App.useApp();
  const { mutateAsync: create, isPending: creating } = useCreateNetworkZone();
  const { mutateAsync: update, isPending: updating } = useUpdateNetworkZone();

  const isEdit = !!editZone;

  const handleFinish = async (values: ZoneFormValues) => {
    try {
      if (isEdit) {
        await update({ id: editZone.id, ...values });
        message.success('Đã cập nhật zone');
      } else {
        await create(values);
        message.success('Đã tạo zone mới');
      }
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể lưu zone');
    }
  };

  return (
    <Modal
      title={isEdit ? `Chỉnh sửa zone — ${editZone?.name}` : 'Tạo Network Zone mới'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnHidden
    >
      <ZoneForm
        key={editZone?.id ?? 'create'}
        initialValues={editZone ?? undefined}
        onFinish={handleFinish}
        onCancel={onClose}
        isPending={creating || updating}
        submitLabel={isEdit ? 'Cập nhật' : 'Tạo mới'}
      />
    </Modal>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function NetworkZonePage() {
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.roles?.some((r) => r === 'ADMIN' || r === 'OPERATOR') ?? false;

  // Filters
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState<FirewallEnvironment | undefined>();
  const [typeFilter, setTypeFilter] = useState<NetworkZoneType | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal / Drawer state
  const [modalOpen, setModalOpen] = useState(false);
  const [editZone, setEditZone] = useState<NetworkZone | null>(null);
  const [ipDrawerZone, setIpDrawerZone] = useState<NetworkZone | null>(null);

  const { data, isLoading } = useNetworkZoneList({
    environment: envFilter,
    zone_type: typeFilter,
    search: search || undefined,
    page,
    limit,
  });

  const deleteZone = useDeleteNetworkZone();

  const handleDelete = async (id: string) => {
    try {
      await deleteZone.mutateAsync(id);
      message.success('Đã xoá zone');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể xoá zone');
    }
  };

  const handleOpenCreate = () => {
    setEditZone(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (zone: NetworkZone) => {
    setEditZone(zone);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditZone(null);
  };

  const columns: ColumnsType<NetworkZone> = [
    {
      title: 'Tên zone',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record) => (
        <span>
          {record.color && (
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: record.color,
                marginRight: 8,
                verticalAlign: 'middle',
              }}
            />
          )}
          {name}
        </span>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => <Tag>{code}</Tag>,
    },
    {
      title: 'Loại zone',
      dataIndex: 'zone_type',
      key: 'zone_type',
      width: 130,
      render: (type: NetworkZoneType) => (
        <Tag color={ZONE_TYPE_COLOR[type]}>{type}</Tag>
      ),
    },
    {
      title: 'Môi trường',
      dataIndex: 'environment',
      key: 'environment',
      width: 110,
      render: (env: FirewallEnvironment) => (
        <Tag color={ENV_ANTD_COLOR[env]}>{env}</Tag>
      ),
    },
    {
      title: 'Màu',
      dataIndex: 'color',
      key: 'color',
      width: 70,
      render: (color?: string) =>
        color ? (
          <Tooltip title={color}>
            <span
              style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: color,
                border: '1px solid #d9d9d9',
              }}
            />
          </Tooltip>
        ) : (
          <span style={{ color: '#bfbfbf' }}>—</span>
        ),
    },
    {
      title: 'Số IP',
      dataIndex: 'ip_count',
      key: 'ip_count',
      width: 80,
      render: (count?: number) => (
        <Tag color={count && count > 0 ? 'geekblue' : 'default'}>{count ?? 0}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (_: unknown, record: NetworkZone) => (
        <Space size={4}>
          <Tooltip title="Quản lý IP">
            <Button
              size="small"
              icon={<UnorderedListOutlined />}
              onClick={() => setIpDrawerZone(record)}
            />
          </Tooltip>
          {canMutate && (
            <>
              <Tooltip title="Chỉnh sửa">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Xóa zone này?"
                description="Tất cả IP trong zone cũng sẽ bị xoá."
                onConfirm={() => handleDelete(record.id)}
                okText="Xoá"
                cancelText="Huỷ"
                okType="danger"
              >
                <Tooltip title="Xoá">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Phân vùng mạng (Network Zone)"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Network Zone' },
        ]}
        helpKey="network-zone"
        extra={
          canMutate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Tạo Zone
            </Button>
          ) : undefined
        }
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên, code..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          style={{ width: 240 }}
        />
        <Select
          placeholder="Môi trường"
          value={envFilter}
          onChange={(v) => { setEnvFilter(v); setPage(1); }}
          allowClear
          style={{ width: 130 }}
        >
          <Select.Option value="DEV">DEV</Select.Option>
          <Select.Option value="UAT">UAT</Select.Option>
          <Select.Option value="PROD">PROD</Select.Option>
        </Select>
        <Select
          placeholder="Loại zone"
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}
          allowClear
          style={{ width: 150 }}
          options={ZONE_TYPE_OPTIONS}
        />
      </Space>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <DataTable<NetworkZone>
          rowKey="id"
          dataSource={data?.items ?? []}
          columns={columns}
          loading={false}
          total={data?.total}
          page={page}
          pageSize={limit}
          onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
          scroll={{ x: 900 }}
        />
      )}

      <ZoneModal
        open={modalOpen}
        editZone={editZone}
        onClose={handleCloseModal}
      />

      <ZoneIpDrawer
        zone={ipDrawerZone}
        open={!!ipDrawerZone}
        onClose={() => setIpDrawerZone(null)}
      />
    </div>
  );
}
