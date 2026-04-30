import { useEffect } from 'react';
import { Drawer, Form, Input, Select, DatePicker, App, Button, Space, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { useCreateApplication, useUpdateApplication } from '../../../hooks/useApplications';
import { useAppGroupList } from '../../../hooks/useAppGroups';
import type { Application, GroupType } from '../../../types/application';

interface Props {
  open: boolean;
  app: Application | null;
  onClose: () => void;
  initialType?: 'BUSINESS' | 'SYSTEM';
}

export default function ApplicationForm({ open, app, onClose, initialType }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const create = useCreateApplication();
  const update = useUpdateApplication();

  const appType: 'BUSINESS' | 'SYSTEM' = Form.useWatch('application_type', form) ?? initialType ?? 'BUSINESS';
  const groupType: GroupType = appType === 'SYSTEM' ? 'INFRASTRUCTURE' : 'BUSINESS';

  const { data: groups } = useAppGroupList({ limit: 100, group_type: groupType });

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        app
          ? {
              ...app,
              eol_date: app.eol_date ? dayjs(app.eol_date) : undefined,
            }
          : {
              code: '',
              name: '',
              group_id: '',
              status: 'ACTIVE',
              application_type: initialType ?? 'BUSINESS',
              tech_stack: '',
              repo_url: '',
              description: '',
              version: '',
              owner_team: '',
            },
      );
    }
  }, [open, app, form, initialType]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      eol_date: values.eol_date ? (values.eol_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
    };
    try {
      if (app) {
        await update.mutateAsync({ id: app.id, ...payload });
        message.success('Đã cập nhật ứng dụng');
      } else {
        await create.mutateAsync(payload);
        message.success('Đã tạo ứng dụng');
      }
      form.resetFields();
      onClose();
    } catch {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const isSystem = appType === 'SYSTEM';

  return (
    <Drawer
      title={app ? 'Sửa ứng dụng' : 'Tạo ứng dụng mới'}
      open={open}
      onClose={() => { form.resetFields(); onClose(); }}
      width={560}
      extra={
        <Space>
          <Button onClick={() => { form.resetFields(); onClose(); }}>Huỷ</Button>
          <Button type="primary" loading={create.isPending || update.isPending} onClick={handleOk}>
            {app ? 'Lưu' : 'Tạo'}
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={(changed) => {
          if ('application_type' in changed) {
            form.setFieldsValue({ group_id: undefined, sw_type: undefined });
          }
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Loại ứng dụng"
              name="application_type"
              rules={[{ required: true, message: 'Chọn loại ứng dụng' }]}
            >
              <Select
                disabled={!!app}
                options={[
                  { value: 'BUSINESS', label: 'Nghiệp vụ' },
                  { value: 'SYSTEM', label: 'Hạ tầng (System)' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Nhóm ứng dụng" name="group_id" rules={[{ required: true, message: 'Chọn nhóm' }]}>
              <Select
                placeholder={`Nhóm ${isSystem ? 'hạ tầng' : 'nghiệp vụ'}`}
                options={(groups?.items ?? []).map((g) => ({ value: g.id, label: `${g.code} — ${g.name}` }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Mã ứng dụng" name="code" rules={[{ required: true }, { max: 50 }]}>
              <Input placeholder={isSystem ? 'SW_POSTGRESQL_15' : 'CORE_BANKING'} disabled={!!app} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Tên ứng dụng" name="name" rules={[{ required: true }, { max: 255 }]}>
              <Input placeholder={isSystem ? 'PostgreSQL 15' : 'Core Banking System'} />
            </Form.Item>
          </Col>
        </Row>

        {isSystem && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Loại phần mềm" name="sw_type">
                <Select
                  placeholder="Chọn loại"
                  options={[
                    { value: 'OS', label: 'OS' },
                    { value: 'DATABASE', label: 'Database' },
                    { value: 'MIDDLEWARE', label: 'Middleware' },
                    { value: 'RUNTIME', label: 'Runtime' },
                    { value: 'WEB_SERVER', label: 'Web Server' },
                    { value: 'OTHER', label: 'Khác' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Nhà cung cấp (Vendor)" name="vendor">
                <Input placeholder="Oracle, Microsoft..." />
              </Form.Item>
            </Col>
          </Row>
        )}

        {isSystem && (
          <Form.Item label="Ngày End-of-Life (EOL)" name="eol_date">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
        )}

        {!isSystem && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'DEPRECATED', label: 'Deprecated' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phiên bản" name="version">
                <Input placeholder="2.1.0" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {isSystem && (
          <Form.Item label="Phiên bản" name="version">
            <Input placeholder="VD: 2.1.0" />
          </Form.Item>
        )}

        {!isSystem && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Team phụ trách" name="owner_team">
                <Input placeholder="Platform Team" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tech Stack" name="tech_stack">
                <Input placeholder="Java 17, Spring Boot..." />
              </Form.Item>
            </Col>
          </Row>
        )}

        {!isSystem && (
          <Form.Item label="Repo URL" name="repo_url">
            <Input placeholder="https://git.internal/core-banking" />
          </Form.Item>
        )}

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
