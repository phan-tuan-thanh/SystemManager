import { useState } from 'react';
import {
  Button, Space, App, Popconfirm, Tag, Modal, Form, Input, Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DataTable from '../../../components/common/DataTable';
import {
  useNetworkConfigList,
  useCreateNetworkConfig,
  useUpdateNetworkConfig,
  useDeleteNetworkConfig,
} from '../../../hooks/useNetworkConfigs';
import type { NetworkConfig } from '../../../types/server';

interface NetworkFormProps {
  open: boolean;
  onClose: () => void;
  serverId: string;
  initial?: NetworkConfig | null;
}

function NetworkForm({ open, onClose, serverId, initial }: NetworkFormProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [conflictError, setConflictError] = useState<string | null>(null);
  const create = useCreateNetworkConfig();
  const update = useUpdateNetworkConfig();

  const onFinish = async (values: Record<string, unknown>) => {
    setConflictError(null);
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...values });
        message.success('Cập nhật network config thành công');
      } else {
        await create.mutateAsync({ server_id: serverId, ...values } as Parameters<typeof create.mutateAsync>[0]);
        message.success('Thêm network config thành công');
      }
      form.resetFields();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string; code?: string } } } };
      const msg = err?.response?.data?.error?.message ?? 'Thao tác thất bại';
      if (msg.toLowerCase().includes('ip') || msg.toLowerCase().includes('conflict')) {
        setConflictError(msg);
      } else {
        message.error(msg);
      }
    }
  };

  return (
    <Modal
      title={initial ? 'Cập nhật Network Config' : 'Thêm Network Config'}
      open={open}
      onCancel={() => { form.resetFields(); setConflictError(null); onClose(); }}
      footer={null}
      destroyOnHidden
      width={520}
    >
      {conflictError && (
        <Alert
          type="error"
          message="IP Conflict"
          description={conflictError}
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setConflictError(null)}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        initialValues={initial ?? { dns: [] }}
        onFinish={onFinish}
        style={{ marginTop: 8 }}
      >
        <Form.Item name="interface" label="Interface">
          <Input placeholder="eth0, bond0..." />
        </Form.Item>
        <Form.Item name="private_ip" label="Private IP">
          <Input placeholder="10.0.1.5" />
        </Form.Item>
        <Form.Item name="public_ip" label="Public IP">
          <Input placeholder="203.0.113.10" />
        </Form.Item>
        <Form.Item name="nat_ip" label="NAT IP">
          <Input placeholder="10.0.0.1" />
        </Form.Item>
        <Form.Item name="domain" label="Domain">
          <Input placeholder="app.example.com" />
        </Form.Item>
        <Form.Item name="subnet" label="Subnet">
          <Input placeholder="10.0.1.0/24" />
        </Form.Item>
        <Form.Item name="gateway" label="Gateway">
          <Input placeholder="10.0.1.1" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={create.isPending || update.isPending}>
              {initial ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button onClick={() => { form.resetFields(); setConflictError(null); onClose(); }}>Huỷ</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface NetworkTabProps {
  serverId: string;
}

export default function NetworkTab({ serverId }: NetworkTabProps) {
  const { message } = App.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<NetworkConfig | null>(null);
  const { data, isLoading } = useNetworkConfigList({ server_id: serverId });
  const deleteConfig = useDeleteNetworkConfig();

  const handleDelete = async (id: string) => {
    try {
      await deleteConfig.mutateAsync(id);
      message.success('Đã xoá network config');
    } catch {
      message.error('Không thể xoá network config');
    }
  };

  const columns: ColumnsType<NetworkConfig> = [
    { title: 'Interface', dataIndex: 'interface', key: 'interface', width: 80 },
    {
      title: 'Private IP',
      dataIndex: 'private_ip',
      key: 'private_ip',
      render: (ip: string) => ip ? <Tag color="blue">{ip}</Tag> : '—',
    },
    {
      title: 'Public IP',
      dataIndex: 'public_ip',
      key: 'public_ip',
      render: (ip: string) => ip ? <Tag color="green">{ip}</Tag> : '—',
    },
    { title: 'Domain', dataIndex: 'domain', key: 'domain', ellipsis: true },
    { title: 'Subnet', dataIndex: 'subnet', key: 'subnet' },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: NetworkConfig) => (
        <Space size="small">
          <Button icon={<EditOutlined />} size="small" type="link" onClick={() => setEditItem(record)} />
          <Popconfirm
            title="Xoá network config này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button icon={<DeleteOutlined />} size="small" type="link" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setFormOpen(true)}>
          Thêm network config
        </Button>
      </div>
      <DataTable<NetworkConfig>
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isLoading}
        pagination={false}
        size="small"
      />
      <NetworkForm open={formOpen} onClose={() => setFormOpen(false)} serverId={serverId} />
      <NetworkForm open={!!editItem} onClose={() => setEditItem(null)} serverId={serverId} initial={editItem} />
    </>
  );
}
