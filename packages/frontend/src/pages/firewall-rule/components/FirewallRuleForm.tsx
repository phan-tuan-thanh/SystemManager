import { useEffect, useState } from 'react';
import {
  Form, Input, Select, Radio, Button, Space, DatePicker, Alert,
} from 'antd';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/client';
import type { ApiResponse } from '../../../types/auth';
import type { FirewallRule, FirewallAction, FirewallRuleStatus } from '../../../types/firewall-rule';
import type { FirewallEnvironment, NetworkZone } from '../../../types/network-zone';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ServerOption {
  id: string;
  code: string;
  name: string;
  environment: FirewallEnvironment;
}

interface PortOption {
  id: string;
  port_number: number;
  protocol: string;
  service_name?: string;
}

type ExpiryMode = 'never' | 'months' | 'custom';

export interface FirewallRuleFormValues {
  name: string;
  description?: string;
  environment: FirewallEnvironment;
  source_zone_id?: string;
  source_ip?: string;
  destination_zone_id?: string;
  destination_server_id: string;
  destination_port_id?: string;
  protocol: string;
  action: FirewallAction;
  status: FirewallRuleStatus;
  request_date?: string;
  approved_by?: string;
  notes?: string;
  expires_at?: string | null;
  never_expires?: boolean;
  // Internal form-only fields
  _expiry_months?: number;
  _expiry_date?: string;
}

interface FirewallRuleFormProps {
  initialValues?: Partial<FirewallRule>;
  onFinish: (values: FirewallRuleFormValues) => void | Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
  submitLabel?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ENV_OPTIONS: { value: FirewallEnvironment; label: string }[] = [
  { value: 'DEV', label: 'DEV' },
  { value: 'UAT', label: 'UAT' },
  { value: 'PROD', label: 'PROD' },
];

const PROTOCOL_OPTIONS = [
  { value: 'TCP', label: 'TCP' },
  { value: 'UDP', label: 'UDP' },
  { value: 'ICMP', label: 'ICMP' },
  { value: 'ANY', label: 'Any' },
];

const STATUS_OPTIONS: { value: FirewallRuleStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'REJECTED', label: 'Rejected' },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} tháng`,
}));

// ─── Component ─────────────────────────────────────────────────────────────────

export default function FirewallRuleForm({
  initialValues,
  onFinish,
  onCancel,
  isPending = false,
  submitLabel = 'Lưu',
}: FirewallRuleFormProps) {
  const [form] = Form.useForm<FirewallRuleFormValues>();
  const envValue = Form.useWatch('environment', form);
  const destServerId = Form.useWatch('destination_server_id', form);
  const [expiryMode, setExpiryMode] = useState<ExpiryMode>('never');

  // Reset form when initialValues change (e.g. switching between edit targets)
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        request_date: undefined,
      });
      if (initialValues.request_date) {
        form.setFieldValue('request_date', initialValues.request_date);
      }
      // Restore expiry mode from saved data
      if (initialValues.never_expires || !initialValues.expires_at) {
        setExpiryMode('never');
      } else if (initialValues.expires_at) {
        setExpiryMode('custom');
        form.setFieldValue('_expiry_date', dayjs(initialValues.expires_at));
      }
    } else {
      form.resetFields();
      setExpiryMode('never');
    }
  }, [initialValues, form]);

  // ─── Network Zones ──────────────────────────────────────────────────────────

  const { data: zonesData, isLoading: zonesLoading } = useQuery<NetworkZone[]>({
    queryKey: ['network-zones-all'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<NetworkZone[]>>('/network-zones', {
        params: { limit: 500 },
      });
      return data.data;
    },
  });

  // ─── Servers ────────────────────────────────────────────────────────────────

  const { data: serversData, isLoading: serversLoading } = useQuery<ServerOption[]>({
    queryKey: ['servers-dropdown', envValue],
    queryFn: async () => {
      const params: Record<string, unknown> = { limit: 500 };
      if (envValue) params.environment = envValue;
      const { data } = await apiClient.get<ApiResponse<ServerOption[]>>('/servers', { params });
      return data.data;
    },
    enabled: true,
  });

  // ─── Ports for selected server ──────────────────────────────────────────────

  const { data: portsData, isLoading: portsLoading } = useQuery<PortOption[]>({
    queryKey: ['ports-dropdown', destServerId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PortOption[]>>('/ports', {
        params: { limit: 500 },
      });
      return data.data;
    },
    enabled: !!destServerId,
  });

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleFinish = async (values: FirewallRuleFormValues) => {
    // DatePicker returns dayjs object — convert to ISO string if present
    let expiresAt: string | null = null;
    let neverExpires = true;

    if (expiryMode === 'months' && values._expiry_months) {
      expiresAt = dayjs().add(values._expiry_months, 'month').format('YYYY-MM-DD');
      neverExpires = false;
    } else if (expiryMode === 'custom' && values._expiry_date) {
      const d = values._expiry_date as unknown;
      expiresAt = dayjs.isDayjs(d) ? (d as ReturnType<typeof dayjs>).format('YYYY-MM-DD') : String(d);
      neverExpires = false;
    }

    const payload: FirewallRuleFormValues = {
      ...values,
      request_date: values.request_date
        ? (dayjs.isDayjs(values.request_date as unknown)
          ? (values.request_date as unknown as ReturnType<typeof dayjs>).format('YYYY-MM-DD')
          : values.request_date)
        : undefined,
      expires_at: expiresAt,
      never_expires: neverExpires,
      _expiry_months: undefined,
      _expiry_date: undefined,
    };
    await onFinish(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      style={{ marginTop: 8 }}
    >
      {/* Name */}
      <Form.Item
        name="name"
        label="Tên rule"
        rules={[{ required: true, message: 'Vui lòng nhập tên rule' }]}
      >
        <Input placeholder="Ví dụ: Allow PROD DB access" />
      </Form.Item>

      {/* Environment */}
      <Form.Item
        name="environment"
        label="Môi trường"
        rules={[{ required: true, message: 'Vui lòng chọn môi trường' }]}
      >
        <Select
          placeholder="Chọn môi trường"
          options={ENV_OPTIONS}
          onChange={() => {
            form.setFieldValue('destination_server_id', undefined);
            form.setFieldValue('destination_port_id', undefined);
          }}
        />
      </Form.Item>

      {/* Source Zone */}
      <Form.Item name="source_zone_id" label="Zone nguồn">
        <Select
          placeholder="Chọn zone nguồn"
          loading={zonesLoading}
          allowClear
          showSearch
          optionFilterProp="label"
          options={(zonesData ?? []).map((z) => ({
            value: z.id,
            label: z.name,
          }))}
        />
      </Form.Item>

      {/* Source IP */}
      <Form.Item name="source_ip" label="IP nguồn">
        <Input placeholder="Ví dụ: 10.0.0.0/24" />
      </Form.Item>

      {/* Destination Zone */}
      <Form.Item name="destination_zone_id" label="Zone đích">
        <Select
          placeholder="Chọn zone đích"
          loading={zonesLoading}
          allowClear
          showSearch
          optionFilterProp="label"
          options={(zonesData ?? []).map((z) => ({
            value: z.id,
            label: z.name,
          }))}
        />
      </Form.Item>

      {/* Destination Server */}
      <Form.Item
        name="destination_server_id"
        label="Server đích"
        rules={[{ required: true, message: 'Vui lòng chọn server đích' }]}
      >
        <Select
          placeholder="Chọn server đích"
          loading={serversLoading}
          allowClear
          showSearch
          optionFilterProp="label"
          onChange={() => form.setFieldValue('destination_port_id', undefined)}
          options={(serversData ?? []).map((s) => ({
            value: s.id,
            label: `[${s.code}] ${s.name}`,
          }))}
        />
      </Form.Item>

      {/* Destination Port */}
      <Form.Item name="destination_port_id" label="Port đích">
        <Select
          placeholder="Chọn port đích"
          loading={portsLoading}
          allowClear
          showSearch
          optionFilterProp="label"
          disabled={!destServerId}
          options={(portsData ?? []).map((p) => ({
            value: p.id,
            label: `${p.port_number}/${p.protocol}${p.service_name ? ` (${p.service_name})` : ''}`,
          }))}
        />
      </Form.Item>

      {/* Protocol */}
      <Form.Item
        name="protocol"
        label="Protocol"
        rules={[{ required: true, message: 'Vui lòng chọn protocol' }]}
      >
        <Select placeholder="Chọn protocol" options={PROTOCOL_OPTIONS} />
      </Form.Item>

      {/* Action */}
      <Form.Item
        name="action"
        label="Hành động"
        rules={[{ required: true, message: 'Vui lòng chọn hành động' }]}
      >
        <Radio.Group>
          <Radio.Button value="ALLOW">ALLOW</Radio.Button>
          <Radio.Button value="DENY">DENY</Radio.Button>
        </Radio.Group>
      </Form.Item>

      {/* Status */}
      <Form.Item
        name="status"
        label="Trạng thái"
        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
      >
        <Select placeholder="Chọn trạng thái" options={STATUS_OPTIONS} />
      </Form.Item>

      {/* Request Date */}
      <Form.Item name="request_date" label="Ngày yêu cầu">
        <DatePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          placeholder="Chọn ngày"
        />
      </Form.Item>

      {/* Approved By */}
      <Form.Item name="approved_by" label="Người duyệt">
        <Input placeholder="Email hoặc tên người duyệt" />
      </Form.Item>

      {/* Description */}
      <Form.Item name="description" label="Mô tả">
        <Input.TextArea rows={2} placeholder="Mô tả ngắn về rule" />
      </Form.Item>

      {/* Expiry — 3-mode picker */}
      <Form.Item label="Thời hạn hiệu lực" style={{ marginBottom: 8 }}>
        <Radio.Group
          value={expiryMode}
          onChange={(e) => {
            setExpiryMode(e.target.value);
            form.setFieldValue('_expiry_months', undefined);
            form.setFieldValue('_expiry_date', undefined);
          }}
        >
          <Radio value="never">Vô thời hạn</Radio>
          <Radio value="months">Số tháng</Radio>
          <Radio value="custom">Ngày cụ thể</Radio>
        </Radio.Group>
      </Form.Item>

      {expiryMode === 'months' && (
        <Form.Item
          name="_expiry_months"
          label="Số tháng hiệu lực"
          rules={[{ required: true, message: 'Vui lòng chọn số tháng' }]}
          style={{ marginBottom: 8 }}
        >
          <Select placeholder="Chọn số tháng" options={MONTH_OPTIONS} style={{ width: 180 }} />
        </Form.Item>
      )}

      {expiryMode === 'custom' && (
        <Form.Item
          name="_expiry_date"
          label="Ngày hết hạn"
          rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
          style={{ marginBottom: 8 }}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            placeholder="Chọn ngày hết hạn"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>
      )}

      {expiryMode !== 'never' && (
        <Alert
          type="info"
          showIcon
          message="Rule sẽ tự động hiển thị cảnh báo khi sắp hết hạn (≤ 30 ngày)."
          style={{ marginBottom: 16, fontSize: 12 }}
        />
      )}

      {/* Notes */}
      <Form.Item name="notes" label="Ghi chú">
        <Input.TextArea rows={2} placeholder="Ghi chú thêm" />
      </Form.Item>

      {/* Submit */}
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
