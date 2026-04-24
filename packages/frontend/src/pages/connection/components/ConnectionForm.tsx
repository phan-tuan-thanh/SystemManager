import { useEffect } from 'react';
import { Modal, Form, Select, Input } from 'antd';
import type { AppConnection } from '../../../types/connection';

interface Props {
  open: boolean;
  editing?: AppConnection | null;
  applications: { id: string; name: string; code: string }[];
  onSubmit: (values: Partial<AppConnection>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const ENVIRONMENTS = ['DEV', 'UAT', 'PROD'];
const CONNECTION_TYPES = ['HTTP', 'HTTPS', 'TCP', 'GRPC', 'AMQP', 'KAFKA', 'DATABASE'];

export default function ConnectionForm({ open, editing, applications, onSubmit, onCancel, loading }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          source_app_id: editing.source_app_id,
          target_app_id: editing.target_app_id,
          environment: editing.environment,
          connection_type: editing.connection_type,
          description: editing.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  const appOptions = applications.map((a) => ({
    label: `${a.name} (${a.code})`,
    value: a.id,
  }));

  return (
    <Modal
      title={editing ? 'Cập nhật kết nối' : 'Tạo kết nối mới'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={editing ? 'Lưu' : 'Tạo'}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="source_app_id"
          label="Ứng dụng nguồn (Source)"
          rules={[{ required: true, message: 'Vui lòng chọn ứng dụng nguồn' }]}
        >
          <Select
            showSearch
            placeholder="Chọn ứng dụng nguồn"
            options={appOptions}
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="target_app_id"
          label="Ứng dụng đích (Target)"
          rules={[{ required: true, message: 'Vui lòng chọn ứng dụng đích' }]}
        >
          <Select
            showSearch
            placeholder="Chọn ứng dụng đích"
            options={appOptions}
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="environment"
          label="Môi trường"
          rules={[{ required: true, message: 'Vui lòng chọn môi trường' }]}
        >
          <Select options={ENVIRONMENTS.map((e) => ({ label: e, value: e }))} />
        </Form.Item>

        <Form.Item
          name="connection_type"
          label="Loại kết nối"
          rules={[{ required: true, message: 'Vui lòng chọn loại kết nối' }]}
        >
          <Select options={CONNECTION_TYPES.map((t) => ({ label: t, value: t }))} />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mô tả kết nối (tuỳ chọn)" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
