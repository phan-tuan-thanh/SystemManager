import { useState, useCallback } from 'react';
import {
  Layout,
  Button,
  Dropdown,
  Space,
  Avatar,
  Typography,
  Badge,
  AutoComplete,
  Tooltip,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  KeyOutlined,
  SearchOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import apiClient from '../../api/client';
import type { ApiResponse } from '../../types/auth';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface SearchResult {
  servers: { id: string; label: string; path: string }[];
  applications: { id: string; label: string; path: string }[];
  networks: { id: string; label: string; path: string }[];
}

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Header({ collapsed, onToggle }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: searchResults, isFetching: isSearching } = useQuery<SearchResult>({
    queryKey: ['global-search', searchQuery],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<SearchResult>>(`/system/search?q=${encodeURIComponent(searchQuery)}`);
      return data.data;
    },
    enabled: searchQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const buildOptions = useCallback(() => {
    if (!searchResults) return [];
    const groups = [];

    if (searchResults.servers.length) {
      groups.push({
        label: 'Servers',
        options: searchResults.servers.map((s) => ({ value: s.path, label: s.label, key: `s-${s.id}` })),
      });
    }
    if (searchResults.applications.length) {
      groups.push({
        label: 'Applications',
        options: searchResults.applications.map((a) => ({ value: a.path, label: a.label, key: `a-${a.id}` })),
      });
    }
    if (searchResults.networks.length) {
      groups.push({
        label: 'Network Configs',
        options: searchResults.networks.map((n) => ({ value: n.path, label: n.label, key: `n-${n.id}` })),
      });
    }
    return groups;
  }, [searchResults]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => navigate('/profile?tab=password'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  const headerBg = isDark ? '#141414' : '#fff';
  const borderColor = isDark ? '#303030' : '#f0f0f0';

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: headerBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        style={{ fontSize: 16 }}
      />

      {/* Global Search Omnibar */}
      <AutoComplete
        style={{ width: 320 }}
        options={buildOptions()}
        value={searchQuery}
        onChange={setSearchQuery}
        onSelect={(path: string) => {
          navigate(path);
          setSearchQuery('');
        }}
        onOpenChange={setSearchOpen}
        notFoundContent={searchQuery.length >= 2 && !isSearching ? 'No results found' : null}
      >
        <div style={{ position: 'relative' }}>
          <SearchOutlined
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8c8c8c',
              zIndex: 1,
            }}
          />
          <input
            style={{
              width: '100%',
              height: 32,
              paddingLeft: 32,
              paddingRight: 12,
              border: `1px solid ${borderColor}`,
              borderRadius: 6,
              background: isDark ? '#1f1f1f' : '#f5f5f5',
              color: 'inherit',
              outline: 'none',
              fontSize: 14,
            }}
            placeholder="Search servers, apps, IPs... (min 2 chars)"
          />
        </div>
      </AutoComplete>

      <Space size={8}>
        {/* Dark Mode Toggle */}
        <Tooltip title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}>
          <Button
            type="text"
            icon={isDark ? <BulbFilled style={{ fontSize: 18, color: '#faad14' }} /> : <BulbOutlined style={{ fontSize: 18 }} />}
            onClick={toggleTheme}
          />
        </Tooltip>

        <Badge count={0} showZero={false}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 18 }} />}
            title="Thông báo"
          />
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} src={user?.avatar_url ?? undefined} />
            <Text>{user?.full_name}</Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
