import { useState } from 'react';
import {
  Button,
  Table,
  Space,
  Input,
  Modal,
  Form,
  App,
  Popconfirm,
  Tooltip,
  Drawer,
  Select,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import {
  useInfraSystemList,
  useCreateInfraSystem,
  useUpdateInfraSystem,
  useDeleteInfraSystem,
  useInfraSystemAccess,
  useGrantSystemAccess,
  useRevokeSystemAccess,
  type InfraSystem,
} from '../../hooks/useInfraSystems';
import { useUserList } from '../../hooks/useUsers';
import { useUserGroupList } from '../../hooks/useUserGroups';

interface CreateFormData {
  code: string;
  name: string;
  description?: string;
}

export default function InfraSystemListPage() {
  const { message } = App.useApp();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<InfraSystem | null>(null);
  const [accessOpen, setAccessOpen] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [form] = Form.useForm();

  // Queries & Mutations
  const { data: systemsData, isLoading } = useInfraSystemList({ page, limit, search });
  const createMutation = useCreateInfraSystem();
  const updateMutation = useUpdateInfraSystem();
  const deleteMutation = useDeleteInfraSystem();
  const { data: accessData } = useInfraSystemAccess(selectedSystemId || '');
  const grantMutation = useGrantSystemAccess(selectedSystemId || '');
  const revokeMutation = useRevokeSystemAccess(selectedSystemId || '');
  const { data: usersData } = useUserList();
  const { data: groupsData } = useUserGroupList();

  // Columns
  const columns: ColumnsType<InfraSystem> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: 'Servers',
      dataIndex: 'server_count',
      key: 'server_count',
      width: 100,
      align: 'center',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text) => <span className="text-gray-500">{text || '—'}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditRecord(record);
                form.setFieldsValue(record);
                setCreateOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Quyền truy cập">
            <Button
              type="text"
              icon={<TeamOutlined />}
              onClick={() => {
                setSelectedSystemId(record.id);
                setAccessOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title={`Xóa hệ thống "${record.name}"?`}
              description={
                record.server_count > 0
                  ? `Cảnh báo: hệ thống đang chứa ${record.server_count} server`
                  : 'Thao tác này không thể hoàn tác'
              }
              onConfirm={() =>
                deleteMutation.mutateAsync(record.id).then(() => {
                  message.success('Xóa hệ thống thành công');
                  setSelectedRowKeys((prev) => prev.filter((k) => k !== record.id));
                }).catch((e: any) => {
                  message.error(e?.response?.data?.error?.message ?? 'Không thể xóa hệ thống');
                })
              }
              okText="Xóa"
              cancelText="Huỷ"
              okType="danger"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedRowKeys.map((id) => deleteMutation.mutateAsync(id)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) message.success(`Xóa ${succeeded} hệ thống thành công`);
    if (failed > 0) message.error(`Không thể xóa ${failed} hệ thống (đang chứa server)`);
    setSelectedRowKeys([]);
  };

  // Handlers
  const handleCreateOrUpdate = async (values: CreateFormData) => {
    try {
      if (editRecord) {
        await updateMutation.mutateAsync({ ...values, id: editRecord.id });
        message.success('Cập nhật hệ thống thành công');
      } else {
        await createMutation.mutateAsync(values);
        message.success('Tạo hệ thống thành công');
      }
      setCreateOpen(false);
      form.resetFields();
      setEditRecord(null);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể lưu hệ thống');
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Hệ thống hạ tầng (Infra Systems)"
        helpKey="infrastructure"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Xóa ${selectedRowKeys.length} hệ thống đã chọn?`}
                onConfirm={handleBulkDelete}
                okText="Xóa"
                cancelText="Huỷ"
                okType="danger"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xóa {selectedRowKeys.length} mục
                </Button>
              </Popconfirm>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditRecord(null);
                form.resetFields();
                setCreateOpen(true);
              }}
            >
              Thêm hệ thống hạ tầng
            </Button>
          </Space>
        }
      />

      {/* Search & Filter */}
      <Space style={{ marginBottom: 16 }} className="w-full flex">
        <Input.Search
          placeholder="Tìm theo tên hoặc mã..."
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 300 }}
        />
      </Space>

      {/* Table */}
      <DataTable<InfraSystem>
        columns={columns}
        dataSource={systemsData?.items ?? []}
        total={systemsData?.total ?? 0}
        page={page}
        pageSize={limit}
        onPageChange={(p, s) => { setPage(p); setLimit(s); }}
        loading={isLoading}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editRecord ? 'Chỉnh sửa hệ thống hạ tầng' : 'Tạo hệ thống hạ tầng mới'}
        open={createOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
          setEditRecord(null);
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <Form.Item
            label="Mã (Code)"
            name="code"
            rules={[{ required: true, message: 'Mã là trường bắt buộc' }]}
          >
            <Input placeholder="BPM_PROCESS_CENTER" disabled={!!editRecord} />
          </Form.Item>
          <Form.Item
            label="Tên"
            name="name"
            rules={[{ required: true, message: 'Tên là trường bắt buộc' }]}
          >
            <Input placeholder="BPM Process Center" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Access Management Drawer */}
      {selectedSystemId && (
        <Drawer
          title="Quản lý quyền truy cập"
          onClose={() => setAccessOpen(false)}
          open={accessOpen}
          width={600}
        >
          {/* Current Grants */}
          <h4>Quyền đã cấp</h4>
          {accessData && accessData.length > 0 ? (
            <Table
              columns={[
                {
                  title: 'Loại',
                  render: (_, record) => (record.user ? 'Người dùng' : 'Nhóm'),
                  width: 80,
                },
                {
                  title: 'Tên',
                  render: (_, record) => record.user?.full_name || record.group?.name,
                },
                {
                  title: 'Email/Mã',
                  render: (_, record) => record.user?.email || record.group?.code,
                },
                {
                  title: 'Thao tác',
                  render: (_, record) => (
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() =>
                        revokeMutation.mutate(record.id, {
                          onSuccess: () => message.success('Thu hồi quyền truy cập thành công'),
                        })
                      }
                    >
                      Thu hồi
                    </Button>
                  ),
                },
              ]}
              dataSource={accessData}
              pagination={false}
              size="small"
              style={{ marginBottom: 24 }}
            />
          ) : (
            <p className="text-gray-400">Chưa có quyền truy cập</p>
          )}

          {/* Grant New Access */}
          <h4 style={{ marginTop: 24 }}>Cấp quyền truy cập</h4>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <label>Người dùng</label>
              <Select
                placeholder="Chọn người dùng"
                options={
                  usersData?.items?.map((u) => ({
                    label: `${u.full_name} (${u.email})`,
                    value: u.id,
                  })) ?? []
                }
                style={{ width: '100%', marginBottom: 12 }}
                onSelect={(userId) => {
                  grantMutation.mutate(
                    { user_id: userId },
                    {
                      onSuccess: () => message.success('Cấp quyền truy cập thành công'),
                    },
                  );
                }}
              />
            </div>
            <div>
              <label>Nhóm người dùng</label>
              <Select
                placeholder="Chọn nhóm"
                options={
                  groupsData?.items?.map((g) => ({
                    label: g.name,
                    value: g.id,
                  })) ?? []
                }
                onSelect={(groupId) => {
                  grantMutation.mutate(
                    { group_id: groupId },
                    {
                      onSuccess: () => message.success('Cấp quyền truy cập thành công'),
                    },
                  );
                }}
              />
            </div>
          </Space>
        </Drawer>
      )}
    </div>
  );
}
