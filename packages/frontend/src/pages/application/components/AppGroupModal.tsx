import { useEffect } from 'react';
import { Modal, Form, Input, Select, Tooltip, App, Row, Col } from 'antd';
import { useCreateAppGroup, useUpdateAppGroup } from '../../../hooks/useAppGroups';
import type { ApplicationGroup } from '../../../types/application';

interface Props {
  open: boolean;
  group: ApplicationGroup | null;
  onClose: () => void;
}

export default function AppGroupModal({ open, group, onClose }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const create = useCreateAppGroup();
  const update = useUpdateAppGroup();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(group ?? { code: '', name: '', description: '', group_type: 'BUSINESS' });
    }
  }, [open, group, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (group) {
        await update.mutateAsync({ id: group.id, ...values });
        message.success('Đã cập nhật nhóm ứng dụng');
      } else {
        await create.mutateAsync(values);
        message.success('Đã tạo nhóm ứng dụng');
      }
      form.resetFields();
      onClose();
    } catch {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  return (
    <Modal
      title={group ? 'Sửa nhóm ứng dụng' : 'Tạo nhóm ứng dụng mới'}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onClose(); }}
      confirmLoading={create.isPending || update.isPending}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Mã nhóm"
              name="code"
              rules={[{ required: true, message: 'Nhập mã nhóm' }, { max: 50 }]}
            >
              <Input placeholder="VD: BANKING" disabled={!!group} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Tooltip title={group ? 'Loại nhóm không thể thay đổi sau khi tạo' : undefined}>
              <Form.Item
                label="Loại nhóm"
                name="group_type"
                rules={[{ required: true, message: 'Vui lòng chọn loại nhóm' }]}
              >
                <Select
                  disabled={!!group}
                  options={[
                    { value: 'BUSINESS', label: 'Nghiệp vụ' },
                    { value: 'INFRASTRUCTURE', label: 'Hạ tầng' },
                  ]}
                />
              </Form.Item>
            </Tooltip>
          </Col>
        </Row>

        <Form.Item
          label="Tên nhóm"
          name="name"
          rules={[{ required: true, message: 'Nhập tên nhóm' }, { max: 255 }]}
        >
          <Input placeholder="VD: Core Banking" />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={3} placeholder="Mô tả nhóm ứng dụng" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
