import { useState } from 'react';
import {
  Modal,
  Steps,
  Upload,
  Button,
  Select,
  Table,
  Alert,
  Space,
  Typography,
  Tag,
  Result,
  App,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import apiClient from '../../api/client';
import HelpGuide from './HelpGuide';

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportRow {
  row: number;
  data: Record<string, string | number | undefined>;
  errors: string[];
  valid: boolean;
}

interface PreviewResult {
  session_id: string;
  type: string;
  total: number;
  valid: number;
  invalid: number;
  rows: ImportRow[];
  columns: string[];
}

interface ExecuteResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: 'server' | 'application' | 'deployment';
  onSuccess?: () => void;
}

export default function BulkImportModal({ open, onClose, defaultType = 'server', onSuccess }: BulkImportModalProps) {
  const [step, setStep] = useState(0);
  const [importType, setImportType] = useState<'server' | 'application' | 'deployment'>(defaultType);
  const [environment, setEnvironment] = useState<string | undefined>(undefined);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleReset = () => {
    setStep(0);
    setFileList([]);
    setPreview(null);
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleUploadPreview = async () => {
    if (!fileList[0]?.originFileObj) {
      message.error('Vui lòng chọn file để tải lên.');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', fileList[0].originFileObj as File);
      const params = new URLSearchParams({ type: importType });
      if (environment) params.set('environment', environment);

      const { data } = await apiClient.post(`/import/preview?${params}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data.data ?? data);
      setStep(1);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error?.message || 'Xem trước thất bại. Vui lòng kiểm tra định dạng file.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!preview?.session_id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/import/execute', { session_id: preview.session_id });
      setResult(data.data ?? data);
      setStep(2);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error?.message || 'Import thất bại.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Union of canonical columns defined server-side + any extra keys found in the actual rows
  // (so columns the user added that aren't in our alias list still show up in the preview).
  const previewColumnKeys = (() => {
    if (!preview) return [] as string[];
    const seen = new Set<string>(preview.columns);
    preview.rows.forEach((r) => Object.keys(r.data).forEach((k) => seen.add(k)));
    return Array.from(seen);
  })();

  const previewColumns = [
    {
      title: '#',
      dataIndex: 'row',
      width: 50,
      fixed: 'left' as const,
      render: (v: number, r: ImportRow) => (
        <span>
          {r.valid
            ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
            : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          } {v}
        </span>
      ),
    },
    ...previewColumnKeys.map((col) => ({
      title: col.replace(/_/g, ' ').toUpperCase(),
      dataIndex: ['data', col],
      width: 140,
      ellipsis: true,
      render: (_: unknown, r: ImportRow) => r.data[col] ? String(r.data[col]) : <Text type="secondary">—</Text>,
    })),
    {
      title: 'Lỗi',
      dataIndex: 'errors',
      width: 220,
      fixed: 'right' as const,
      render: (errors: string[]) =>
        errors.length ? (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {errors.map((e, i) => <li key={i} style={{ color: '#ff4d4f', fontSize: 12 }}>{e}</li>)}
          </ul>
        ) : <Tag color="green">Hợp lệ</Tag>,
    },
  ];

  const footerButtons = () => {
    if (step === 0) {
      return [
        <Button key="cancel" onClick={handleClose}>Hủy bỏ</Button>,
        <Button key="next" type="primary" loading={loading} onClick={handleUploadPreview} disabled={!fileList.length}>
          Xem trước & Kiểm tra
        </Button>,
      ];
    }
    if (step === 1) {
      return [
        <Button key="back" onClick={() => setStep(0)}>Quay lại</Button>,
        <Button key="cancel" onClick={handleClose}>Hủy bỏ</Button>,
        <Button key="import" type="primary" loading={loading} onClick={handleExecute} disabled={!preview || preview.valid === 0}>
          Nhập {preview?.valid} dòng hợp lệ
        </Button>,
      ];
    }
    return [
      <Button key="close" type="primary" onClick={handleClose}>Đóng</Button>,
      <Button key="import-more" onClick={handleReset}>Nhập thêm</Button>,
    ];
  };

  return (
    <Modal
      title={
        <Space>
          <span>Nhập dữ liệu hàng loạt</span>
          <HelpGuide moduleKey="import" />
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={footerButtons()}
      width={860}
      destroyOnClose
    >
      <Steps
        current={step}
        style={{ marginBottom: 24 }}
        items={[
          { title: 'Tải file lên' },
          { title: 'Xem trước & Kiểm tra' },
          { title: 'Hoàn tất Import' },
        ]}
      />

      {/* Step 0: Upload */}
      {step === 0 && (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Space wrap>
            <div>
              <Text strong style={{ marginRight: 8 }}>Loại đối tượng:</Text>
              <Select
                value={importType}
                onChange={setImportType}
                style={{ width: 160 }}
                options={[
                  { value: 'server', label: 'Server' },
                  { value: 'application', label: 'Ứng dụng' },
                  { value: 'deployment', label: 'Deployment' },
                ]}
              />
            </div>
            {importType !== 'deployment' && (
              <div>
                <Text strong style={{ marginRight: 8 }}>Môi trường (tùy chọn):</Text>
                <Select
                  allowClear
                  value={environment}
                  onChange={setEnvironment}
                  style={{ width: 120 }}
                  placeholder="Tất cả"
                  options={[
                    { value: 'DEV', label: 'DEV' },
                    { value: 'UAT', label: 'UAT' },
                    { value: 'PROD', label: 'PROD' },
                  ]}
                />
              </div>
            )}
          </Space>

          <Alert
            type="info"
            showIcon
            message={`Các cột bắt buộc cho ${importType === 'server' ? 'Server' : importType === 'application' ? 'Ứng dụng' : 'Deployment'}`}
            description={
              importType === 'server'
                ? 'Bắt buộc: IP, Name. Tùy chọn: System, System_Name, Description, Environment (DEV/UAT/PROD/LIVE), Site (DC/DR/None), OS, CPU, RAM, Total Storage (GB).'
                : importType === 'application'
                ? 'code, name (tùy chọn: group_code, version, owner_team, description)'
                : 'application_code, server_code, environment, version (tùy chọn: status, deployer)'
            }
          />

          <Dragger
            accept=".csv,.xlsx"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: list }) => setFileList(list)}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Nhấn hoặc kéo thả file CSV hoặc Excel (.xlsx) vào đây</p>
            <p className="ant-upload-hint">Dung lượng tối đa: 20MB. Dòng đầu tiên phải là tiêu đề cột.</p>
          </Dragger>
        </Space>
      )}

      {/* Step 1: Preview */}
      {step === 1 && preview && (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="Tổng số dòng" value={preview.total} />
            </Col>
            <Col span={8}>
              <Statistic title="Hợp lệ" value={preview.valid} valueStyle={{ color: '#52c41a' }} />
            </Col>
            <Col span={8}>
              <Statistic title="Không hợp lệ" value={preview.invalid} valueStyle={{ color: preview.invalid > 0 ? '#ff4d4f' : undefined }} />
            </Col>
          </Row>
          {preview.invalid > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${preview.invalid} dòng có lỗi dữ liệu và sẽ bị bỏ qua khi nhập.`}
            />
          )}
          <Table
            size="small"
            columns={previewColumns}
            dataSource={preview.rows}
            rowKey="row"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            rowClassName={(r: ImportRow) => r.valid ? '' : 'ant-table-row-error'}
          />
        </Space>
      )}

      {/* Step 2: Result */}
      {step === 2 && result && (
        <Result
          status={result.imported > 0 ? 'success' : 'warning'}
          title={`Hoàn tất: đã nhập ${result.imported}, bỏ qua ${result.skipped}`}
          subTitle={result.errors.length > 0 ? `Phát sinh ${result.errors.length} lỗi trong quá trình nhập dữ liệu.` : 'Tất cả các dòng hợp lệ đã được nhập thành công.'}
          extra={result.errors.length > 0 && (
            <Alert
              type="error"
              message="Danh sách lỗi"
              description={
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {result.errors.slice(0, 10).map((e, i) => <li key={i} style={{ fontSize: 12 }}>{e}</li>)}
                  {result.errors.length > 10 && <li>...và {result.errors.length - 10} lỗi khác</li>}
                </ul>
              }
            />
          )}
        />
      )}
    </Modal>
  );
}
