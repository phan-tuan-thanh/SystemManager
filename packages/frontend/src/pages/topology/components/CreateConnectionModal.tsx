import React, { useEffect } from 'react';
import { Modal, Form, Select, Input, message } from 'antd';

export interface CreateConnectionModalProps {
  open: boolean;
  sourceApp: any;
  targetApp: any;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

export function CreateConnectionModal({ open, sourceApp, targetApp, onCancel, onSubmit }: CreateConnectionModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (targetApp?.ports?.length === 1) {
        form.setFieldsValue({ target_port_id: targetApp.ports[0].id });
      }
    }
  }, [open, targetApp, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch {
      // Validate Error
    }
  };

  if (!sourceApp || !targetApp) return null;

  const portOptions = targetApp.ports?.map((p: any) => ({
    label: `${p.port_number}/${p.protocol} ${p.service_name ? `(${p.service_name})` : ''}`,
    value: p.id,
  })) || [];

  return (
    <Modal
      title={`Tạo kết nối: ${sourceApp.name} → ${targetApp.name}`}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ connection_type: 'HTTPS' }}>
        <Form.Item
          name="target_port_id"
          label={`Port của đích (${targetApp.name})`}
          rules={[{ required: true, message: 'Vui lòng chọn port' }]}
        >
          <Select
            options={portOptions}
            placeholder="Chọn port..."
            notFoundContent="Ứng dụng này chưa mở port nào"
          />
        </Form.Item>
        <Form.Item
          name="connection_type"
          label="Giao thức"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: 'HTTP', value: 'HTTP' },
              { label: 'HTTPS', value: 'HTTPS' },
              { label: 'TCP', value: 'TCP' },
              { label: 'GRPC', value: 'GRPC' },
              { label: 'AMQP', value: 'AMQP' },
              { label: 'KAFKA', value: 'KAFKA' },
              { label: 'DATABASE', value: 'DATABASE' },
            ]}
          />
        </Form.Item>
        <Form.Item name="description" label="Mô tả (tuỳ chọn)">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
