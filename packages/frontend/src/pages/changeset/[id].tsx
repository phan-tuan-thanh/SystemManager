import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Tag, Space, Descriptions, Modal, message, Skeleton, Alert, Typography, Divider,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined, EyeOutlined, CheckCircleOutlined, DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import ChangeItemDiff from './components/ChangeItemDiff';
import {
  useChangeSetDetail,
  useDiscardChangeSet,
  useRemoveChangeItem,
  usePreviewChangeSet,
  useApplyChangeSet,
} from './hooks/useChangeSets';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'blue',
  PREVIEWING: 'orange',
  APPLIED: 'green',
  DISCARDED: 'default',
};

export default function ChangeSetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [applyOpen, setApplyOpen] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const { data: cs, isLoading } = useChangeSetDetail(id);
  const discardMut = useDiscardChangeSet();
  const removeMut = useRemoveChangeItem();
  const previewMut = usePreviewChangeSet();
  const applyMut = useApplyChangeSet();

  const isEditable = cs?.status === 'DRAFT' || cs?.status === 'PREVIEWING';
  const canApply = cs?.status === 'PREVIEWING' || cs?.status === 'DRAFT';

  async function handleDiscard() {
    try {
      await discardMut.mutateAsync(id!);
      message.success('ChangeSet discarded');
      navigate('/changesets');
    } catch {
      message.error('Failed to discard');
    }
  }

  async function handleRemoveItem(itemId: string) {
    setRemovingItemId(itemId);
    try {
      await removeMut.mutateAsync({ changesetId: id!, itemId });
      message.success('Item removed');
    } catch {
      message.error('Failed to remove item');
    } finally {
      setRemovingItemId(null);
    }
  }

  async function handlePreview() {
    try {
      const result = await previewMut.mutateAsync(id!);
      navigate(`/changesets/${id}/preview`, { state: { previewResult: result } });
    } catch {
      message.error('Preview failed');
    }
  }

  async function handleApply() {
    try {
      await applyMut.mutateAsync(id!);
      message.success('ChangeSet applied successfully');
      setApplyOpen(false);
      navigate('/changesets');
    } catch (err: any) {
      const conflicts = err?.response?.data?.error?.message?.conflicts;
      if (conflicts) {
        message.error(`Cannot apply: ${conflicts.length} fatal conflict(s) detected. Run Preview first.`);
      } else {
        message.error('Failed to apply ChangeSet');
      }
      setApplyOpen(false);
    }
  }

  if (isLoading) return <Skeleton active />;
  if (!cs) return <Alert type="error" message="ChangeSet not found" />;

  const items = cs.items ?? [];

  const tabs = [
    {
      key: 'info',
      label: 'Thông tin',
      children: (
        <>
          <Descriptions bordered size="small" style={{ marginBottom: 24 }} column={3}>
            <Descriptions.Item label="Trạng thái">
              <Tag color={STATUS_COLOR[cs.status] ?? 'default'}>
                {cs.status === 'DRAFT' ? 'Bản nháp' : cs.status === 'PREVIEWING' ? 'Đang xem trước' : cs.status === 'APPLIED' ? 'Đã áp dụng' : 'Đã hủy'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Môi trường">
              {cs.environment ?? <Text type="secondary">Tất cả</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Số mục thay đổi">{items.length}</Descriptions.Item>
            <Descriptions.Item label="Người tạo">{cs.creator?.full_name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{dayjs(cs.created_at).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            {cs.applied_at && (
              <Descriptions.Item label="Ngày áp dụng">
                {dayjs(cs.applied_at).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider orientation="left">Danh sách thay đổi ({items.length})</Divider>

          {items.length === 0 && cs.status === 'DRAFT' && (
            <Alert
              type="info"
              message="Chưa có thay đổi nào"
              description="ChangeSet này đang trống. Hãy bật 'Chế độ bản nháp' và thực hiện các thao tác sửa đổi trên hệ thống để ghi nhận vào đây."
              style={{ marginBottom: 16 }}
            />
          )}

          <ChangeItemDiff
            items={items}
            onRemove={cs.status === 'DRAFT' ? handleRemoveItem : undefined}
            removing={removingItemId}
          />
        </>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/changesets')} />
            {cs.title}
            <Tag color={STATUS_COLOR[cs.status] ?? 'default'}>
              {cs.status === 'DRAFT' ? 'Bản nháp' : cs.status === 'PREVIEWING' ? 'Đang xem trước' : cs.status === 'APPLIED' ? 'Đã áp dụng' : 'Đã hủy'}
            </Tag>
            {cs.environment && <Tag>{cs.environment}</Tag>}
          </Space>
        }
        subtitle={cs.description ?? 'Không có mô tả'}
        extra={
          <Space>
            {isEditable && (
              <>
                <Button
                  icon={<EyeOutlined />}
                  onClick={handlePreview}
                  loading={previewMut.isPending}
                >
                  Xem trước thay đổi
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setApplyOpen(true)}
                  disabled={items.length === 0}
                >
                  Áp dụng
                </Button>
                <Popconfirm
                  title="Hủy bỏ ChangeSet này? Mọi dữ liệu nháp sẽ bị xóa và không thể khôi phục."
                  onConfirm={handleDiscard}
                  okText="Hủy bỏ"
                  okButtonProps={{ danger: true }}
                  cancelText="Quay lại"
                >
                  <Button danger icon={<DeleteOutlined />} loading={discardMut.isPending}>
                    Hủy bỏ
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        }
      />

      <Tabs items={tabs} defaultActiveKey="info" />

      {/* Apply confirm modal */}
      <Modal
        title="Xác nhận áp dụng thay đổi"
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        onOk={handleApply}
        confirmLoading={applyMut.isPending}
        okText="Xác nhận Áp dụng"
        cancelText="Quay lại"
        okButtonProps={{ type: 'primary' }}
      >
        <Alert
          type="warning"
          message="Hành động này sẽ cập nhật trực tiếp vào dữ liệu vận hành."
          description={`${items.length} mục thay đổi sẽ được áp dụng. Hệ thống sẽ tự động tạo một Topology Snapshot. Thao tác này không thể hoàn tác.`}
          showIcon
          style={{ marginBottom: 12 }}
        />
        <Text>Bạn có chắc chắn muốn áp dụng ChangeSet: <strong>{cs.title}</strong>?</Text>
      </Modal>
    </div>
  );
}
