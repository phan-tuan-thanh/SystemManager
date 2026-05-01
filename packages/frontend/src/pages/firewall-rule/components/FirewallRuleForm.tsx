import { useEffect } from 'react';
import {
  Form, Input, Select, Radio, Button, Space, DatePicker,
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

  // Reset form when initialValues change (e.g. switching between edit targets)
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        request_date: undefined, // handled separately below
      });
      if (initialValues.request_date) {
        form.setFieldValue('request_date', initialValues.request_date);
      }
    } else {
      form.resetFields();
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
    const payload: FirewallRuleFormValues = {
      ...values,
      request_date: values.request_date
        ? (dayjs.isDayjs(values.request_date as unknown)
          ? (values.request_date as unknown as ReturnType<typeof dayjs>).format('YYYY-MM-DD')
          : values.request_date)
        : undefined,
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
