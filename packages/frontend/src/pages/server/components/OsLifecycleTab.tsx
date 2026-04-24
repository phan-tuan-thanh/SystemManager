import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Select, Input, DatePicker, message, Typography } from 'antd';
import { PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../api/client';

const { Text } = Typography;

interface OsLifecycleTabProps {
  serverId: string;
}

export default function OsLifecycleTab({ serverId }: OsLifecycleTabProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [osCatalog, setOsCatalog] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/servers/${serverId}/os-history`);
      setHistory(res.data.data ?? res.data);
    } catch {
      message.error('Không thể tải lịch sử OS');
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await apiClient.get('/applications', {
        params: { application_type: 'SYSTEM', sw_type: 'OS', limit: 100 },
      });
      setOsCatalog(res.data.data ?? []);
    } catch {
      // Silent — catalog unavailable, dropdown stays empty
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchCatalog();
  }, [serverId]);

  const handleSubmit = async (values: any) => {
    try {
      await apiClient.post(`/servers/${serverId}/os-installs`, {
        ...values,
        installed_at: values.installed_at.toISOString(),
      });
      message.success('Cập nhật OS thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchHistory();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const columns = [
    {
      title: 'Hệ điều hành',
      key: 'os',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.application.name}</Text>
          <Text type="secondary" size="small">{record.version}</Text>
        </Space>
      ),
    },
    {
      title: 'Ngày cài đặt',
      dataIndex: 'installed_at',
      key: 'installed_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => (
        record.replaced_at 
          ? <Tag>Đã thay thế ({dayjs(record.replaced_at).format('DD/MM/YYYY')})</Tag>
          : <Tag color="green">Đang hoạt động</Tag>
      ),
    },
    {
      title: 'Lý do thay đổi',
      dataIndex: 'change_reason',
      key: 'reason',
    },
    {
      title: 'Ticket/CR',
      dataIndex: 'change_ticket',
      key: 'ticket',
      render: (t: string) => t ? <Tag color="blue">{t}</Tag> : '-',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <HistoryOutlined />
          <Text strong>Lịch sử cài đặt Hệ điều hành</Text>
        </Space>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
        >
          Cài đặt/Nâng cấp OS
        </Button>
      </div>

      <Table
        dataSource={history}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={false}
      />

      <Modal
        title="Cài đặt hoặc Nâng cấp Hệ điều hành"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ installed_at: dayjs() }}
        >
          <Form.Item
            name="application_id"
            label="Chọn OS từ Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn OS' }]}
          >
            <Select 
              placeholder="Chọn OS (Windows, Linux, ...)"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={osCatalog.map(app => ({ label: app.name, value: app.id }))}
            />
          </Form.Item>

          <Form.Item
            name="version"
            label="Phiên bản/Build"
            rules={[{ required: true, message: 'Vui lòng nhập phiên bản' }]}
          >
            <Input placeholder="Ví dụ: 10.0.17763, Kernel 5.4.0, ..." />
          </Form.Item>

          <Form.Item
            name="installed_at"
            label="Ngày cài đặt"
            rules={[{ required: true }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="change_reason"
            label="Lý do thay đổi (Bắt buộc nếu là nâng cấp)"
          >
            <Input.TextArea placeholder="Nâng cấp bảo mật, cài mới server, ..." />
          </Form.Item>

          <Form.Item
            name="change_ticket"
            label="Ticket / CR (nếu có)"
          >
            <Input placeholder="Ví dụ: CR-2025-001" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú thêm"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
