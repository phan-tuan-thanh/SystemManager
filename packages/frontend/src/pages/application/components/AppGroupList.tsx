import { useState } from 'react';
import { Button, Input, Select, Space, App, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DataTable from '../../../components/common/DataTable';
import AppGroupModal from './AppGroupModal';
import { useAppGroupList, useDeleteAppGroup } from '../../../hooks/useAppGroups';
import type { ApplicationGroup, GroupType } from '../../../types/application';

export default function AppGroupList() {
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [groupTypeFilter, setGroupTypeFilter] = useState<GroupType | undefined>();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<ApplicationGroup | null>(null);

  const { data, isLoading } = useAppGroupList({
    page, limit,
    search: search || undefined,
    group_type: groupTypeFilter,
  });
  const deleteGroup = useDeleteAppGroup();

  const handleDelete = async (id: string) => {
    try {
      await deleteGroup.mutateAsync(id);
      message.success('Đã xoá nhóm ứng dụng');
    } catch {
      message.error('Không thể xoá nhóm ứng dụng');
    }
  };

  const columns: ColumnsType<ApplicationGroup> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <strong>{code}</strong>,
    },
    {
      title: 'Tên nhóm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Loại nhóm',
      dataIndex: 'group_type',
      key: 'group_type',
      width: 160,
      render: (type: GroupType) => (
        <Tag color={type === 'BUSINESS' ? 'blue' : 'orange'}>
          {type === 'BUSINESS' ? 'Nghiệp vụ' : 'Hạ tầng'}
        </Tag>
      ),
    },
    {
      title: 'Số ứng dụng',
      key: 'apps',
      width: 130,
      render: (_: unknown, record: ApplicationGroup) => (
        <Tag color="blue">{record._count?.applications ?? 0} apps</Tag>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: ApplicationGroup) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditGroup(record); setModalOpen(true); }}
          />
          <Popconfirm
            title="Xoá nhóm ứng dụng?"
            description="Hành động này không thể hoàn tác"
            onConfirm={() => handleDelete(record.id)}
            okType="danger"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm nhóm ứng dụng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="Loại nhóm"
            value={groupTypeFilter}
            onChange={(v) => { setGroupTypeFilter(v); setPage(1); }}
            allowClear
            style={{ width: 180 }}
            options={[
              { value: 'BUSINESS', label: 'Nghiệp vụ' },
              { value: 'INFRASTRUCTURE', label: 'Hạ tầng' },
            ]}
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditGroup(null); setModalOpen(true); }}
        >
          Tạo nhóm
        </Button>
      </Space>

      <DataTable<ApplicationGroup>
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.total ?? 0,
          onChange: setPage,
        }}
      />

      <AppGroupModal
        open={modalOpen}
        group={editGroup}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
