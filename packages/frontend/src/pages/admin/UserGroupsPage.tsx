import { useState } from 'react';
import {
  Button, Input, Space, App, Popconfirm, Tag, Tooltip,
  Modal, Form, Select, Drawer, Transfer, Spin,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, TeamOutlined,
  DeleteOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import {
  useUserGroupList, useCreateUserGroup, useUpdateUserGroup,
  useDeleteUserGroup, useGroupMembers, useAddGroupMembers, useRemoveGroupMembers,
} from '../../hooks/useUserGroups';
import { useUserList } from '../../hooks/useUsers';
import type { UserGroup } from '../../types/user';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'OPERATOR', label: 'OPERATOR' },
  { value: 'VIEWER', label: 'VIEWER' },
];

// ─── Create/Edit Modal ─────────────────────────────────────────────────────────
function GroupFormModal({
  group, open, onClose,
}: { group?: UserGroup | null; open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const { mutateAsync: create, isPending: creating } = useCreateUserGroup();
  const { mutateAsync: update, isPending: updating } = useUpdateUserGroup();
  const { message } = App.useApp();
  const isEdit = !!group;

  const onFinish = async (values: { code?: string; name: string; description?: string; default_role: string }) => {
    try {
      if (isEdit && group) {
        await update({ id: group.id, ...values });
        message.success('Cập nhật nhóm thành công');
      } else {
        await create(values as { code: string; name: string; description?: string; default_role: string });
        message.success('Tạo nhóm thành công');
      }
      form.resetFields();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể lưu nhóm');
    }
  };

  return (
    <Modal
      title={isEdit ? 'Chỉnh sửa nhóm' : 'Tạo nhóm người dùng'}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={group ? { name: group.name, description: group.description, default_role: group.default_role } : undefined}
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        {!isEdit && (
          <Form.Item name="code" label="Mã nhóm (code)" rules={[{ required: true }, { pattern: /^[A-Z0-9_]+$/, message: 'Chỉ dùng chữ hoa, số, gạch dưới' }]}>
            <Input placeholder="VD: PTUD, CSHT" />
          </Form.Item>
        )}
        <Form.Item name="name" label="Tên nhóm" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="default_role" label="Role mặc định" rules={[{ required: true }]}>
          <Select options={ROLE_OPTIONS} />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={creating || updating}>
            {isEdit ? 'Cập nhật' : 'Tạo'}
          </Button>
          <Button onClick={onClose}>Huỷ</Button>
        </Space>
      </Form>
    </Modal>
  );
}

// ─── Member Management Drawer ──────────────────────────────────────────────────
function MemberDrawer({ group, open, onClose }: { group: UserGroup | null; open: boolean; onClose: () => void }) {
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const { data: members, isLoading: loadingMembers } = useGroupMembers(group?.id ?? '', open && !!group?.id);
  const { data: allUsers } = useUserList({ limit: 200 });
  const { mutateAsync: addMembers, isPending: adding } = useAddGroupMembers();
  const { mutateAsync: removeMembers, isPending: removing } = useRemoveGroupMembers();
  const { message } = App.useApp();

  const memberIds = members?.map((m) => m.user_id) ?? [];

  const transferData = (allUsers?.items ?? []).map((u) => ({
    key: u.id,
    title: `${u.full_name} (${u.email})`,
    disabled: false,
  }));

  const handleChange = (nextKeys: string[]) => {
    setTargetKeys(nextKeys);
  };

  const handleSave = async () => {
    if (!group) return;
    const toAdd = targetKeys.filter((k) => !memberIds.includes(k));
    const toRemove = memberIds.filter((k) => !targetKeys.includes(k));
    try {
      if (toAdd.length > 0) await addMembers({ groupId: group.id, userIds: toAdd });
      if (toRemove.length > 0) await removeMembers({ groupId: group.id, userIds: toRemove });
      message.success('Cập nhật thành viên thành công');
      onClose();
    } catch {
      message.error('Không thể cập nhật thành viên');
    }
  };

  return (
    <Drawer
      title={`Thành viên nhóm: ${group?.name ?? ''}`}
      open={open}
      onClose={onClose}
      width={640}
      destroyOnHidden
      extra={
        <Button type="primary" loading={adding || removing} onClick={handleSave}>
          Lưu thay đổi
        </Button>
      }
    >
      {loadingMembers ? (
        <Spin />
      ) : (
        <Transfer
          dataSource={transferData}
          showSearch
          filterOption={(input, item) => item.title.toLowerCase().includes(input.toLowerCase())}
          targetKeys={targetKeys.length ? targetKeys : memberIds}
          onChange={handleChange}
          render={(item) => item.title}
          titles={['Tất cả người dùng', 'Thành viên nhóm']}
          listStyle={{ width: 260, height: 400 }}
          locale={{ itemUnit: 'người', itemsUnit: 'người', searchPlaceholder: 'Tìm kiếm...' }}
        />
      )}
    </Drawer>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UserGroupsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<UserGroup | null>(null);
  const [memberGroup, setMemberGroup] = useState<UserGroup | null>(null);

  const { data, isLoading } = useUserGroupList({ page, limit, search: search || undefined });
  const { mutateAsync: deleteGroup } = useDeleteUserGroup();
  const { message } = App.useApp();

  const handleDelete = async (id: string) => {
    try {
      await deleteGroup(id);
      message.success('Đã xoá nhóm');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể xoá nhóm');
    }
  };

  const columns: ColumnsType<UserGroup> = [
    {
      title: 'Mã nhóm',
      dataIndex: 'code',
      width: 120,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: 'Tên nhóm', dataIndex: 'name' },
    { title: 'Mô tả', dataIndex: 'description', ellipsis: true },
    {
      title: 'Role mặc định',
      dataIndex: 'default_role',
      render: (r: string) => (
        <Tag color={r === 'ADMIN' ? 'red' : r === 'OPERATOR' ? 'blue' : 'default'}>{r}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => setEditGroup(record)} />
          </Tooltip>
          <Tooltip title="Quản lý thành viên">
            <Button size="small" icon={<TeamOutlined />} onClick={() => setMemberGroup(record)} />
          </Tooltip>
          <Popconfirm title="Xoá nhóm này?" onConfirm={() => handleDelete(record.id)} okText="Xoá" cancelText="Huỷ">
            <Tooltip title="Xoá nhóm">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý nhóm người dùng"
        helpKey="user_group"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Nhóm người dùng' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Tạo nhóm
          </Button>
        }
      />

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tên, mã..."
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          allowClear
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
        scroll={{ x: 800 }}
      />

      <GroupFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <GroupFormModal group={editGroup} open={!!editGroup} onClose={() => setEditGroup(null)} />
      <MemberDrawer group={memberGroup} open={!!memberGroup} onClose={() => setMemberGroup(null)} />
    </div>
  );
}
