import { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Descriptions, Tag, App, Avatar, Space } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

function ChangePasswordForm() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { logout } = useAuthStore();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: { current_password: string; new_password: string }) => {
      await apiClient.post('/auth/change-password', values);
    },
  });

  const onFinish = async (values: { current_password: string; new_password: string }) => {
    try {
      await mutateAsync(values);
      message.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      form.resetFields();
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 1500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Không thể đổi mật khẩu');
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 480 }}>
      <Form.Item name="current_password" label="Mật khẩu hiện tại" rules={[{ required: true }]}>
        <Input.Password prefix={<LockOutlined />} />
      </Form.Item>
      <Form.Item name="new_password" label="Mật khẩu mới" rules={[{ required: true, min: 8 }]}>
        <Input.Password prefix={<LockOutlined />} />
      </Form.Item>
      <Form.Item
        name="confirm"
        label="Xác nhận mật khẩu mới"
        dependencies={['new_password']}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('new_password') === value) return Promise.resolve();
              return Promise.reject(new Error('Mật khẩu không khớp'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} />
      </Form.Item>
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isPending} danger>
        Đổi mật khẩu
      </Button>
    </Form>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'password' ? 'password' : 'info';

  const tabs = [
    {
      key: 'info',
      label: 'Thông tin cá nhân',
      children: (
        <Card style={{ maxWidth: 600 }}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                src={user?.avatar_url ?? undefined}
                style={{ marginBottom: 12 }}
              />
            </div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Họ và tên">{user?.full_name}</Descriptions.Item>
              <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
              <Descriptions.Item label="Roles">
                {(user?.roles ?? []).map((r) => (
                  <Tag key={r} color={r === 'ADMIN' ? 'red' : r === 'OPERATOR' ? 'blue' : 'default'}>{r}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      ),
    },
    {
      key: 'password',
      label: 'Đổi mật khẩu',
      children: (
        <Card style={{ maxWidth: 600 }}>
          <ChangePasswordForm />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Thông tin cá nhân"
        breadcrumbs={[{ label: 'Trang chủ', path: '/dashboard' }, { label: 'Thông tin cá nhân' }]}
      />
      <Tabs defaultActiveKey={defaultTab} items={tabs} />
    </div>
  );
}
