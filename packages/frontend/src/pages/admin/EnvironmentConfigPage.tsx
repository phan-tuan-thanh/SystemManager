import { useState } from 'react';
import {
  Button, Input, Space, App, Popconfirm, Tag, Modal, Form, Switch, Select, InputNumber, ColorPicker, Badge,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import {
  useEnvironments,
  useCreateEnvironment,
  useUpdateEnvironment,
  useDeactivateEnvironment,
} from '../../hooks/useEnvironments';
import type { EnvironmentConfig, EnvironmentType } from '../../types/environment';

const TYPE_OPTIONS: { value: EnvironmentType; label: string; color: string }[] = [
  { value: 'PROD', label: 'PROD', color: '#ff4d4f' },
  { value: 'LIVE', label: 'LIVE', color: '#ff4d4f' },
  { value: 'UAT',  label: 'UAT',  color: '#fa8c16' },
  { value: 'DEV',  label: 'DEV',  color: '#52c41a' },
];

const SYSTEM_DEFAULTS = ['DEV', 'UAT', 'PROD'];

export default function EnvironmentConfigPage() {
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<EnvironmentConfig | null>(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const { data: envs = [], isLoading } = useEnvironments();
  const create = useCreateEnvironment();
  const update = useUpdateEnvironment();
  const deactivate = useDeactivateEnvironment();

  const filtered = envs.filter((e) =>
    !search || e.code.toLowerCase().includes(search.toLowerCase()) || e.label.toLowerCase().includes(search.toLowerCase()),
  );

  const openModal = (item: EnvironmentConfig | null) => {
    setEditItem(item);
    if (item) {
      form.setFieldsValue({ ...item });
    } else {
      form.resetFields();
      form.setFieldsValue({ color: '#1890ff', is_active: true, sort_order: (envs.length + 1) * 10 });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const colorValue = typeof values.color === 'object' ? `#${values.color.toHex()}` : values.color;
      const payload = { ...values, color: colorValue };

      if (editItem) {
        await update.mutateAsync({ id: editItem.id, ...payload });
        message.success('Cập nhật môi trường thành công');
      } else {
        payload.code = payload.code.toUpperCase().trim();
        await create.mutateAsync(payload);
        message.success('Tạo môi trường thành công');
      }
      setModalOpen(false);
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message ?? 'Có lỗi xảy ra');
    }
  };

  const handleDeactivate = async (item: EnvironmentConfig) => {
    try {
      await deactivate.mutateAsync(item.id);
      message.success(`Đã vô hiệu hoá môi trường '${item.code}'`);
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message ?? 'Không thể vô hiệu hoá');
    }
  };

  const columns: ColumnsType<EnvironmentConfig> = [
    {
      title: '',
      dataIndex: 'sort_order',
      width: 32,
      render: () => <HolderOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} />,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      width: 120,
      render: (code: string, record) => (
        <Space>
          <span
            style={{
              display: 'inline-block', width: 12, height: 12, borderRadius: 3,
              background: record.color, flexShrink: 0,
            }}
          />
          <strong>{code}</strong>
        </Space>
      ),
    },
    {
      title: 'Tên hiển thị',
      dataIndex: 'label',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 100,
      render: (type: EnvironmentType) => {
        const opt = TYPE_OPTIONS.find((t) => t.value === type);
        return <Tag color={opt?.color ?? 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Màu',
      dataIndex: 'color',
      width: 80,
      render: (color: string) => (
        <span
          style={{
            display: 'inline-block', width: 24, height: 24, borderRadius: 4,
            background: color, border: '1px solid #d9d9d9',
          }}
        />
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sort_order',
      width: 80,
      align: 'center',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      width: 100,
      render: (active: boolean) => (
        <Badge status={active ? 'success' : 'default'} text={active ? 'Active' : 'Inactive'} />
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          {!SYSTEM_DEFAULTS.includes(record.code) && record.is_active && (
            <Popconfirm
              title={`Vô hiệu hoá "${record.code}"?`}
              description="Không thể vô hiệu hoá nếu còn resource đang dùng."
              onConfirm={() => handleDeactivate(record)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý Môi trường"
        subtitle="Cấu hình danh sách môi trường cho toàn hệ thống (PROD, UAT, DEV1, DEV2...)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>
            Thêm môi trường
          </Button>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm theo code hoặc tên..."
          style={{ width: 300 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />

      <Modal
        title={editItem ? `Sửa môi trường: ${editItem.code}` : 'Thêm môi trường mới'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={create.isPending || update.isPending}
        okText={editItem ? 'Lưu' : 'Tạo'}
        cancelText="Huỷ"
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editItem && (
            <Form.Item
              name="code"
              label="Code"
              rules={[
                { required: true, message: 'Vui lòng nhập code' },
                { pattern: /^[A-Z0-9_]+$/, message: 'Chỉ cho phép chữ hoa, số, dấu gạch dưới' },
                { max: 20 },
              ]}
            >
              <Input
                placeholder="VD: DEV1, UAT2, STAGING"
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => form.setFieldValue('code', e.target.value.toUpperCase())}
              />
            </Form.Item>
          )}

          <Form.Item name="label" label="Tên hiển thị" rules={[{ required: true }]}>
            <Input placeholder="VD: Development 1, UAT Zone 2" />
          </Form.Item>

          <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
            <Select options={TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item name="color" label="Màu sắc">
            <ColorPicker format="hex" />
          </Form.Item>

          <Form.Item name="sort_order" label="Thứ tự hiển thị">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
