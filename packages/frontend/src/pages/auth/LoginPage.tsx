import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, App, Alert, Divider } from 'antd';
import { LockOutlined, MailOutlined, WindowsOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../api/client';
import type { LoginResponse, ApiResponse } from '../../types/auth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { message } = App.useApp();

  useEffect(() => {
    apiClient.get<ApiResponse<{ hasAdmin: boolean; initialized: boolean }>>('/system/status').then((res) => {
      setIsFirstSetup(!res.data.data.hasAdmin);
    }).catch(() => {/* ignore — assume normal login */});

    const ssoError = searchParams.get('sso_error');
    if (ssoError) {
      message.error(`Microsoft 365 login failed: ${ssoError.replace(/_/g, ' ')}`);
    }

    if (localStorage.getItem('session_expired')) {
      localStorage.removeItem('session_expired');
      message.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 6);
    }
  }, []);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', values);
      const loginData = data.data;
      setAuth(loginData.user, loginData.access_token, loginData.refresh_token);

      if (isFirstSetup) {
        message.success(`Admin account created! Welcome, ${loginData.user.full_name}.`);
      } else {
        message.success(`Welcome back, ${loginData.user.full_name}!`);
      }

      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: { message?: string } } } };
      const msg =
        axiosErr?.response?.data?.error?.message ||
        axiosErr?.response?.data?.message ||
        'Invalid email or password';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            SystemManager
          </Title>
          <Text type="secondary">Infrastructure & Deployment Management</Text>
        </div>

        {isFirstSetup && (
          <Alert
            type="info"
            showIcon
            message="First time setup"
            description="No admin account exists. Enter your email and password to create the administrator account."
            style={{ marginBottom: 24 }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Invalid email format' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              {isFirstSetup ? 'Create Admin Account' : 'Log in'}
            </Button>
          </Form.Item>
        </Form>

        {!isFirstSetup && (
          <>
            <Divider plain style={{ fontSize: 12, color: '#8c8c8c' }}>or</Divider>
            <Button
              block
              size="large"
              icon={<WindowsOutlined />}
              href="/api/v1/auth/ms365"
              style={{ borderColor: '#0078d4', color: '#0078d4' }}
            >
              Sign in with Microsoft 365
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
