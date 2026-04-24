import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Typography, App } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../api/client';
import type { ApiResponse } from '../../types/auth';

const { Title, Text } = Typography;

interface MeResponse {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  roles: string[];
}

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { message } = App.useApp();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const ssoError = searchParams.get('sso_error');

    if (ssoError) {
      message.error(`SSO login failed: ${ssoError.replace(/_/g, ' ')}`);
      navigate('/login');
      return;
    }

    if (!accessToken || !refreshToken) {
      message.error('Invalid SSO callback — missing tokens.');
      navigate('/login');
      return;
    }

    // Fetch user profile using the new token
    apiClient
      .get<ApiResponse<MeResponse>>('/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(({ data }) => {
        const user = data.data;
        setAuth(
          { id: user.id, email: user.email, full_name: user.full_name, avatar_url: user.avatar_url, roles: user.roles },
          accessToken,
          refreshToken,
        );
        message.success(`Welcome, ${user.full_name}!`);
        navigate('/dashboard');
      })
      .catch(() => {
        message.error('SSO authentication failed. Please try again.');
        navigate('/login');
      });
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#f0f2f5',
      }}
    >
      <Spin size="large" />
      <Title level={4} style={{ margin: 0 }}>Completing Microsoft 365 sign-in...</Title>
      <Text type="secondary">Please wait while we verify your identity.</Text>
    </div>
  );
}
