import { useState } from 'react';
import {
  Modal, Upload, Button, Alert, Space, Typography, List, App,
} from 'antd';
import { InboxOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/client';

const { Dragger } = Upload;
const { Text } = Typography;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

interface FirewallRuleImportModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function FirewallRuleImportModal({ open, onClose }: FirewallRuleImportModalProps) {
  const { message } = App.useApp();
  const qc = useQueryClient();

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleClose = () => {
    setFileList([]);
    setResult(null);
    onClose();
  };

  const uploadProps: UploadProps = {
    accept: '.csv,.xlsx',
    maxCount: 1,
    fileList,
    beforeUpload: () => false,
    onChange: ({ fileList: list }) => setFileList(list),
  };

  const handleImport = async () => {
    const file = fileList[0]?.originFileObj as File | undefined;
    if (!file) {
      message.error('Vui lòng chọn file CSV hoặc XLSX');
      return;
    }

    const form = new FormData();
    form.append('file', file);

    setLoading(true);
    try {
      const { data } = await apiClient.post<{ data: ImportResult }>('/firewall-rules/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const importResult = data.data;
      setResult(importResult);
      qc.invalidateQueries({ queryKey: ['firewall-rules'] });

      if (importResult.errors.length === 0) {
        message.success(`Import thành công: tạo ${importResult.created} rule, bỏ qua ${importResult.skipped}`);
      } else {
        message.warning(`Import hoàn tất với ${importResult.errors.length} lỗi`);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Import thất bại');
    } finally {
      setLoading(false);
    }
  };

  const hasResult = result !== null;

  return (
    <Modal
      title="Import Firewall Rules"
      open={open}
      onCancel={handleClose}
      destroyOnHidden
      footer={
        hasResult ? (
          <Button type="primary" onClick={handleClose}>
            Đóng
          </Button>
        ) : (
          <Space>
            <Button onClick={handleClose}>Huỷ</Button>
            <Button
              type="primary"
              loading={loading}
              disabled={!fileList.length}
              onClick={handleImport}
            >
              Import
            </Button>
          </Space>
        )
      }
      width={560}
    >
      {!hasResult ? (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Alert
            type="info"
            showIcon
            message="Định dạng file hỗ trợ: CSV, XLSX"
            description="Dòng đầu tiên phải là tiêu đề cột. Các cột bắt buộc: name, environment, destination_server_id, protocol, action, status."
          />
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Nhấn hoặc kéo thả file CSV / XLSX vào đây
            </p>
            <p className="ant-upload-hint">Dung lượng tối đa: 20MB</p>
          </Dragger>
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {result.errors.length === 0 ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="Import hoàn tất"
              description={
                <span>
                  Tạo mới: <Text strong>{result.created}</Text> rule &nbsp;|&nbsp;
                  Bỏ qua: <Text strong>{result.skipped}</Text>
                </span>
              }
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={`Import hoàn tất với ${result.errors.length} lỗi`}
              description={
                <span>
                  Tạo mới: <Text strong>{result.created}</Text> &nbsp;|&nbsp;
                  Bỏ qua: <Text strong>{result.skipped}</Text>
                </span>
              }
            />
          )}

          {result.errors.length > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Danh sách lỗi ({result.errors.length}):
              </Text>
              <List
                size="small"
                dataSource={result.errors}
                renderItem={(err) => (
                  <List.Item style={{ padding: '4px 0' }}>
                    <Text type="danger" style={{ fontSize: 12 }}>{err}</Text>
                  </List.Item>
                )}
                style={{ maxHeight: 240, overflowY: 'auto' }}
              />
            </div>
          )}
        </Space>
      )}
    </Modal>
  );
}
