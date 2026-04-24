import { useState } from 'react';
import { Button, Space, App, Popconfirm, Tag, Modal, Form, InputNumber, Select, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DataTable from '../../../components/common/DataTable';
import { usePortList, useCreatePort, useUpdatePort, useDeletePort } from '../../../hooks/useApplications';
import type { Port } from '../../../types/application';

interface Props {
  applicationId: string;
}

export default function PortTab({ applicationId }: Props) {
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editPort, setEditPort] = useState<Port | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = usePortList({ application_id: applicationId, limit: 100 });
  const createPort = useCreatePort();
  const updatePort = useUpdatePort();
  const deletePort = useDeletePort();

  const handleDelete = async (id: string) => {
    try {
      await deletePort.mutateAsync(id);
      message.success('Đã xoá port');
    } catch {
      message.error('Không thể xoá port');
    }
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (editPort) {
        await updatePort.mutateAsync({ id: editPort.id, ...values });
        message.success('Đã cập nhật port');
      } else {
        await createPort.mutateAsync({ ...values, application_id: applicationId });
        message.success('Đã thêm port');
      }
      form.resetFields();
      setModalOpen(false);
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message ?? 'Có lỗi xảy ra');
    }
  };

  const openEdit = (port: Port) => {
    setEditPort(port);
    form.setFieldsValue(port);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditPort(null);
    form.resetFields();
    form.setFieldsValue({ protocol: 'TCP' });
    setModalOpen(true);
  };

  const columns: ColumnsType<Port> = [
    {
      title: 'Port',
      dataIndex: 'port_number',
      key: 'port_number',
      width: 100,
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
      width: 90,
      render: (v: string) => <Tag color={v === 'TCP' ? 'blue' : 'orange'}>{v}</Tag>,
    },
    {
      title: 'Deployment',
      key: 'deployment',
      render: (_: unknown, record: Port) =>
        record.deployment
          ? `${record.deployment.server?.code} — v${record.deployment.version}`
          : '—',
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
      width: 90,
      render: (_: unknown, record: Port) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Xoá port này?"
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
      <div style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm port
        </Button>
      </div>

      <DataTable<Port>
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={editPort ? 'Sửa port' : 'Thêm port mới'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { form.resetFields(); setModalOpen(false); }}
        confirmLoading={createPort.isPending || updatePort.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Port number" name="port_number" rules={[{ required: true, message: 'Nhập port' }]}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="VD: 8080" />
          </Form.Item>
          <Form.Item label="Protocol" name="protocol" rules={[{ required: true }]}>
            <Select options={[{ value: 'TCP', label: 'TCP' }, { value: 'UDP', label: 'UDP' }]} />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input placeholder="VD: HTTP API endpoint" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
