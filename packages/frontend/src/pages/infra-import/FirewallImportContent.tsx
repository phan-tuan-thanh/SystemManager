import { useState } from 'react';
import {
  Button,
  Upload,
  Alert,
  Table,
  Tag,
  App,
  Typography,
  Card,
  Space,
  Statistic,
  Row,
  Col,
  Result,
  Steps,
  Switch,
  Tooltip,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import Papa from 'papaparse';
import apiClient from '../../api/client';

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

interface PreviewRow {
  row: number;
  name: string;
  environment: string;
  source_ip: string;
  server_code: string;
  port_number: string | number;
  protocol: string;
  action: string;
  status: string;
  valid: boolean;
  error?: string;
}

const FIREWALL_COLUMNS = [
  { key: 'name', label: 'Tên rule', required: true },
  { key: 'environment', label: 'Môi trường', required: true },
  { key: 'source_ip', label: 'Source IP' },
  { key: 'source_zone_code', label: 'Zone nguồn' },
  { key: 'server_code', label: 'Server đích', required: true },
  { key: 'port_number', label: 'Port', required: true },
  { key: 'destination_zone_code', label: 'Zone đích' },
  { key: 'protocol', label: 'Protocol' },
  { key: 'action', label: 'Action', required: true },
  { key: 'status', label: 'Trạng thái' },
  { key: 'notes', label: 'Ghi chú' },
];

export default function FirewallImportContent() {
  const { message, modal } = App.useApp();
  const [step, setStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const handleReset = () => {
    setStep(0);
    setFileList([]);
    setPreviewRows([]);
    setResult(null);
    setLoading(false);
    setShowOnlyErrors(false);
  };

  const parseAndPreview = () => {
    const file = fileList[0]?.originFileObj as File | undefined;
    if (!file) { message.error('Vui lòng chọn file.'); return; }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        const parsed: PreviewRow[] = rows.map((r, idx) => {
          const errors: string[] = [];
          if (!r.name) errors.push('Thiếu name');
          if (!r.environment) errors.push('Thiếu environment');
          if (!r.server_code && !r.destination_server_id) errors.push('Thiếu server_code');
          if (!r.port_number) errors.push('Thiếu port_number');
          if (!r.action) errors.push('Thiếu action');
          return {
            row: idx + 2,
            name: r.name ?? '',
            environment: r.environment ?? '',
            source_ip: r.source_ip ?? '',
            server_code: r.server_code ?? r.destination_server_id ?? '',
            port_number: r.port_number ?? '',
            protocol: r.protocol ?? '',
            action: r.action ?? '',
            status: r.status ?? '',
            valid: errors.length === 0,
            error: errors.join('; ') || undefined,
          };
        });
        setPreviewRows(parsed);
        setStep(1);
      },
    });
  };

  const handleImport = async () => {
    const file = fileList[0]?.originFileObj as File | undefined;
    if (!file) return;

    const validCount = previewRows.filter((r) => r.valid).length;
    const invalidCount = previewRows.filter((r) => !r.valid).length;

    modal.confirm({
      title: 'Xác nhận import Firewall Rules',
      content: (
        <div>
          <p>
            Import <strong>{validCount}</strong> rule hợp lệ
            {invalidCount > 0 && (
              <span style={{ color: '#ff4d4f' }}>
                , <strong>{invalidCount}</strong> dòng lỗi sẽ được ghi nhận
              </span>
            )}
            .
          </p>
        </div>
      ),
      okText: 'Import',
      cancelText: 'Huỷ',
      onOk: async () => {
        setLoading(true);
        try {
          const form = new FormData();
          form.append('file', file);
          const { data } = await apiClient.post('/firewall-rules/import', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const res: ImportResult = data.data ?? data;
          setResult(res);
          setStep(2);
          message.success(
            `Import hoàn thành: ${res.created} tạo mới, ${res.skipped} bỏ qua`,
          );
        } catch (err: any) {
          message.error(err?.response?.data?.message ?? 'Lỗi khi import firewall rules.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const tableColumns = [
    { title: '#', dataIndex: 'row', width: 50, render: (v: number) => <Text type="secondary">{v}</Text> },
    { title: 'Tên rule', dataIndex: 'name', ellipsis: true },
    { title: 'Env', dataIndex: 'environment', width: 60,
      render: (v: string) => <Tag color={v === 'PROD' ? 'red' : v === 'UAT' ? 'orange' : 'blue'}>{v}</Tag> },
    { title: 'Source IP', dataIndex: 'source_ip', ellipsis: true },
    { title: 'Server', dataIndex: 'server_code', ellipsis: true },
    { title: 'Port', dataIndex: 'port_number', width: 70 },
    { title: 'Protocol', dataIndex: 'protocol', width: 80 },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 80,
      render: (v: string) => (
        <Tag color={v === 'ALLOW' ? 'success' : v === 'DENY' ? 'error' : 'default'}>{v}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      width: 100,
      render: (_: any, r: PreviewRow) =>
        r.valid ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Hợp lệ</Tag>
        ) : (
          <Tooltip title={r.error}>
            <Tag color="error" icon={<CloseCircleOutlined />}>Lỗi</Tag>
          </Tooltip>
        ),
    },
  ];

  const displayRows = showOnlyErrors ? previewRows.filter((r) => !r.valid) : previewRows;
  const validCount = previewRows.filter((r) => r.valid).length;
  const invalidCount = previewRows.filter((r) => !r.valid).length;

  return (
    <Card variant="borderless" style={{ background: 'transparent' }}>
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: 'Chọn file' },
          { title: 'Kiểm tra trước' },
          { title: 'Kết quả' },
        ]}
      />

      {/* Step 0 — Upload */}
      {step === 0 && (
        <div>
          <Dragger
            accept=".csv"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: list }) => setFileList(list)}
            onRemove={() => setFileList([])}
            style={{ marginBottom: 16 }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Kéo thả hoặc click để chọn file CSV</p>
            <p className="ant-upload-hint">Import Firewall Rules từ file CSV (UTF-8).</p>
          </Dragger>

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Cấu trúc CSV Firewall Rules"
            description={
              <Space wrap>
                {FIREWALL_COLUMNS.map((c) => (
                  <Tag key={c.key} color={c.required ? 'blue' : 'default'}>
                    {c.key}{c.required ? ' *' : ''}
                  </Tag>
                ))}
              </Space>
            }
          />

          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Lưu ý"
            description="server_code phải khớp với mã server đã có trong hệ thống. Các rule trùng (cùng source_ip + server + port) sẽ bị bỏ qua."
          />

          <Button
            type="primary"
            disabled={!fileList.length}
            onClick={parseAndPreview}
          >
            Kiểm tra file
          </Button>
        </div>
      )}

      {/* Step 1 — Preview */}
      {step === 1 && (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}><Statistic title="Tổng dòng" value={previewRows.length} /></Col>
            <Col span={6}>
              <Statistic title="Hợp lệ" value={validCount} valueStyle={{ color: '#52c41a' }} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Cảnh báo"
                value={invalidCount}
                valueStyle={{ color: invalidCount ? '#ff4d4f' : undefined }}
              />
            </Col>
          </Row>

          {invalidCount > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${invalidCount} dòng thiếu trường bắt buộc — sẽ được ghi nhận là lỗi khi import.`}
              style={{ marginBottom: 12 }}
            />
          )}

          <div style={{ marginBottom: 8 }}>
            <Space>
              <Switch
                size="small"
                checked={showOnlyErrors}
                onChange={setShowOnlyErrors}
                disabled={!invalidCount}
              />
              <Text type="secondary">Chỉ hiện dòng lỗi ({invalidCount})</Text>
            </Space>
          </div>

          <Table
            size="small"
            dataSource={displayRows}
            columns={tableColumns}
            rowKey="row"
            pagination={{ pageSize: 15, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            rowClassName={(r) => (!r.valid ? 'ant-table-row-error' : '')}
            style={{ marginBottom: 16 }}
          />

          <Space>
            <Button onClick={() => setStep(0)}>Quay lại</Button>
            <Button
              type="primary"
              loading={loading}
              disabled={!validCount}
              onClick={handleImport}
            >
              Import {validCount} rules
            </Button>
          </Space>
        </div>
      )}

      {/* Step 2 — Result */}
      {step === 2 && result && (
        <Result
          status={(result.errors?.length ?? 0) > 0 ? 'warning' : 'success'}
          title={(result.errors?.length ?? 0) > 0 ? `Import hoàn thành với ${result.errors.length} lỗi` : 'Import thành công!'}
          subTitle={`Tạo mới: ${result.created} | Bỏ qua (trùng): ${result.skipped} | Lỗi: ${result.errors?.length ?? 0}`}
          extra={[
            <Button key="again" type="primary" onClick={handleReset}>Import thêm</Button>,
          ]}
        >
          {(result.errors?.length ?? 0) > 0 && (
            <Alert
              type="error"
              showIcon
              message="Chi tiết lỗi"
              description={
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i} style={{ fontSize: 12 }}>{e}</li>
                  ))}
                  {result.errors.length > 20 && (
                    <li style={{ fontSize: 12, color: '#8c8c8c' }}>...và {result.errors.length - 20} lỗi khác</li>
                  )}
                </ul>
              }
            />
          )}
        </Result>
      )}
    </Card>
  );
}
