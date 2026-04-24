import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Tag, Button, Space, Select, Input, Modal, Form, message, Popconfirm, Skeleton, Typography,
} from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import {
  useChangeSetList, useCreateChangeSet, useDiscardChangeSet, type ChangeSet,
} from './hooks/useChangeSets';

const { Option } = Select;
const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'blue',
  PREVIEWING: 'orange',
  APPLIED: 'green',
  DISCARDED: 'default',
};

export default function ChangeSetListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useChangeSetList(filters);
  const createMut = useCreateChangeSet();
  const discardMut = useDiscardChangeSet();

  const changeSets: ChangeSet[] = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20 };

  async function handleCreate(values: any) {
    try {
      const cs = await createMut.mutateAsync(values);
      message.success('ChangeSet created');
      setCreateOpen(false);
      form.resetFields();
      navigate(`/changesets/${cs.id}`);
    } catch {
      message.error('Failed to create ChangeSet');
    }
  }

  async function handleDiscard(id: string) {
    try {
      await discardMut.mutateAsync(id);
      message.success('ChangeSet discarded');
    } catch {
      message.error('Failed to discard ChangeSet');
    }
  }

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      render: (title: string, row: ChangeSet) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/changesets/${row.id}`)}>
          {title}
        </Button>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (s: string) => {
        const labels: Record<string, string> = {
          DRAFT: 'Bản nháp',
          PREVIEWING: 'Đang xem trước',
          APPLIED: 'Đã áp dụng',
          DISCARDED: 'Đã hủy',
        };
        return <Tag color={STATUS_COLOR[s] ?? 'default'}>{labels[s] ?? s}</Tag>;
      },
    },
    {
      title: 'Môi trường',
      dataIndex: 'environment',
      width: 100,
      render: (e: string) => e ? <Tag>{e}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Số mục',
      dataIndex: '_count',
      width: 80,
      render: (c: any) => <Text>{c?.items ?? 0}</Text>,
    },
    {
      title: 'Người tạo',
      dataIndex: 'creator',
      width: 150,
      render: (creator: any) => creator?.full_name ?? '—',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      width: 160,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thao tác',
      width: 120,
      render: (row: ChangeSet) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/changesets/${row.id}`)}
          >
            Xem
          </Button>
          {(row.status === 'DRAFT' || row.status === 'PREVIEWING') && (
            <Popconfirm
              title="Hủy bỏ ChangeSet này?"
              onConfirm={() => handleDiscard(row.id)}
              okText="Hủy bỏ"
              okButtonProps={{ danger: true }}
              cancelText="Quay lại"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="ChangeSets"
        subtitle="Quản lý bản nháp thay đổi hạ tầng trước khi áp dụng vào dữ liệu thật"
        helpKey="changeset"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Tạo ChangeSet
          </Button>
        }
      />

      {/* Filter bar */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Lọc theo trạng thái"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        >
          <Option value="DRAFT">Bản nháp</Option>
          <Option value="PREVIEWING">Đang xem trước</Option>
          <Option value="APPLIED">Đã áp dụng</Option>
          <Option value="DISCARDED">Đã hủy</Option>
        </Select>
        <Select
          placeholder="Lọc theo môi trường"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => setFilters((f) => ({ ...f, environment: v }))}
        >
          {['DEV', 'UAT', 'PROD'].map((e) => (
            <Option key={e} value={e}>{e}</Option>
          ))}
        </Select>
      </Space>

      {isLoading ? (
        <Skeleton active />
      ) : (
        <Table
          dataSource={changeSets}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{
            current: meta.page,
            pageSize: meta.limit,
            total: meta.total,
            showSizeChanger: true,
            showTotal: (t) => `Tổng cộng ${t} changesets`,
          }}
        />
      )}

      {/* Create modal */}
      <Modal
        title="Tạo ChangeSet mới"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMut.isPending}
        okText="Tạo mới"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
            <Input placeholder="VD: Nâng cấp server SRV-09 môi trường PROD" maxLength={255} />
          </Form.Item>
          <Form.Item name="environment" label="Môi trường">
            <Select placeholder="Tất cả môi trường" allowClear>
              {['DEV', 'UAT', 'PROD'].map((e) => <Option key={e} value={e}>{e}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả chi tiết (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
