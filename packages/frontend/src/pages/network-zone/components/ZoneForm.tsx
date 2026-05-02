import { Form, Input, Select, Button, Space } from 'antd';
import type { NetworkZone, NetworkZoneType, FirewallEnvironment } from '../../../types/network-zone';

const ZONE_TYPES: { value: NetworkZoneType; label: string }[] = [
  { value: 'LOCAL', label: 'LOCAL' },
  { value: 'DMZ', label: 'DMZ' },
  { value: 'DB', label: 'DB' },
  { value: 'DEV', label: 'DEV' },
  { value: 'UAT', label: 'UAT' },
  { value: 'PROD', label: 'PROD' },
  { value: 'INTERNET', label: 'INTERNET' },
  { value: 'MANAGEMENT', label: 'MANAGEMENT' },
  { value: 'STORAGE', label: 'STORAGE' },
  { value: 'BACKUP', label: 'BACKUP' },
  { value: 'CUSTOM', label: 'CUSTOM' },
];

const ENV_OPTIONS: { value: FirewallEnvironment; label: string }[] = [
  { value: 'DEV', label: 'DEV' },
  { value: 'UAT', label: 'UAT' },
  { value: 'PROD', label: 'PROD' },
];

export interface ZoneFormValues {
  name: string;
  code: string;
  zone_type: NetworkZoneType;
  environment: FirewallEnvironment;
  description?: string;
  color?: string;
}

interface ZoneFormProps {
  initialValues?: Partial<NetworkZone>;
  onFinish: (values: ZoneFormValues) => void | Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
  submitLabel?: string;
}

export default function ZoneForm({
  initialValues,
  onFinish,
  onCancel,
  isPending = false,
  submitLabel = 'Lưu',
}: ZoneFormProps) {
  const [form] = Form.useForm<ZoneFormValues>();

  const handleFinish = async (values: ZoneFormValues) => {
    await onFinish(values);
    form.resetFields();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
      style={{ marginTop: 8 }}
    >
      <Form.Item
        name="name"
        label="Tên zone"
        rules={[{ required: true, message: 'Vui lòng nhập tên zone' }]}
      >
        <Input placeholder="Ví dụ: Production DB Zone" />
      </Form.Item>

      <Form.Item
        name="code"
        label="Mã zone (code)"
        rules={[
          { required: true, message: 'Vui lòng nhập mã zone' },
          { pattern: /^[A-Z0-9_-]+$/i, message: 'Chỉ dùng chữ cái, số, gạch dưới, gạch ngang' },
        ]}
      >
        <Input placeholder="Ví dụ: PROD-DB-ZONE" style={{ textTransform: 'uppercase' }} />
      </Form.Item>

      <Form.Item
        name="zone_type"
        label="Loại zone"
        rules={[{ required: true, message: 'Vui lòng chọn loại zone' }]}
      >
        <Select placeholder="Chọn loại zone" options={ZONE_TYPES} />
      </Form.Item>

      <Form.Item
        name="environment"
        label="Môi trường"
        rules={[{ required: true, message: 'Vui lòng chọn môi trường' }]}
      >
        <Select placeholder="Chọn môi trường" options={ENV_OPTIONS} />
      </Form.Item>

      <Form.Item name="description" label="Mô tả">
        <Input.TextArea rows={3} placeholder="Mô tả ngắn về zone này" />
      </Form.Item>

      <Form.Item
        name="color"
        label="Màu sắc (hex)"
        extra="Ví dụ: #1890FF — để trống sẽ dùng màu mặc định theo loại zone"
      >
        <Input placeholder="#1890FF" maxLength={7} />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space>
          <Button type="primary" htmlType="submit" loading={isPending}>
            {submitLabel}
          </Button>
          <Button onClick={onCancel}>Huỷ</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
