import { useState } from 'react';
import {
  Button, Input, Select, Space, App, Popconfirm, Tag, Modal, Form, DatePicker, Tabs,
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import {
  useSystemSoftwareList, useCreateSystemSoftware,
  useUpdateSystemSoftware, useDeleteSystemSoftware,
  useApplicationList,
} from '../../hooks/useApplications';
import { useAppGroupList } from '../../hooks/useAppGroups';
import type { SystemSoftware } from '../../types/application';

const SW_TYPE_LABEL: Record<string, string> = {
  OS: 'OS', RUNTIME: 'Runtime', DATABASE: 'Database',
  MIDDLEWARE: 'Middleware', LIBRARY: 'Library', TOOL: 'Tool', OTHER: 'Other',
};

const SW_TYPE_COLOR: Record<string, string> = {
  OS: 'purple', RUNTIME: 'blue', DATABASE: 'green',
  MIDDLEWARE: 'orange', LIBRARY: 'cyan', TOOL: 'default', OTHER: 'default',
};

function OsAppCatalogTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useApplicationList({
    application_type: 'SYSTEM',
    search: search || undefined,
    page,
    limit: 20,
  });

  const columns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', width: 180, render: (v: string) => <strong>{v}</strong> },
    { title: 'Tên OS / Phần mềm', dataIndex: 'name', key: 'name' },
    {
      title: 'Loại',
      dataIndex: 'sw_type',
      key: 'sw_type',
      width: 120,
      render: (v: string) => v ? <Tag color={SW_TYPE_COLOR[v] ?? 'default'}>{v}</Tag> : '—',
    },
    { title: 'Version', dataIndex: 'version', key: 'version', width: 120, render: (v: string) => v || '—' },
    {
      title: 'Nhóm',
      key: 'group',
      width: 160,
      render: (_: unknown, r: any) => r.group?.name ?? '—',
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm OS / phần mềm..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 260 }}
          allowClear
        />
      </Space>
      <DataTable
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total ?? 0,
          onChange: setPage,
        }}
      />
    </>
  );
}

export default function SystemSoftwarePage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSw, setEditSw] = useState<SystemSoftware | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useSystemSoftwareList({
    page, limit,
    search: search || undefined,
    sw_type: typeFilter,
  });
  const { data: groups } = useAppGroupList({ limit: 100 });
  const createSw = useCreateSystemSoftware();
  const updateSw = useUpdateSystemSoftware();
  const deleteSw = useDeleteSystemSoftware();

  const handleDelete = async (id: string) => {
    try {
      await deleteSw.mutateAsync(id);
      message.success('Đã xoá phần mềm hệ thống');
    } catch {
      message.error('Không thể xoá');
    }
  };

  const openModal = (sw: SystemSoftware | null) => {
    setEditSw(sw);
    form.setFieldsValue(
      sw
        ? { ...sw, eol_date: sw.eol_date ? dayjs(sw.eol_date) : null }
        : { sw_type: 'OS' },
    );
    setModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const dto = {
      ...values,
      eol_date: values.eol_date ? values.eol_date.toISOString() : undefined,
    };
    try {
      if (editSw) {
        await updateSw.mutateAsync({ id: editSw.id, ...dto });
        message.success('Đã cập nhật');
      } else {
        await createSw.mutateAsync(dto);
        message.success('Đã tạo');
      }
      setModalOpen(false);
      form.resetFields();
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  const columns: ColumnsType<SystemSoftware> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: 'Tên phần mềm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Loại',
      dataIndex: 'sw_type',
      key: 'sw_type',
      width: 120,
      render: (v: string) => <Tag color={SW_TYPE_COLOR[v]}>{SW_TYPE_LABEL[v] ?? v}</Tag>,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 120,
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 140,
    },
    {
      title: 'EOL Date',
      dataIndex: 'eol_date',
      key: 'eol_date',
      width: 120,
      render: (v?: string) => {
        if (!v) return '—';
        const isExpired = new Date(v) < new Date();
        return <Tag color={isExpired ? 'red' : 'default'}>{new Date(v).toLocaleDateString('vi-VN')}</Tag>;
      },
    },
    {
      title: 'Nhóm',
      key: 'group',
      width: 160,
      render: (_: unknown, r: SystemSoftware) => r.group?.name ?? '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: SystemSoftware) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          <Popconfirm
            title="Xoá phần mềm này?"
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
      <PageHeader
        title="System Software"
        subtitle="Quản lý phần mềm hệ thống (OS, Runtime, DB...)"
        helpKey="system-software"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>
            Thêm phần mềm
          </Button>
        }
      />

      <Tabs
        defaultActiveKey="catalog"
        items={[
          {
            key: 'catalog',
            label: 'CMDB Catalog',
            children: (
              <>
                <Space style={{ marginBottom: 16 }} wrap>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Tìm phần mềm..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ width: 240 }}
                    allowClear
                  />
                  <Select
                    placeholder="Lọc theo loại"
                    value={typeFilter}
                    onChange={(v) => { setTypeFilter(v); setPage(1); }}
                    allowClear
                    style={{ width: 160 }}
                    options={Object.entries(SW_TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))}
                  />
                </Space>
                <DataTable<SystemSoftware>
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
              </>
            ),
          },
          {
            key: 'os-apps',
            label: 'Danh mục OS (từ Import)',
            children: <OsAppCatalogTab />,
          },
        ]}
      />

      <Modal
        title={editSw ? 'Sửa phần mềm' : 'Thêm phần mềm hệ thống'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={createSw.isPending || updateSw.isPending}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Nhóm" name="group_id" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn nhóm"
              options={(groups?.items ?? []).map((g) => ({ value: g.id, label: `${g.code} — ${g.name}` }))}
            />
          </Form.Item>
          <Form.Item label="Mã" name="code" rules={[{ required: true }, { max: 50 }]}>
            <Input placeholder="VD: UBUNTU_22" disabled={!!editSw} />
          </Form.Item>
          <Form.Item label="Tên" name="name" rules={[{ required: true }, { max: 255 }]}>
            <Input placeholder="VD: Ubuntu Server 22.04 LTS" />
          </Form.Item>
          <Form.Item label="Loại" name="sw_type" rules={[{ required: true }]}>
            <Select options={Object.entries(SW_TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item label="Version" name="version">
            <Input placeholder="VD: 22.04" />
          </Form.Item>
          <Form.Item label="Vendor" name="vendor">
            <Input placeholder="VD: Canonical" />
          </Form.Item>
          <Form.Item label="EOL Date" name="eol_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
