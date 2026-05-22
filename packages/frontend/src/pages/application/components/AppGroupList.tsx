import { useState } from 'react';
import { Button, Input, Select, Space, App, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SnippetsOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DataTable from '../../../components/common/DataTable';
import AppGroupModal from './AppGroupModal';
import PasteImportDrawer, { type PasteImportConfig } from '../../../components/common/PasteImportDrawer';
import type { EditableColumnDef } from '../../../components/common/EditableTable';
import { useAppGroupList, useDeleteAppGroup, useCreateAppGroup } from '../../../hooks/useAppGroups';
import type { ApplicationGroup, GroupType } from '../../../types/application';

export default function AppGroupList() {
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [groupTypeFilter, setGroupTypeFilter] = useState<GroupType | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<ApplicationGroup | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [pasteImportOpen, setPasteImportOpen] = useState(false);

  const { data, isLoading, refetch } = useAppGroupList({
    page, limit,
    search: search || undefined,
    group_type: groupTypeFilter,
  });
  const deleteGroup = useDeleteAppGroup();
  const createGroup = useCreateAppGroup();

  const groupEditableCols: EditableColumnDef[] = [
    { key: 'code', title: 'Mã nhóm', type: 'text', required: true, placeholder: 'BANKING', width: 140 },
    { key: 'name', title: 'Tên nhóm', type: 'text', required: true, width: 220 },
    { key: 'group_type', title: 'Loại nhóm', type: 'select', required: true, width: 150, options: [
      { value: 'BUSINESS', label: 'Nghiệp vụ' },
      { value: 'INFRASTRUCTURE', label: 'Hạ tầng' },
    ]},
    { key: 'description', title: 'Mô tả', type: 'text', width: 260 },
  ];

  const groupPasteConfig: PasteImportConfig = {
    title: 'Dán & Nhập Nhóm ứng dụng',
    editableColumns: groupEditableCols,
    targetFields: [
      { key: 'code', label: 'Mã nhóm', required: true, aliases: ['ma', 'group_code', 'ma_nhom'] },
      { key: 'name', label: 'Tên nhóm', required: true, aliases: ['ten', 'group_name', 'ten_nhom'] },
      { key: 'group_type', label: 'Loại nhóm', required: true, aliases: ['loai', 'type', 'loai_nhom'], options: [
        { value: 'BUSINESS', label: 'Nghiệp vụ' },
        { value: 'INFRASTRUCTURE', label: 'Hạ tầng' },
      ], valueAliases: { business: 'BUSINESS', nghiep_vu: 'BUSINESS', ha_tang: 'INFRASTRUCTURE', infrastructure: 'INFRASTRUCTURE', infra: 'INFRASTRUCTURE', system: 'INFRASTRUCTURE' } },
      { key: 'description', label: 'Mô tả', aliases: ['mo_ta', 'desc'] },
    ],
    onImport: async (rows) => {
      const results = await Promise.allSettled(
        rows.map((r) => createGroup.mutateAsync(r as Partial<ApplicationGroup>)),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} nhóm không tạo được`);
      refetch();
    },
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGroup.mutateAsync(id);
      message.success('Xóa nhóm ứng dụng thành công');
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch {
      message.error('Không thể xoá nhóm ứng dụng');
    }
  };

  const handleBulkDelete = async () => {
    const results = await Promise.allSettled(
      selectedRowKeys.map((id) => deleteGroup.mutateAsync(id)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) message.success(`Xóa ${succeeded} nhóm ứng dụng thành công`);
    if (failed > 0) message.error(`Không thể xóa ${failed} nhóm (đang chứa ứng dụng)`);
    setSelectedRowKeys([]);
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
            title="Xóa nhóm ứng dụng này?"
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
        <Space>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Xóa ${selectedRowKeys.length} nhóm đã chọn?`}
              description="Hành động này không thể hoàn tác"
              onConfirm={handleBulkDelete}
              okText="Xóa"
              cancelText="Huỷ"
              okType="danger"
            >
              <Button danger icon={<DeleteOutlined />}>
                Xóa ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
          <Button icon={<SnippetsOutlined />} onClick={() => setPasteImportOpen(true)}>Dán & Nhập</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditGroup(null); setModalOpen(true); }}
          >
            Tạo nhóm
          </Button>
        </Space>
      </Space>

      <DataTable<ApplicationGroup>
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        rowKey="id"
        total={data?.total ?? 0}
        page={page}
        pageSize={limit}
        onPageChange={(p, ps) => { setPage(p); setLimit(ps); }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      />

      <AppGroupModal
        open={modalOpen}
        group={editGroup}
        onClose={() => setModalOpen(false)}
      />

      <PasteImportDrawer
        open={pasteImportOpen}
        onClose={() => setPasteImportOpen(false)}
        config={groupPasteConfig}
        onSuccess={() => refetch()}
      />
    </>
  );
}
