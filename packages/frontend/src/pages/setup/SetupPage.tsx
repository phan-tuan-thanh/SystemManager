import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Steps,
  List,
  Tag,
  Space,
  Row,
  Col,
  App,
  Divider,
  Badge,
  Switch,
  Alert,
  Statistic,
  Collapse,
} from 'antd';
import {
  RocketOutlined,
  AppstoreOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  ApartmentOutlined,
  ApiOutlined,
  FileTextOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

const { Title, Text, Paragraph } = Typography;

const MODULES_CORE = [
  'Quản lý Server',
  'Quản lý Linh kiện',
  'Quản lý Mạng',
  'Nhóm ứng dụng',
  'Phần mềm & Ứng dụng',
  'Quản lý Port',
  'Audit Log',
];
const MODULES_EXTENDED = [
  'Topology 2D',
  'Topology 3D',
  'Trạng thái Realtime',
  'Topology Snapshot',
  'ChangeSet',
  'Hồ sơ tài liệu triển khai',
  'Lịch sử thay đổi',
  'Import CSV/Excel',
  'Sync SSH',
  'Alert & Notification',
];

const GROUPS = [
  { code: 'ADMIN_GRP', name: 'Quản trị hệ thống', role: 'ADMIN', color: 'red' },
  { code: 'PTUD', name: 'Phát triển ứng dụng', role: 'OPERATOR', color: 'blue' },
  { code: 'VH_APP', name: 'Vận hành ứng dụng', role: 'OPERATOR', color: 'blue' },
  { code: 'CSHT', name: 'Cơ sở hạ tầng', role: 'OPERATOR', color: 'blue' },
  { code: 'PTNV', name: 'Phân tích nghiệp vụ', role: 'VIEWER', color: 'green' },
];

const DEMO_SUMMARY = [
  {
    icon: <CloudServerOutlined />,
    label: '8 Servers',
    detail: '3 môi trường (DEV / UAT / PROD), 2 site (DC / DR)',
    color: '#1677ff',
  },
  {
    icon: <AppstoreOutlined />,
    label: '4 Ứng dụng',
    detail: 'Core Banking, Payment, API Gateway, Admin Portal',
    color: '#52c41a',
  },
  {
    icon: <ApartmentOutlined />,
    label: '5 Hệ thống software',
    detail: 'Ubuntu 22.04, OpenJDK 17, Nginx, PostgreSQL, Redis',
    color: '#722ed1',
  },
  {
    icon: <ApiOutlined />,
    label: '10 Deployments',
    detail: 'Phân bổ app trên server theo môi trường',
    color: '#fa8c16',
  },
  {
    icon: <ApartmentOutlined />,
    label: '5 AppConnections',
    detail: 'Kết nối API Gateway → Core Banking, Payment',
    color: '#13c2c2',
  },
  {
    icon: <FileTextOutlined />,
    label: '5 Loại tài liệu',
    detail: 'Kế hoạch triển khai, Báo cáo kiểm thử, Rollback…',
    color: '#eb2f96',
  },
];

const DEMO_SERVERS_PREVIEW = [
  { code: 'SVR-DEV-APP-01', env: 'DEV', purpose: 'APP_SERVER', infra: 'VM' },
  { code: 'SVR-DEV-DB-01', env: 'DEV', purpose: 'DB_SERVER', infra: 'VM' },
  { code: 'SVR-UAT-APP-01', env: 'UAT', purpose: 'APP_SERVER', infra: 'VM' },
  { code: 'SVR-UAT-DB-01', env: 'UAT', purpose: 'DB_SERVER', infra: 'VM' },
  { code: 'SVR-PROD-APP-01', env: 'PROD', purpose: 'APP_SERVER', infra: 'Physical' },
  { code: 'SVR-PROD-APP-02', env: 'PROD', purpose: 'APP_SERVER', infra: 'Physical (DR)' },
  { code: 'SVR-PROD-DB-01', env: 'PROD', purpose: 'DB_SERVER', infra: 'Physical' },
  { code: 'SVR-PROD-LB-01', env: 'PROD', purpose: 'LOAD_BALANCER', infra: 'Physical' },
];

const ENV_COLOR: Record<string, string> = { DEV: 'cyan', UAT: 'orange', PROD: 'red' };

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [withDemo, setWithDemo] = useState(false);
  const [demoSeeded, setDemoSeeded] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { mutate: initialize, isPending: isInitializing } = useMutation({
    mutationFn: () => apiClient.post('/system/initialize'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
      if (withDemo) {
        seedDemo();
      } else {
        setCurrentStep(2);
      }
    },
    onError: () => message.error('Khởi tạo thất bại. Vui lòng thử lại.'),
  });

  const { mutate: seedDemo, isPending: isSeeding } = useMutation({
    mutationFn: () => apiClient.post('/system/seed-demo'),
    onSuccess: () => {
      setDemoSeeded(true);
      setCurrentStep(2);
    },
    onError: () => {
      // Init succeeded but demo failed — still go to step 2
      setCurrentStep(2);
      message.warning('Khởi tạo thành công nhưng tạo dữ liệu demo thất bại.');
    },
  });

  const isLoading = isInitializing || isSeeding;

  const steps = [
    { title: 'Chào mừng', icon: <RocketOutlined /> },
    { title: 'Cấu hình', icon: <SettingOutlined /> },
    { title: 'Hoàn thành', icon: <CheckCircleOutlined /> },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f4ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <Card
        style={{ width: '100%', maxWidth: 860, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        styles={{ body: { padding: '40px 48px' } }}
      >
        <Steps current={currentStep} items={steps} style={{ marginBottom: 40 }} />

        {/* ── Step 0: Welcome ─────────────────────────────── */}
        {currentStep === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              <RocketOutlined style={{ color: '#1677ff' }} />
            </div>
            <Title level={3}>Chào mừng đến với SystemManager</Title>
            <Paragraph
              type="secondary"
              style={{ fontSize: 15, maxWidth: 520, margin: '0 auto 32px' }}
            >
              Hệ thống chưa được khởi tạo. Bước thiết lập này sẽ tạo cấu hình module mặc định và các
              nhóm người dùng cho tổ chức. Sau khi khởi tạo, đăng nhập bằng bất kỳ email nào để tự
              động tạo tài khoản admin đầu tiên. Bạn có thể tùy chọn thêm dữ liệu demo để khám phá
              đầy đủ tính năng ngay lập tức.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<SettingOutlined />}
              onClick={() => setCurrentStep(1)}
            >
              Bắt đầu thiết lập
            </Button>
          </div>
        )}

        {/* ── Step 1: Config ──────────────────────────────── */}
        {currentStep === 1 && (
          <div>
            <Title level={4} style={{ marginBottom: 24 }}>
              Cấu hình hệ thống
            </Title>

            <Row gutter={32}>
              {/* Modules + Groups */}
              <Col span={12}>
                <Space style={{ marginBottom: 10 }}>
                  <AppstoreOutlined style={{ color: '#1677ff' }} />
                  <Text strong>Module hệ thống</Text>
                  <Badge count={17} color="blue" />
                </Space>
                <Collapse
                  size="small"
                  items={[
                    {
                      key: 'core',
                      label: (
                        <>
                          <Tag color="blue">CORE</Tag> {MODULES_CORE.length} modules
                        </>
                      ),
                      children: (
                        <List
                          size="small"
                          dataSource={MODULES_CORE}
                          renderItem={(m) => (
                            <List.Item style={{ padding: '4px 0' }}>
                              <Text style={{ fontSize: 12 }}>{m}</Text>
                            </List.Item>
                          )}
                        />
                      ),
                    },
                    {
                      key: 'ext',
                      label: (
                        <>
                          <Tag color="purple">EXTENDED</Tag> {MODULES_EXTENDED.length} modules
                        </>
                      ),
                      children: (
                        <List
                          size="small"
                          dataSource={MODULES_EXTENDED}
                          renderItem={(m) => (
                            <List.Item style={{ padding: '4px 0' }}>
                              <Text style={{ fontSize: 12 }}>{m}</Text>
                            </List.Item>
                          )}
                        />
                      ),
                    },
                  ]}
                  style={{ marginBottom: 16 }}
                />

                <Space style={{ marginBottom: 10 }}>
                  <TeamOutlined style={{ color: '#52c41a' }} />
                  <Text strong>Nhóm người dùng</Text>
                  <Badge count={5} color="green" />
                </Space>
                <List
                  size="small"
                  bordered
                  dataSource={GROUPS}
                  renderItem={(g) => (
                    <List.Item>
                      <Space>
                        <Text strong style={{ fontSize: 12 }}>
                          {g.code}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {g.name}
                        </Text>
                      </Space>
                      <Tag color={g.color} style={{ marginLeft: 'auto', fontSize: 11 }}>
                        {g.role}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Col>

              {/* Demo data toggle */}
              <Col span={12}>
                <div
                  style={{
                    border: `2px solid ${withDemo ? '#1677ff' : '#d9d9d9'}`,
                    borderRadius: 8,
                    padding: 16,
                    background: withDemo ? '#f0f7ff' : '#fafafa',
                    transition: 'all .2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Space>
                      <DatabaseOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                      <Text strong>Tạo dữ liệu Demo</Text>
                    </Space>
                    <Switch checked={withDemo} onChange={setWithDemo} />
                  </div>

                  {!withDemo ? (
                    <Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
                      Bật để tự động tạo dữ liệu mẫu đầy đủ — server, ứng dụng, deployment, kết nối
                      — giúp bạn trải nghiệm toàn bộ tính năng ngay lập tức.
                    </Paragraph>
                  ) : (
                    <div>
                      <Alert
                        type="info"
                        showIcon
                        message="Dữ liệu demo sẽ được tạo"
                        style={{ marginBottom: 12, fontSize: 12 }}
                      />
                      <Row gutter={[8, 8]}>
                        {DEMO_SUMMARY.map((s, i) => (
                          <Col span={24} key={i}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: s.color, fontSize: 16 }}>{s.icon}</span>
                              <div>
                                <Text strong style={{ fontSize: 12 }}>
                                  {s.label}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {s.detail}
                                </Text>
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>

                      <Divider style={{ margin: '12px 0' }} />
                      <Collapse
                        size="small"
                        items={[
                          {
                            key: 'servers',
                            label: <Text style={{ fontSize: 12 }}>Xem danh sách servers</Text>,
                            children: (
                              <List
                                size="small"
                                dataSource={DEMO_SERVERS_PREVIEW}
                                renderItem={(s) => (
                                  <List.Item style={{ padding: '3px 0' }}>
                                    <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                      {s.code}
                                    </Text>
                                    <Space style={{ marginLeft: 'auto' }}>
                                      <Tag
                                        color={ENV_COLOR[s.env]}
                                        style={{ fontSize: 10, margin: 0 }}
                                      >
                                        {s.env}
                                      </Tag>
                                      <Tag style={{ fontSize: 10, margin: 0 }}>{s.purpose}</Tag>
                                    </Space>
                                  </List.Item>
                                )}
                              />
                            ),
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <Divider />

            {isLoading && (
              <Alert
                type="info"
                icon={<LoadingOutlined spin />}
                message={
                  isSeeding
                    ? 'Đang tạo dữ liệu demo… (có thể mất 5-10 giây)'
                    : 'Đang khởi tạo hệ thống…'
                }
                style={{ marginBottom: 16 }}
                showIcon
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(0)} disabled={isLoading}>
                Quay lại
              </Button>
              <Button
                type="primary"
                size="large"
                icon={isLoading ? <LoadingOutlined /> : <RocketOutlined />}
                loading={isLoading}
                onClick={() => initialize()}
              >
                {withDemo ? 'Khởi tạo + Tạo dữ liệu Demo' : 'Khởi tạo hệ thống'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Done ────────────────────────────────── */}
        {currentStep === 2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </div>
            <Title level={3}>Hệ thống đã sẵn sàng!</Title>

            <Row
              gutter={16}
              justify="center"
              style={{ marginBottom: 24, maxWidth: 540, margin: '0 auto 24px' }}
            >
              <Col span={8}>
                <Statistic title="Modules" value={17} prefix={<AppstoreOutlined />} />
              </Col>
              <Col span={8}>
                <Statistic title="Nhóm người dùng" value={5} prefix={<TeamOutlined />} />
              </Col>
              {demoSeeded && (
                <Col span={8}>
                  <Statistic title="Servers demo" value={8} prefix={<CloudServerOutlined />} />
                </Col>
              )}
            </Row>

            {demoSeeded && (
              <Alert
                type="success"
                message="Dữ liệu demo đã được tạo thành công"
                description="8 servers, 4 ứng dụng, 10 deployments, 5 kết nối và các cấu hình mạng, phần cứng đầy đủ."
                showIcon
                style={{
                  marginBottom: 24,
                  textAlign: 'left',
                  maxWidth: 520,
                  margin: '0 auto 24px',
                }}
              />
            )}

            <Paragraph type="secondary" style={{ marginBottom: 32 }}>
              Truy cập <Text strong>/login</Text> để đăng nhập. Tài khoản đầu tiên đăng nhập sẽ tự
              động trở thành admin. Sau đó truy cập <Text strong>/admin/modules</Text> để bật/tắt
              module hoặc <Text strong>/admin/users</Text> để quản lý người dùng.
            </Paragraph>

            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={() => navigate('/dashboard')}
            >
              Vào Dashboard
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
