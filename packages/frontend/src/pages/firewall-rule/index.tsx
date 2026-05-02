import { useState } from 'react';
import {
  Button, Input, Select, Space, App, Popconfirm, Tag, Skeleton, Drawer, Tooltip,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ImportOutlined, ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FirewallRuleForm from './components/FirewallRuleForm';
import FirewallRuleImportModal from './components/FirewallRuleImportModal';
import {
  useFirewallRuleList,
  useCreateFirewallRule,
  useUpdateFirewallRule,
  useDeleteFirewallRule,
  exportFirewallRules,
} from './hooks/useFirewallRules';
import type { FirewallRuleFormValues } from './components/FirewallRuleForm';
import type { FirewallRuleListParams } from './hooks/useFirewallRules';
import type { FirewallRule, FirewallAction, FirewallRuleStatus } from '../../types/firewall-rule';
import type { FirewallEnvironment } from '../../types/network-zone';
import { useAuthStore } from '../../stores/authStore';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ENV_COLOR: Record<FirewallEnvironment, string> = {
  DEV: 'blue',
  UAT: 'orange',
  PROD: 'red',
};

const STATUS_COLOR: Record<FirewallRuleStatus, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
  PENDING_APPROVAL: 'orange',
  REJECTED: 'red',
};

const STATUS_LABEL: Record<FirewallRuleStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING_APPROVAL: 'Pending',
  REJECTED: 'Rejected',
};

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function FirewallRulePage() {
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.roles?.some((r) => r === 'ADMIN' || r === 'OPERATOR') ?? false;

  // ─── Filters ────────────────────────────────────────────────────────────────

  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState<FirewallEnvironment | undefined>();
  const [actionFilter, setActionFilter] = useState<FirewallAction | undefined>();
  const [statusFilter, setStatusFilter] = useState<FirewallRuleStatus | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // ─── Drawer / Import state ───────────────────────────────────────────────────

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRule, setEditRule] = useState<FirewallRule | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ─── Queries & Mutations ─────────────────────────────────────────────────────

  const queryParams: FirewallRuleListParams = {
    page,
    limit,
    environment: envFilter,
    action: actionFilter,
    status: statusFilter,
    search: search || undefined,
  };

  const { data, isLoading } = useFirewallRuleList(queryParams);
  const { mutateAsync: createRule, isPending: creating } = useCreateFirewallRule();
  const { mutateAsync: updateRule, isPending: updating } = useUpdateFirewallRule();
  const deleteRule = useDeleteFirewallRule();

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditRule(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (rule: FirewallRule) => {
    setEditRule(rule);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditRule(null);
  };

  const handleFormFinish = async (values: FirewallRuleFormValues) => {
    try {
      if (editRule) {
        await updateRule({ id: editRule.id, ...values });
        message.success('Đã cập nhật firewall rule');
      } else {
        await createRule(values);
        message.success('Đã tạo firewall rule mới');
      }
      handleCloseDrawer();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể lưu firewall rule');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      message.success('Đã xoá firewall rule');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể xoá firewall rule');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportFirewallRules({
        environment: envFilter,
        action: actionFilter,
        status: statusFilter,
        search: search || undefined,
      });
      message.success('Đang tải xuống file XLSX');
    } catch {
      message.error('Không thể xuất file XLSX');
    } finally {
      setExporting(false);
    }
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────

  const columns: ColumnsType<FirewallRule> = [
    {
      title: 'Tên rule',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      width: 180,
    },
    {
      title: 'Môi trường',
      dataIndex: 'environment',
      key: 'environment',
      width: 100,
      render: (env: FirewallEnvironment) => (
        <Tag color={ENV_COLOR[env]}>{env}</Tag>
      ),
    },
    {
      title: 'Zone nguồn',
      key: 'source_zone',
      width: 140,
      render: (_: unknown, r: FirewallRule) =>
        r.source_zone ? (
          <Tag
            color={r.source_zone.color ?? undefined}
            style={r.source_zone.color ? { borderColor: r.source_zone.color } : {}}
          >
            {r.source_zone.name}
          </Tag>
        ) : (
          <span style={{ color: '#bfbfbf' }}>—</span>
        ),
    },
    {
      title: 'IP nguồn',
      dataIndex: 'source_ip',
      key: 'source_ip',
      width: 140,
      render: (ip?: string) => ip ?? <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: 'Server đích',
      key: 'destination_server',
      width: 180,
      ellipsis: true,
      render: (_: unknown, r: FirewallRule) =>
        r.destination_server ? (
          <Tooltip title={r.destination_server.name}>
            <span>{r.destination_server.code}</span>
          </Tooltip>
        ) : (
          <span style={{ color: '#bfbfbf' }}>—</span>
        ),
    },
    {
      title: 'Port',
      key: 'destination_port',
      width: 120,
      render: (_: unknown, r: FirewallRule) =>
        r.destination_port ? (
          <Tag>
            {r.destination_port.port_number}/{r.destination_port.protocol}
          </Tag>
        ) : (
          <span style={{ color: '#bfbfbf' }}>—</span>
        ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 90,
      render: (action: FirewallAction) => (
        <Tag color={action === 'ALLOW' ? 'green' : 'red'}>{action}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: FirewallRuleStatus) => (
        <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: 'Ngày yêu cầu',
      dataIndex: 'request_date',
      key: 'request_date',
      width: 130,
      render: (v?: string) =>
        v ? new Date(v).toLocaleDateString('vi-VN') : <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: canMutate ? 100 : 40,
      render: (_: unknown, record: FirewallRule) => (
        <Space size={4}>
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
                title="Xóa firewall rule này?"
                description="Thao tác này không thể hoàn tác."
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

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Quản lý Firewall Rule"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Firewall Rules' },
        ]}
        helpKey="firewall-rule"
        extra={
          <Space>
            {canMutate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreate}
              >
                Tạo mới
              </Button>
            )}
            {canMutate && (
              <Button
                icon={<ImportOutlined />}
                onClick={() => setImportOpen(true)}
              >
                Import CSV/XLSX
              </Button>
            )}
            <Button
              icon={<ExportOutlined />}
              loading={exporting}
              onClick={handleExport}
            >
              Export XLSX
            </Button>
          </Space>
        }
      />

      {/* Filter bar */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tên..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          style={{ width: 220 }}
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
          placeholder="Hành động"
          value={actionFilter}
          onChange={(v) => { setActionFilter(v); setPage(1); }}
          allowClear
          style={{ width: 120 }}
        >
          <Select.Option value="ALLOW">ALLOW</Select.Option>
          <Select.Option value="DENY">DENY</Select.Option>
        </Select>
        <Select
          placeholder="Trạng thái"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          allowClear
          style={{ width: 160 }}
        >
          <Select.Option value="ACTIVE">Active</Select.Option>
          <Select.Option value="INACTIVE">Inactive</Select.Option>
          <Select.Option value="PENDING_APPROVAL">Pending Approval</Select.Option>
          <Select.Option value="REJECTED">Rejected</Select.Option>
        </Select>
      </Space>

      {/* Table */}
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <DataTable<FirewallRule>
          rowKey="id"
          dataSource={data?.items ?? []}
          columns={columns}
          loading={false}
          total={data?.total}
          page={page}
          pageSize={limit}
          onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
          scroll={{ x: 1200 }}
        />
      )}

      {/* Create / Edit Drawer */}
      <Drawer
        title={editRule ? `Chỉnh sửa rule — ${editRule.name}` : 'Tạo Firewall Rule mới'}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        width={540}
        destroyOnClose
      >
        <FirewallRuleForm
          key={editRule?.id ?? 'create'}
          initialValues={editRule ?? undefined}
          onFinish={handleFormFinish}
          onCancel={handleCloseDrawer}
          isPending={creating || updating}
          submitLabel={editRule ? 'Cập nhật' : 'Tạo mới'}
        />
      </Drawer>

      {/* Import Modal */}
      <FirewallRuleImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
