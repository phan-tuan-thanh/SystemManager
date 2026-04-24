import { Card, Form, Select, Switch, Button, Typography, Space, Tag, App, Skeleton } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useLogConfig, useUpdateLogConfig } from '../../hooks/useLogConfig';
import type { LogConfig } from '../../hooks/useLogConfig';

const { Title, Text, Paragraph } = Typography;

const LEVEL_OPTIONS = [
  { value: 'error',   label: 'error',   color: 'red' },
  { value: 'warn',    label: 'warn',    color: 'orange' },
  { value: 'log',     label: 'info',    color: 'blue' },
  { value: 'debug',   label: 'debug',   color: 'purple' },
  { value: 'verbose', label: 'verbose', color: 'default' },
];

const LEVEL_DESC: Record<string, string> = {
  error:   'Chỉ ghi lỗi nghiêm trọng',
  warn:    'Lỗi + cảnh báo',
  log:     'Lỗi + cảnh báo + thông tin (khuyến nghị)',
  debug:   'Tất cả + thông tin debug',
  verbose: 'Tất cả chi tiết nhất (không dùng production)',
};

export default function SystemConfigPage() {
  const [form] = Form.useForm<LogConfig>();
  const { data, isLoading, refetch } = useLogConfig();
  const { mutateAsync, isPending } = useUpdateLogConfig();
  const { message } = App.useApp();

  const onFinish = async (values: LogConfig) => {
    try {
      await mutateAsync(values);
      message.success('Cập nhật cài đặt log thành công — có hiệu lực ngay lập tức');
    } catch {
      message.error('Không thể lưu cài đặt log');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Cấu hình logging và các tham số vận hành — thay đổi có hiệu lực ngay."
        helpKey="system_config"
      />

      <Card
        title="Logging"
        extra={
          <Button icon={<ReloadOutlined />} size="small" onClick={() => refetch()}>
            Làm mới
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={data}
          onFinish={onFinish}
        >
          <Form.Item
            name="enabled"
            label="Bật/tắt ghi log"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          <Form.Item
            name="level"
            label="Mức log"
            help={
              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.level !== cur.level}>
                {({ getFieldValue }) => (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {LEVEL_DESC[getFieldValue('level')] ?? ''}
                  </Text>
                )}
              </Form.Item>
            }
          >
            <Select style={{ width: 200 }}>
              {LEVEL_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  <Tag color={opt.color} style={{ minWidth: 64, textAlign: 'center' }}>
                    {opt.label}
                  </Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Đích ghi log">
            <Space direction="vertical" size={8}>
              <Form.Item name="toConsole" valuePropName="checked" noStyle>
                <Switch checkedChildren="Console bật" unCheckedChildren="Console tắt" />
              </Form.Item>
              <Form.Item name="toFile" valuePropName="checked" noStyle>
                <Switch checkedChildren="File bật" unCheckedChildren="File tắt" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
            File log lưu tại <Text code>logs/app-YYYY-MM-DD.log</Text>, xoay vòng hàng ngày, giữ 30 ngày.
          </Paragraph>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={isPending}
            >
              Lưu cài đặt
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
