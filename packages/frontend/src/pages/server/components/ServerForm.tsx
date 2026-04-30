import { Form, Input, Select, Modal, Space, Button, App, Row, Col } from 'antd';
import { useCreateServer, useUpdateServer } from '../../../hooks/useServers';
import { useInfraSystemList } from '../../../hooks/useInfraSystems';
import type { Server } from '../../../types/server';

const { Option } = Select;

interface ServerFormProps {
  open: boolean;
  onClose: () => void;
  initial?: Server | null;
}

export default function ServerForm({ open, onClose, initial }: ServerFormProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const create = useCreateServer();
  const update = useUpdateServer();
  const { data: infraSystems } = useInfraSystemList({ limit: 100 });
  const isEdit = !!initial;
  const environment = Form.useWatch('environment', form);

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      const payload = { ...values };

      if (isEdit && initial) {
        // Remove immutable fields that the update DTO does not accept
        delete payload.code;
        delete payload.environment;
        delete payload.hostname;
        await update.mutateAsync({ id: initial.id, ...payload } as Partial<Server> & { id: string });
        message.success('Cập nhật server thành công');
      } else {
        await create.mutateAsync(payload as Omit<Server, 'id' | 'created_at' | 'updated_at'>);
        message.success('Tạo server thành công');
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
      title={isEdit ? 'Cập nhật Server' : 'Tạo Server mới'}
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      footer={null}
      destroyOnHidden
      width={640}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initial ?? { status: 'ACTIVE', purpose: 'APP_SERVER', infra_type: 'VIRTUAL_MACHINE' }}
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="code" label="Mã server" rules={[{ required: !isEdit, message: 'Vui lòng nhập mã server' }]}>
              <Input disabled={isEdit} placeholder="SRV-PROD-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="name" label="Tên server" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="hostname" label="Hostname" rules={[{ required: !isEdit }]}>
              <Input placeholder="app-server-01.internal" disabled={isEdit} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="environment" label="Môi trường" rules={[{ required: !isEdit }]}>
              <Select disabled={isEdit}>
                <Option value="DEV">🔧 DEV</Option>
                <Option value="UAT">🧪 UAT</Option>
                <Option value="PROD">🚀 PROD</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="status" label="Trạng thái">
              <Select>
                <Option value="ACTIVE">Hoạt động</Option>
                <Option value="INACTIVE">Không hoạt động</Option>
                <Option value="MAINTENANCE">Bảo trì</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            {environment === 'PROD' ? (
              <Form.Item
                name="site"
                label="Site"
                rules={[{ required: true, message: 'Vui lòng chọn Site cho PROD' }]}
                tooltip="PROD phải chỉ định DC hoặc DR"
              >
                <Select placeholder="DC hoặc DR">
                  <Option value="DC">🏢 DC (Data Center)</Option>
                  <Option value="DR">🔄 DR (Disaster Recovery)</Option>
                </Select>
              </Form.Item>
            ) : (
              <Form.Item
                name="site"
                label="Site"
                rules={[{ required: true, message: 'Vui lòng chọn Site' }]}
                initialValue="TEST"
                tooltip="DEV/UAT dùng TEST site"
              >
                <Select>
                  <Option value="TEST">🧪 TEST</Option>
                </Select>
              </Form.Item>
            )}
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="purpose" label="Mục đích">
              <Select>
                <Option value="APP_SERVER">App Server</Option>
                <Option value="DB_SERVER">DB Server</Option>
                <Option value="PROXY">Proxy</Option>
                <Option value="LOAD_BALANCER">Load Balancer</Option>
                <Option value="CACHE">Cache</Option>
                <Option value="MESSAGE_QUEUE">Message Queue</Option>
                <Option value="OTHER">Khác</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="infra_type" label="Loại hạ tầng">
              <Select>
                <Option value="VIRTUAL_MACHINE">Virtual Machine</Option>
                <Option value="PHYSICAL_SERVER">Physical Server</Option>
                <Option value="CONTAINER">Container</Option>
                <Option value="CLOUD_INSTANCE">Cloud Instance</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="infra_system_id" label="Hệ thống" tooltip="Gán server vào hệ thống để quản lý tập trung">
          <Select
            placeholder="Chọn hệ thống (tùy chọn)"
            allowClear
            options={
              infraSystems?.items?.map((sys) => ({
                label: `${sys.name} (${sys.code})`,
                value: sys.id,
              })) ?? []
            }
          />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={create.isPending || update.isPending}>
              {isEdit ? 'Cập nhật' : 'Tạo'}
            </Button>
            <Button onClick={() => { form.resetFields(); onClose(); }}>Huỷ</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
