import { useState } from 'react';
import {
  Button, Input, Space, App, Popconfirm, Tag, Modal, Form, Switch, Select, InputNumber,
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { useDocTypeList, useCreateDocType, useUpdateDocType, useDeleteDocType } from '../../hooks/useDeployments';
import type { DeploymentDocType } from '../../types/deployment';
import type { Environment } from '../../types/server';

const ENV_OPTIONS: { value: Environment; label: string }[] = [
  { value: 'DEV', label: 'DEV' },
  { value: 'UAT', label: 'UAT' },
  { value: 'PROD', label: 'PROD' },
];

export default function DeploymentDocTypePage() {
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editDt, setEditDt] = useState<DeploymentDocType | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useDocTypeList({ limit: 100 });
  const createDt = useCreateDocType();
  const updateDt = useUpdateDocType();
  const deleteDt = useDeleteDocType();

  const handleDelete = async (id: string) => {
    try {
      await deleteDt.mutateAsync(id);
      message.success('Đã vô hiệu hoá loại tài liệu');
    } catch {
      message.error('Không thể xoá');
    }
  };

  const openModal = (dt: DeploymentDocType | null) => {
    setEditDt(dt);
    form.setFieldsValue(
      dt ?? {
        required: false,
        environments: [],
        sort_order: 10,
        status: 'ACTIVE',
      },
    );
    setModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (editDt) {
        await updateDt.mutateAsync({ id: editDt.id, ...values });
        message.success('Đã cập nhật');
      } else {
        await createDt.mutateAsync(values);
        message.success('Đã tạo loại tài liệu');
      }
      setModalOpen(false);
      form.resetFields();
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  const columns: ColumnsType<DeploymentDocType> = [
    {
      title: 'Thứ tự',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: 'Tên loại tài liệu',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Bắt buộc',
      dataIndex: 'required',
      key: 'required',
      width: 100,
      render: (v: boolean) => v ? <Tag color="red">Bắt buộc</Tag> : <Tag>Tuỳ chọn</Tag>,
    },
    {
      title: 'Môi trường',
      dataIndex: 'environments',
      key: 'environments',
      width: 180,
      render: (envs: Environment[]) =>
        envs.length === 0
          ? <Tag>Tất cả</Tag>
          : envs.map((e) => <Tag key={e} color={e === 'PROD' ? 'red' : e === 'UAT' ? 'blue' : 'green'}>{e}</Tag>),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={v === 'ACTIVE' ? 'success' : 'default'}>{v}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: DeploymentDocType) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)} />
          <Popconfirm
            title="Vô hiệu hoá loại tài liệu này?"
            description="Các deployment hiện có không bị ảnh hưởng"
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
        title="Loại tài liệu Deployment"
        subtitle="Cấu hình các loại tài liệu bắt buộc cho mỗi deployment"
        helpKey="doc_type"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>
            Thêm loại tài liệu
          </Button>
        }
      />

      <DataTable<DeploymentDocType>
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={editDt ? 'Sửa loại tài liệu' : 'Thêm loại tài liệu mới'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={createDt.isPending || updateDt.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Mã" name="code" rules={[{ required: true }, { max: 50 }]}>
            <Input placeholder="VD: SECURITY_REVIEW" disabled={!!editDt} />
          </Form.Item>
          <Form.Item label="Tên" name="name" rules={[{ required: true }, { max: 255 }]}>
            <Input placeholder="VD: Security Review Document" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Bắt buộc" name="required" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Áp dụng cho môi trường (để trống = tất cả)" name="environments">
            <Select
              mode="multiple"
              options={ENV_OPTIONS}
              placeholder="Chọn môi trường hoặc để trống cho tất cả"
            />
          </Form.Item>
          <Form.Item label="Thứ tự hiển thị" name="sort_order" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          {editDt && (
            <Form.Item label="Trạng thái" name="status">
              <Select options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
