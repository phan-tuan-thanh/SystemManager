import { useState } from 'react';
import {
  Button, Input, Select, Space, App, Popconfirm, Tag, Tooltip,
  Modal, Form, Drawer, Descriptions, Timeline, Table,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, KeyOutlined,
  UserSwitchOutlined, HistoryOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import {
  useUserList, useCreateUser, useUpdateUser,
  useAssignRole, useRemoveRole, useResetPassword, useLoginHistory,
} from '../../hooks/useUsers';
import type { User } from '../../types/user';

const ROLES = ['ADMIN', 'OPERATOR', 'VIEWER'];

// ─── Create User Modal ─────────────────────────────────────────────────────────
function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const { mutateAsync, isPending } = useCreateUser();
  const { message } = App.useApp();

  const onFinish = async (values: { email: string; password: string; full_name: string }) => {
    try {
      await mutateAsync(values);
      message.success('Tạo người dùng thành công');
      form.resetFields();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể tạo người dùng');
    }
  };

  return (
    <Modal title="Tạo người dùng mới" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
        <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 8 }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={isPending}>Tạo</Button>
            <Button onClick={onClose}>Huỷ</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Edit User Drawer ──────────────────────────────────────────────────────────
function EditUserDrawer({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const { mutateAsync, isPending } = useUpdateUser();
  const { message } = App.useApp();

  const onFinish = async (values: { full_name: string; status: string }) => {
    if (!user) return;
    try {
      await mutateAsync({ id: user.id, ...values });
      message.success('Cập nhật thành công');
      onClose();
    } catch {
      message.error('Không thể cập nhật người dùng');
    }
  };

  return (
    <Drawer
      title="Chỉnh sửa người dùng"
      open={open}
      onClose={onClose}
      width={480}
      destroyOnHidden
    >
      {user && (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ full_name: user.full_name, status: user.status }}
          onFinish={onFinish}
        >
          <Form.Item label="Email">
            <Input value={user.email} disabled />
          </Form.Item>
          <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select options={[
              { value: 'ACTIVE', label: 'Hoạt động' },
              { value: 'INACTIVE', label: 'Không hoạt động' },
              { value: 'LOCKED', label: 'Bị khoá' },
            ]} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={isPending}>Lưu</Button>
            <Button onClick={onClose}>Huỷ</Button>
          </Space>
        </Form>
      )}
    </Drawer>
  );
}

// ─── Role Modal ────────────────────────────────────────────────────────────────
function RoleModal({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  const { mutateAsync: assign, isPending: assigning } = useAssignRole();
  const { mutateAsync: remove } = useRemoveRole();
  const { message } = App.useApp();

  const handleAssign = async (role: string) => {
    if (!user) return;
    try {
      await assign({ id: user.id, role });
      message.success(`Đã gán role ${role}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Lỗi');
    }
  };

  const handleRemove = async (role: string) => {
    if (!user) return;
    try {
      await remove({ id: user.id, role });
      message.success(`Đã gỡ role ${role}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Lỗi');
    }
  };

  return (
    <Modal title="Quản lý Role" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      {user && (
        <div style={{ padding: '8px 0' }}>
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Người dùng">{user.full_name}</Descriptions.Item>
            <Descriptions.Item label="Role hiện tại">
              {user.roles.length > 0
                ? user.roles.map((r) => <Tag key={r} color="blue">{r}</Tag>)
                : <Tag>Chưa có role</Tag>
              }
            </Descriptions.Item>
          </Descriptions>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLES.map((role) => {
              const hasRole = user.roles.includes(role);
              return (
                <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tag color={role === 'ADMIN' ? 'red' : role === 'OPERATOR' ? 'blue' : 'default'}>{role}</Tag>
                  {hasRole ? (
                    <Popconfirm title={`Gỡ role ${role}?`} onConfirm={() => handleRemove(role)}>
                      <Button size="small" danger>Gỡ</Button>
                    </Popconfirm>
                  ) : (
                    <Button size="small" type="primary" loading={assigning} onClick={() => handleAssign(role)}>
                      Gán
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const { mutateAsync, isPending } = useResetPassword();
  const { message } = App.useApp();

  const onFinish = async (values: { new_password: string }) => {
    if (!user) return;
    try {
      await mutateAsync({ id: user.id, new_password: values.new_password });
      message.success('Reset mật khẩu thành công');
      form.resetFields();
      onClose();
    } catch {
      message.error('Không thể reset mật khẩu');
    }
  };

  return (
    <Modal title="Reset mật khẩu" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      {user && (
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
          <Form.Item label="Người dùng">
            <Input value={`${user.full_name} (${user.email})`} disabled />
          </Form.Item>
          <Form.Item name="new_password" label="Mật khẩu mới" rules={[{ required: true, min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Xác nhận mật khẩu"
            dependencies={['new_password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu không khớp'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={isPending} danger>Reset</Button>
            <Button onClick={onClose}>Huỷ</Button>
          </Space>
        </Form>
      )}
    </Modal>
  );
}

// ─── Login History Modal ───────────────────────────────────────────────────────
function LoginHistoryModal({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  const { data: history, isLoading } = useLoginHistory(user?.id ?? '', open && !!user?.id);

  return (
    <Modal title="Lịch sử đăng nhập" open={open} onCancel={onClose} footer={null} width={600} destroyOnHidden>
      <Table
        loading={isLoading}
        dataSource={history ?? []}
        rowKey="id"
        size="small"
        columns={[
          {
            title: 'Thời gian tạo',
            dataIndex: 'created_at',
            render: (v: string) => new Date(v).toLocaleString('vi-VN'),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'revoked_at',
            render: (v: string | null) =>
              v ? <Tag color="red">Đã thu hồi ({new Date(v).toLocaleDateString('vi-VN')})</Tag>
                : <Tag color="green">Còn hiệu lực</Tag>,
          },
        ]}
        pagination={{ pageSize: 10 }}
      />
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [historyUser, setHistoryUser] = useState<User | null>(null);

  const { data, isLoading } = useUserList({ page, limit, search: search || undefined, status: statusFilter });

  const columns: ColumnsType<User> = [
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'roles',
      render: (roles: string[]) =>
        roles.length > 0
          ? roles.map((r) => (
              <Tag key={r} color={r === 'ADMIN' ? 'red' : r === 'OPERATOR' ? 'blue' : 'default'}>{r}</Tag>
            ))
          : <Tag>-</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => setEditUser(record)} />
          </Tooltip>
          <Tooltip title="Quản lý role">
            <Button size="small" icon={<UserSwitchOutlined />} onClick={() => setRoleUser(record)} />
          </Tooltip>
          <Tooltip title="Reset mật khẩu">
            <Button size="small" icon={<KeyOutlined />} onClick={() => setResetUser(record)} />
          </Tooltip>
          <Tooltip title="Lịch sử đăng nhập">
            <Button size="small" icon={<HistoryOutlined />} onClick={() => setHistoryUser(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý người dùng"
        helpKey="user"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Người dùng' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Tạo người dùng
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tên, email..."
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          allowClear
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <Select
          placeholder="Lọc trạng thái"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          options={[
            { value: 'ACTIVE', label: 'Hoạt động' },
            { value: 'INACTIVE', label: 'Không hoạt động' },
            { value: 'LOCKED', label: 'Bị khoá' },
          ]}
        />
      </Space>

      <DataTable
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        total={data?.total}
        page={page}
        pageSize={limit}
        onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
        scroll={{ x: 900 }}
      />

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserDrawer user={editUser} open={!!editUser} onClose={() => setEditUser(null)} />
      <RoleModal user={roleUser} open={!!roleUser} onClose={() => setRoleUser(null)} />
      <ResetPasswordModal user={resetUser} open={!!resetUser} onClose={() => setResetUser(null)} />
      <LoginHistoryModal user={historyUser} open={!!historyUser} onClose={() => setHistoryUser(null)} />
    </div>
  );
}
