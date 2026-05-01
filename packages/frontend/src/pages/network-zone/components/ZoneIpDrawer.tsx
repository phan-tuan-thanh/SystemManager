import { useState } from 'react';
import {
  Drawer, Table, Button, Tag, Popconfirm, Form,
  Input, Checkbox, Modal, App, Skeleton, Typography,
} from 'antd';
import { PlusOutlined, ImportOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { NetworkZone, ZoneIpEntry } from '../../../types/network-zone';
import {
  useZoneIpList,
  useAddZoneIp,
  useBulkImportIps,
  useRemoveZoneIp,
} from '../hooks/useNetworkZones';

const { Text } = Typography;

// ─── Add IP Form ───────────────────────────────────────────────────────────────

interface AddIpFormValues {
  ip_address: string;
  label?: string;
  is_range: boolean;
}

interface AddIpFormProps {
  zoneId: string;
  onSuccess: () => void;
}

function AddIpForm({ zoneId, onSuccess }: AddIpFormProps) {
  const [form] = Form.useForm<AddIpFormValues>();
  const { mutateAsync: addIp, isPending } = useAddZoneIp();
  const { message } = App.useApp();

  const handleFinish = async (values: AddIpFormValues) => {
    try {
      await addIp({
        zoneId,
        ip_address: values.ip_address,
        label: values.label || undefined,
        is_range: values.is_range ?? false,
      });
      message.success('Đã thêm IP');
      form.resetFields();
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể thêm IP');
    }
  };

  return (
    <Form form={form} layout="inline" onFinish={handleFinish} style={{ marginBottom: 12 }}>
      <Form.Item
        name="ip_address"
        rules={[{ required: true, message: 'Nhập IP' }]}
        style={{ marginBottom: 8 }}
      >
        <Input placeholder="192.168.1.0/24 hoặc 10.0.0.1" style={{ width: 200 }} />
      </Form.Item>
      <Form.Item name="label" style={{ marginBottom: 8 }}>
        <Input placeholder="Label (tuỳ chọn)" style={{ width: 140 }} />
      </Form.Item>
      <Form.Item name="is_range" valuePropName="checked" initialValue={false} style={{ marginBottom: 8 }}>
        <Checkbox>Dải IP</Checkbox>
      </Form.Item>
      <Form.Item style={{ marginBottom: 8 }}>
        <Button type="primary" htmlType="submit" loading={isPending} icon={<PlusOutlined />} size="small">
          Thêm
        </Button>
      </Form.Item>
    </Form>
  );
}

// ─── Bulk Import Modal ─────────────────────────────────────────────────────────

interface BulkImportModalProps {
  zoneId: string;
  open: boolean;
  onClose: () => void;
}

function BulkImportModal({ zoneId, open, onClose }: BulkImportModalProps) {
  const [text, setText] = useState('');
  const { mutateAsync: bulkImport, isPending } = useBulkImportIps();
  const { message } = App.useApp();

  const handleOk = async () => {
    const ips = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (ips.length === 0) {
      message.warning('Vui lòng nhập ít nhất một địa chỉ IP');
      return;
    }

    try {
      await bulkImport({ zoneId, ips });
      message.success(`Đã import ${ips.length} địa chỉ IP`);
      setText('');
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể import IP');
    }
  };

  const handleCancel = () => {
    setText('');
    onClose();
  };

  return (
    <Modal
      title="Import hàng loạt IP"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Import"
      cancelText="Huỷ"
      confirmLoading={isPending}
      destroyOnHidden
    >
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary">Nhập mỗi địa chỉ IP (hoặc CIDR) trên một dòng:</Text>
      </div>
      <Input.TextArea
        rows={10}
        placeholder={'192.168.1.1\n10.0.0.0/24\n172.16.0.1'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {text.trim() && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">
            {text.split('\n').filter((l) => l.trim()).length} dòng sẽ được import
          </Text>
        </div>
      )}
    </Modal>
  );
}

// ─── Zone IP Drawer ────────────────────────────────────────────────────────────

interface ZoneIpDrawerProps {
  zone: NetworkZone | null;
  open: boolean;
  onClose: () => void;
}

export default function ZoneIpDrawer({ zone, open, onClose }: ZoneIpDrawerProps) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const { message } = App.useApp();

  const { data: ips, isLoading } = useZoneIpList(zone?.id ?? '');
  const { mutateAsync: removeIp } = useRemoveZoneIp();

  const handleDelete = async (ipId: string) => {
    if (!zone) return;
    try {
      await removeIp({ zoneId: zone.id, ipId });
      message.success('Đã xoá IP');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể xoá IP');
    }
  };

  const columns: ColumnsType<ZoneIpEntry> = [
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string) => <Text code>{ip}</Text>,
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (label?: string) => label ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Loại',
      dataIndex: 'is_range',
      key: 'is_range',
      width: 90,
      render: (isRange: boolean) =>
        isRange ? <Tag color="blue">Dải IP</Tag> : <Tag>Đơn lẻ</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: ZoneIpEntry) => (
        <Popconfirm
          title="Xoá địa chỉ IP này?"
          onConfirm={() => handleDelete(record.id)}
          okText="Xoá"
          cancelText="Huỷ"
          okType="danger"
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          zone
            ? `Quản lý IP — ${zone.name} (${zone.code})`
            : 'Quản lý IP'
        }
        open={open}
        onClose={onClose}
        width={640}
        destroyOnHidden
        extra={
          <Button
            icon={<ImportOutlined />}
            onClick={() => setBulkOpen(true)}
            size="small"
          >
            Import hàng loạt
          </Button>
        }
      >
        {zone && (
          <>
            <AddIpForm zoneId={zone.id} onSuccess={() => {}} />

            {isLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Table<ZoneIpEntry>
                rowKey="id"
                dataSource={ips ?? []}
                columns={columns}
                size="small"
                pagination={{ pageSize: 20, showTotal: (t) => `Tổng ${t} địa chỉ IP` }}
                scroll={{ x: 500 }}
                locale={{ emptyText: 'Chưa có IP nào trong zone này' }}
              />
            )}
          </>
        )}
      </Drawer>

      {zone && (
        <BulkImportModal
          zoneId={zone.id}
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </>
  );
}
