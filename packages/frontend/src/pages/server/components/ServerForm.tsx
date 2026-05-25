import { Form, Input, Select, Modal, Space, Button, App, Row, Col } from 'antd';
import { useCreateServer, useUpdateServer } from '../../../hooks/useServers';
import { useInfraSystemList } from '../../../hooks/useInfraSystems';
import { useActiveEnvironments } from '../../../hooks/useEnvironments';
import EnvironmentSelect from '../../../components/common/EnvironmentSelect';
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
  const { data: envConfigs = [] } = useActiveEnvironments();
  const isEdit = !!initial;
  const environment = Form.useWatch('environment', form);
  const envType = envConfigs.find((e) => e.code === environment)?.type;

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      const payload = { ...values };

      if (isEdit && initial) {
        // Remove immutable fields that the update DTO does not accept
        delete payload.code;
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
            <Form.Item name="environment" label="Môi trường" rules={[{ required: true }]}>
              <EnvironmentSelect onChange={() => form.setFieldValue('site', undefined)} />
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
            {envType === 'PROD' || envType === 'LIVE' ? (
              <Form.Item
                name="site"
                label="Site"
                rules={[{ required: true, message: 'Vui lòng chọn Site cho PROD/LIVE' }]}
                tooltip="PROD/LIVE phải chỉ định DC hoặc DR"
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
              <Select showSearch optionFilterProp="label" options={[
                { value: 'APP_SERVER', label: 'App Server' },
                { value: 'DB_SERVER', label: 'DB Server' },
                { value: 'PROXY', label: 'Proxy' },
                { value: 'LOAD_BALANCER', label: 'Load Balancer' },
                { value: 'CACHE', label: 'Cache' },
                { value: 'MESSAGE_QUEUE', label: 'Message Queue' },
                { value: 'OTHER', label: 'Khác' },
              ]} />
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
            showSearch
            optionFilterProp="label"
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
