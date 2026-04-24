import { useState } from 'react';
import {
  Button, Space, App, Popconfirm, Tag, Modal, Form, Input, Select,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DataTable from '../../../components/common/DataTable';
import {
  useHardwareList, useCreateHardware, useUpdateHardware, useDetachHardware,
} from '../../../hooks/useHardware';
import type { HardwareComponent } from '../../../types/server';

const HARDWARE_TYPES = ['CPU', 'RAM', 'HDD', 'SSD', 'NETWORK_CARD'] as const;

interface HardwareFormProps {
  open: boolean;
  onClose: () => void;
  serverId: string;
  initial?: HardwareComponent | null;
}

function HardwareForm({ open, onClose, serverId, initial }: HardwareFormProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const create = useCreateHardware();
  const update = useUpdateHardware();

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...values });
        message.success('Cập nhật thành công');
      } else {
        await create.mutateAsync({ server_id: serverId, ...values } as Parameters<typeof create.mutateAsync>[0]);
        message.success('Thêm phần cứng thành công');
      }
      form.resetFields();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Thao tác thất bại');
    }
  };

  return (
    <Modal
      title={initial ? 'Cập nhật phần cứng' : 'Thêm phần cứng'}
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      footer={null}
      destroyOnHidden
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initial ?? {}}
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        <Form.Item name="type" label="Loại" rules={[{ required: !initial }]}>
          <Select disabled={!!initial}>
            {HARDWARE_TYPES.map((t) => <Select.Option key={t} value={t}>{t}</Select.Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="manufacturer" label="Hãng sản xuất">
          <Input placeholder="Dell, HP, Intel..." />
        </Form.Item>
        <Form.Item name="model" label="Model">
          <Input placeholder="PowerEdge R740" />
        </Form.Item>
        <Form.Item name="serial" label="Serial number">
          <Input />
        </Form.Item>
        <Form.Item label="Thông số kỹ thuật (JSON)">
          <Form.Item name="specs" noStyle>
            <Input.TextArea 
              rows={4} 
              placeholder='{"cores": 8, "threads": 16}' 
              autoSize={{ minRows: 2, maxRows: 6 }}
              onBlur={(e) => {
                try {
                  if (e.target.value) JSON.parse(e.target.value);
                } catch {
                  message.error('Định dạng JSON không hợp lệ');
                }
              }}
            />
          </Form.Item>
          <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '4px' }}>
            Ví dụ: {"{"}"cores": 6, "gb": 16, "size_gb": 150{"}"}
          </div>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={create.isPending || update.isPending}>
              {initial ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button onClick={() => { form.resetFields(); onClose(); }}>Huỷ</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface HardwareTabProps {
  serverId: string;
}

export default function HardwareTab({ serverId }: HardwareTabProps) {
  const { message } = App.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<HardwareComponent | null>(null);
  const { data, isLoading } = useHardwareList({ server_id: serverId });
  const detach = useDetachHardware();

  const handleDetach = async (id: string) => {
    try {
      await detach.mutateAsync(id);
      message.success('Đã thu hồi phần cứng');
    } catch {
      message.error('Không thể thu hồi phần cứng');
    }
  };

  const columns: ColumnsType<HardwareComponent> = [
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    { title: 'Hãng', dataIndex: 'manufacturer', key: 'manufacturer' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Serial', dataIndex: 'serial', key: 'serial' },
    {
      title: 'Thông số',
      dataIndex: 'specs',
      key: 'specs',
      render: (specs: any) => {
        if (!specs) return '—';
        if (typeof specs !== 'object') return String(specs);
        const parts: string[] = [];
        if (specs.cores) parts.push(`${specs.cores} Cores`);
        if (specs.threads) parts.push(`${specs.threads} Threads`);
        if (specs.gb) parts.push(`${specs.gb} GB`);
        if (specs.size_gb) parts.push(`${specs.size_gb} GB`);
        if (specs.speed) parts.push(String(specs.speed));
        return parts.length ? parts.join(' / ') : JSON.stringify(specs);
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: HardwareComponent) => (
        <Space size="small">
          <Button icon={<EditOutlined />} size="small" type="link" onClick={() => setEditItem(record)} />
          <Popconfirm
            title="Thu hồi phần cứng này?"
            description="Component sẽ bị đánh dấu đã thu hồi."
            onConfirm={() => handleDetach(record.id)}
            okText="Thu hồi"
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
          Thêm phần cứng
        </Button>
      </div>
      <DataTable<HardwareComponent>
        rowKey="id"
        dataSource={data?.items}
        columns={columns}
        loading={isLoading}
        pagination={false}
        size="small"
      />
      <HardwareForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        serverId={serverId}
      />
      <HardwareForm
        open={!!editItem}
        onClose={() => setEditItem(null)}
        serverId={serverId}
        initial={editItem}
      />
    </>
  );
}
