import { useState } from 'react';
import { Card, Tag, Button, Upload, Modal, Input, Space, App, Progress, Tooltip } from 'antd';
import {
  UploadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileOutlined, EyeOutlined, StopOutlined,
} from '@ant-design/icons';
import type { DeploymentDoc } from '../../../types/deployment';
import {
  useUploadDocPreview, useUploadDocFinal, useWaiveDoc,
} from '../../../hooks/useDeployments';

interface Props {
  deploymentId: string;
  doc: DeploymentDoc;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'default',
  PREVIEW: 'processing',
  COMPLETE: 'success',
  WAIVED: 'warning',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ upload',
  PREVIEW: 'Đã có bản nháp',
  COMPLETE: 'Hoàn thành',
  WAIVED: 'Được miễn',
};

export default function DocUploadCard({ deploymentId, doc }: Props) {
  const { message } = App.useApp();
  const [waiveOpen, setWaiveOpen] = useState(false);
  const [waiveReason, setWaiveReason] = useState('');

  const uploadPreview = useUploadDocPreview(deploymentId);
  const uploadFinal = useUploadDocFinal(deploymentId);
  const waiveDoc = useWaiveDoc(deploymentId);

  const handleUpload = (type: 'preview' | 'final') => async (file: File) => {
    try {
      if (type === 'preview') {
        await uploadPreview.mutateAsync({ docTypeId: doc.doc_type_id, file });
        message.success('Đã upload bản nháp');
      } else {
        await uploadFinal.mutateAsync({ docTypeId: doc.doc_type_id, file });
        message.success('Đã upload bản chính thức (PDF)');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error?.message ?? 'Upload thất bại');
    }
    return false; // prevent default upload
  };

  const handleWaive = async () => {
    if (!waiveReason.trim()) {
      message.warning('Vui lòng nhập lý do miễn tài liệu');
      return;
    }
    try {
      await waiveDoc.mutateAsync({ docTypeId: doc.doc_type_id, reason: waiveReason });
      message.success('Đã miễn tài liệu');
      setWaiveOpen(false);
      setWaiveReason('');
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  const fileUrl = (type: 'preview' | 'final') =>
    `/api/v1/deployments/${deploymentId}/docs/${doc.doc_type_id}/file?type=${type}`;

  return (
    <Card
      size="small"
      style={{ marginBottom: 8 }}
      title={
        <Space>
          <FileOutlined />
          {doc.doc_type.name}
          {doc.doc_type.required && <Tag color="red" style={{ fontSize: 11 }}>Bắt buộc</Tag>}
          <Tag color={STATUS_COLOR[doc.status]}>{STATUS_LABEL[doc.status]}</Tag>
        </Space>
      }
      extra={
        <Space>
          {doc.preview_path && (
            <Tooltip title="Xem bản nháp">
              <Button
                size="small"
                icon={<EyeOutlined />}
                href={fileUrl('preview')}
                target="_blank"
              >
                Nháp
              </Button>
            </Tooltip>
          )}
          {doc.final_path && (
            <Tooltip title="Xem bản chính thức">
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                href={fileUrl('final')}
                target="_blank"
                type="primary"
              >
                Chính thức
              </Button>
            </Tooltip>
          )}
        </Space>
      }
    >
      {doc.status === 'WAIVED' ? (
        <div style={{ color: '#888' }}>
          <StopOutlined style={{ marginRight: 4 }} />
          Lý do miễn: {doc.waived_reason}
        </div>
      ) : doc.status === 'COMPLETE' ? (
        <div style={{ color: '#52c41a' }}>
          <CheckCircleOutlined style={{ marginRight: 4 }} />
          Đã hoàn thành — PDF đã nộp
        </div>
      ) : (
        <Space wrap>
          <Upload
            accept=".pdf,.docx,.xlsx,.doc,.xls"
            showUploadList={false}
            beforeUpload={handleUpload('preview')}
          >
            <Button
              size="small"
              icon={<UploadOutlined />}
              loading={uploadPreview.isPending}
            >
              Upload nháp
            </Button>
          </Upload>

          <Upload
            accept=".pdf"
            showUploadList={false}
            beforeUpload={handleUpload('final')}
          >
            <Button
              size="small"
              type="primary"
              icon={<UploadOutlined />}
              loading={uploadFinal.isPending}
            >
              Upload PDF chính thức
            </Button>
          </Upload>

          {!doc.doc_type.required && (
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setWaiveOpen(true)}
            >
              Miễn
            </Button>
          )}
        </Space>
      )}

      <Modal
        title="Miễn tài liệu này"
        open={waiveOpen}
        onOk={handleWaive}
        onCancel={() => { setWaiveOpen(false); setWaiveReason(''); }}
        confirmLoading={waiveDoc.isPending}
      >
        <p>Nhập lý do miễn tài liệu <strong>{doc.doc_type.name}</strong>:</p>
        <Input.TextArea
          rows={3}
          value={waiveReason}
          onChange={(e) => setWaiveReason(e.target.value)}
          placeholder="VD: Đã có phê duyệt riêng từ ban giám đốc"
        />
      </Modal>
    </Card>
  );
}
