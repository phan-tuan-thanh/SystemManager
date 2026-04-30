import { useState } from 'react';
import {
  Button, Space, App, Popconfirm, Tag, Modal, Form, Input, Select, Row, Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DataTable from '../../../components/common/DataTable';
import {
  useHardwareList, useCreateHardware, useUpdateHardware, useDetachHardware,
} from '../../../hooks/useHardware';
import type { HardwareComponent } from '../../../types/server';

const HARDWARE_TYPES = ['CPU', 'RAM', 'HDD', 'SSD', 'NETWORK_CARD'] as const;

// Common spec key suggestions per hardware type
const SPEC_PRESETS: Record<string, string[]> = {
  CPU: ['cores', 'threads', 'speed_ghz', 'architecture'],
  RAM: ['gb', 'speed_mhz', 'type'],
  HDD: ['size_gb', 'rpm', 'interface'],
  SSD: ['size_gb', 'interface', 'read_mbps', 'write_mbps'],
  NETWORK_CARD: ['speed_gbps', 'ports', 'interface'],
};

interface KvPair { key: string; value: string }

function specsToKv(specs: unknown): KvPair[] {
  if (!specs || typeof specs !== 'object') return [];
  return Object.entries(specs as Record<string, unknown>).map(([key, value]) => ({
    key,
    value: String(value ?? ''),
  }));
}

function kvToSpecs(pairs: KvPair[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { key, value } of pairs) {
    const k = key.trim();
    if (k) result[k] = value;
  }
  return result;
}

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

  const selectedType: string | undefined = Form.useWatch('type', form);
  const presetKeys = selectedType ? (SPEC_PRESETS[selectedType] ?? []) : [];

  const onFinish = async (values: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { specs_kv, ...rest } = values as { specs_kv?: KvPair[] } & Record<string, unknown>;
    const specs = kvToSpecs(specs_kv ?? []);
    const payload = { ...rest, specs: Object.keys(specs).length ? specs : undefined };
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...payload });
        message.success('Cập nhật thành công');
      } else {
        await create.mutateAsync({ server_id: serverId, ...payload } as Parameters<typeof create.mutateAsync>[0]);
        message.success('Thêm phần cứng thành công');
      }
      form.resetFields();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Thao tác thất bại');
    }
  };

  const initialValues = initial
    ? { ...initial, specs_kv: specsToKv(initial.specs) }
    : {};

  return (
    <Modal
      title={initial ? 'Cập nhật phần cứng' : 'Thêm phần cứng'}
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      footer={null}
      destroyOnHidden
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="type" label="Loại" rules={[{ required: !initial }]}>
              <Select disabled={!!initial}>
                {HARDWARE_TYPES.map((t) => <Select.Option key={t} value={t}>{t}</Select.Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="manufacturer" label="Hãng sản xuất">
              <Input placeholder="Dell, HP, Intel..." />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="model" label="Model">
              <Input placeholder="PowerEdge R740" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="serial" label="Serial number">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Thông số kỹ thuật">
          {presetKeys.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#8c8c8c', marginRight: 6 }}>Gợi ý:</span>
              {presetKeys.map((k) => (
                <Tag
                  key={k}
                  style={{ cursor: 'pointer', marginBottom: 4 }}
                  onClick={() => {
                    const current: KvPair[] = form.getFieldValue('specs_kv') ?? [];
                    const exists = current.some((p) => p.key === k);
                    if (!exists) {
                      form.setFieldValue('specs_kv', [...current, { key: k, value: '' }]);
                    }
                  }}
                >
                  + {k}
                </Tag>
              ))}
            </div>
          )}

          <Form.List name="specs_kv">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                {fields.map(({ key, name }) => (
                  <Row key={key} gutter={8} align="middle">
                    <Col flex="1">
                      <Form.Item name={[name, 'key']} noStyle>
                        <Input placeholder="Tên thông số (ví dụ: cores)" size="small" />
                      </Form.Item>
                    </Col>
                    <Col flex="1">
                      <Form.Item name={[name, 'value']} noStyle>
                        <Input placeholder="Giá trị (ví dụ: 8)" size="small" />
                      </Form.Item>
                    </Col>
                    <Col flex="none">
                      <MinusCircleOutlined
                        style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 16 }}
                        onClick={() => remove(name)}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ key: '', value: '' })}
                  icon={<PlusOutlined />}
                  size="small"
                  block
                >
                  Thêm thông số
                </Button>
              </Space>
            )}
          </Form.List>
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
        if (specs.speed_ghz) parts.push(`${specs.speed_ghz} GHz`);
        if (specs.speed_mhz) parts.push(`${specs.speed_mhz} MHz`);
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
