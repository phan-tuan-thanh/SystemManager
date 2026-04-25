import { useState } from 'react';
import {
  Button,
  Upload,
  Alert,
  Select,
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
  Input,
  Tooltip,
  Divider,
} from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import Papa from 'papaparse';
import apiClient from '../../api/client';
import PageHeader from '../../components/common/PageHeader';
import ColumnMapper, {
  applyAllMappings,
  type ColumnMapping,
  type TargetField,
} from '../../components/common/ColumnMapper';
import ValueMapper, { type ValueMappings } from '../../components/common/ValueMapper';

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
  summary: { total: number; succeeded: number; failed: number };
  breakdown: {
    systems: { created: number; updated: number };
    servers: { created: number; updated: number };
    os_apps: { created: number; reused: number };
    hardware: { created: number; updated: number };
  };
  errors: Array<{ row: number; name: string; ip: string; reason: string }>;
}

const ENV_OPTIONS = [
  { label: 'DEV', value: 'DEV' },
  { label: 'UAT', value: 'UAT' },
  { label: 'PROD', value: 'PROD' },
];
const ENV_VALUE_ALIASES: Record<string, string> = {
  dev: 'DEV', development: 'DEV', test: 'DEV',
  uat: 'UAT', staging: 'UAT',
  prod: 'PROD', production: 'PROD', live: 'PROD',
};

const CONN_TYPE_OPTIONS = [
  { label: 'HTTP', value: 'HTTP' },
  { label: 'HTTPS', value: 'HTTPS' },
  { label: 'TCP', value: 'TCP' },
  { label: 'GRPC', value: 'GRPC' },
  { label: 'AMQP', value: 'AMQP' },
  { label: 'KAFKA', value: 'KAFKA' },
  { label: 'DATABASE', value: 'DATABASE' },
];
const CONN_TYPE_ALIASES: Record<string, string> = {
  http: 'HTTP', https: 'HTTPS', tcp: 'TCP',
  grpc: 'GRPC',
  amqp: 'AMQP', mq: 'AMQP', rabbitmq: 'AMQP',
  kafka: 'KAFKA',
  database: 'DATABASE', db: 'DATABASE', sql: 'DATABASE',
};

const CONN_TARGETS: TargetField[] = [
  {
    key: 'source_app',
    label: 'Ứng dụng nguồn (source_app)',
    required: true,
    aliases: ['from_app', 'from', 'source', 'caller', 'source_application'],
  },
  {
    key: 'target_app',
    label: 'Ứng dụng đích (target_app)',
    required: true,
    aliases: ['to_app', 'to', 'target', 'destination', 'callee', 'target_application'],
  },
  {
    key: 'environment',
    label: 'Môi trường (environment)',
    required: true,
    aliases: ['env', 'moi_truong'],
    options: ENV_OPTIONS,
    valueAliases: ENV_VALUE_ALIASES,
  },
  {
    key: 'connection_type',
    label: 'Loại kết nối (connection_type)',
    aliases: ['type', 'conn_type', 'protocol'],
    options: CONN_TYPE_OPTIONS,
    valueAliases: CONN_TYPE_ALIASES,
  },
  {
    key: 'target_port',
    label: 'Port đích (target_port)',
    aliases: ['port', 'dst_port', 'target_port_number'],
  },
  {
    key: 'description',
    label: 'Mô tả (description)',
    aliases: ['desc', 'notes', 'ghi_chu', 'mo_ta'],
  },
];

const CONN_TARGET_BY_KEY: Record<string, TargetField> = CONN_TARGETS.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {} as Record<string, TargetField>,
);

export default function ConnectionUploadPage() {
  const { message } = App.useApp();
  const [step, setStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [valueMappings, setValueMappings] = useState<ValueMappings>({});
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [editedRows, setEditedRows] = useState<Record<number, Record<string, any>>>({});
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const handleReset = () => {
    setStep(0);
    setFileList([]);
    setCsvColumns([]);
    setCsvRows([]);
    setMapping({});
    setValueMappings({});
    setPreview(null);
    setResult(null);
    setEditedRows({});
    setShowOnlyErrors(false);
  };

  const handleCellEdit = (rowNum: number, colKey: string, value: any) => {
    setEditedRows((prev) => ({
      ...prev,
      [rowNum]: { ...(prev[rowNum] ?? {}), [colKey]: value },
    }));
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((r) =>
          r.row === rowNum ? { ...r, data: { ...r.data, [colKey]: value } } : r,
        ),
      };
    });
  };

  const buildFormData = (withEdits = false) => {
    const mappedRows = applyAllMappings(csvRows, mapping, valueMappings);
    const finalRows = withEdits
      ? mappedRows.map((row, idx) => {
          const edits = editedRows[idx + 1];
          return edits ? { ...row, ...edits } : row;
        })
      : mappedRows;
    const csvString = Papa.unparse(finalRows);
    const blob = new Blob([csvString], { type: 'text/csv' });
    const form = new FormData();
    form.append('file', new File([blob], 'mapped.csv', { type: 'text/csv' }));
    return form;
  };

  const handleParseFile = () => {
    const file = fileList[0]?.originFileObj as File | undefined;
    if (!file) {
      message.error('Vui lòng chọn file để tải lên.');
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        const cols = (results.meta.fields ?? []).filter(Boolean) as string[];
        if (!cols.length) {
          message.error('Không đọc được tiêu đề cột từ file CSV.');
          return;
        }
        setCsvColumns(cols);
        setCsvRows(rows);
        setMapping({});
        setStep(1);
      },
      error: (err) => message.error(`Không thể đọc file: ${err.message}`),
    });
  };

  const handleUploadPreview = async () => {
    const missingRequired = CONN_TARGETS.filter((t) => t.required).filter(
      (t) => !Object.values(mapping).includes(t.key),
    );
    if (missingRequired.length) {
      message.error(`Thiếu ánh xạ cho: ${missingRequired.map((t) => t.label).join(', ')}`);
      return;
    }
    setLoading(true);
    try {
      const form = buildFormData();
      const { data } = await apiClient.post('/import/preview?type=connection', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data.data ?? data);
      setStep(2);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error?.message ||
        'Xem trước thất bại. Vui lòng kiểm tra định dạng file.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRevalidate = async () => {
    setLoading(true);
    try {
      const form = buildFormData(true);
      const { data } = await apiClient.post('/import/preview?type=connection', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data.data ?? data);
      setEditedRows({});
      message.success('Đã kiểm tra lại');
    } catch (err: unknown) {
      message.error((err as any)?.response?.data?.error?.message || 'Kiểm tra lại thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!preview?.session_id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/import/execute', {
        session_id: preview.session_id,
      });
      setResult(data.data ?? data);
      setStep(3);
    } catch (err: unknown) {
      message.error((err as any)?.response?.data?.error?.message || 'Import thất bại.');
    } finally {
      setLoading(false);
    }
  };

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
      width: 60,
      fixed: 'left' as const,
      render: (v: number, r: ImportRow) => (
        <span>
          {r.valid ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          )}{' '}
          {v}
        </span>
      ),
    },
    ...previewColumnKeys.map((col) => ({
      title: col.replace(/_/g, ' ').toUpperCase(),
      dataIndex: ['data', col],
      width: 180,
      render: (_: unknown, r: ImportRow) => {
        const value = r.data[col];
        const isEdited = editedRows[r.row]?.[col] !== undefined;
        const target = CONN_TARGET_BY_KEY[col];
        const displayStr = value != null ? String(value) : '';

        if (target?.options) {
          const normalized = target.valueAliases?.[displayStr.toLowerCase()] ?? displayStr;
          const validValues = target.options.map((o) => o.value);
          const currentValue = validValues.includes(normalized) ? normalized : undefined;

          return (
            <Tooltip title={isEdited ? 'Đã chỉnh sửa — nhấn Kiểm tra lại' : 'Chọn giá trị hợp lệ'}>
              <Select
                size="small"
                value={currentValue}
                placeholder={displayStr || '—'}
                style={{ width: '100%', background: isEdited ? '#fffbe6' : undefined }}
                options={target.options}
                onChange={(v) => {
                  if (v !== displayStr) handleCellEdit(r.row, col, v);
                }}
              />
            </Tooltip>
          );
        }

        return (
          <Tooltip title={isEdited ? 'Đã chỉnh sửa — nhấn Kiểm tra lại để validate' : 'Nhấn để chỉnh sửa'}>
            <Input
              size="small"
              defaultValue={displayStr}
              placeholder="—"
              style={{
                background: isEdited ? '#fffbe6' : undefined,
                borderColor: isEdited ? '#faad14' : undefined,
              }}
              onBlur={(e) => {
                const newValue = e.target.value;
                if (newValue !== displayStr) handleCellEdit(r.row, col, newValue);
              }}
              onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
            />
          </Tooltip>
        );
      },
    })),
    {
      title: 'Lỗi',
      dataIndex: 'errors',
      width: 220,
      fixed: 'right' as const,
      render: (errors: string[]) =>
        errors.length ? (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {errors.map((e, i) => (
              <li key={i} style={{ color: '#ff4d4f', fontSize: 12 }}>
                {e}
              </li>
            ))}
          </ul>
        ) : (
          <Tag color="green">Hợp lệ</Tag>
        ),
    },
  ];

  const filteredPreviewRows = preview
    ? showOnlyErrors
      ? preview.rows.filter((r) => !r.valid)
      : preview.rows
    : [];
  const hasEdits = Object.keys(editedRows).length > 0;

  return (
    <div className="p-6">
      <PageHeader title="Upload Connection" helpKey="connection" />

      <Card>
        <Steps
          current={step}
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Tải file lên' },
            { title: 'Ánh xạ cột' },
            { title: 'Xem trước & Kiểm tra' },
            { title: 'Hoàn tất Import' },
          ]}
        />

        {step === 0 && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Alert
              type="info"
              showIcon
              message="Import kết nối App-to-App"
              description={
                <span>
                  Bắt buộc: <b>source_app</b> (mã ứng dụng nguồn), <b>target_app</b> (mã ứng dụng đích), <b>environment</b> (DEV/UAT/PROD).
                  <br />
                  Tùy chọn: <b>connection_type</b> (HTTP/HTTPS/TCP/GRPC/AMQP/KAFKA/DATABASE, mặc định HTTP),{' '}
                  <b>target_port</b> (port số nguyên trên app đích — để liên kết topology),{' '}
                  <b>description</b>.
                  <br />
                  <b>Lưu ý:</b> Kết nối đã tồn tại (cùng source + target + env + type) sẽ được cập nhật thay vì tạo mới.
                  Nếu <b>target_port</b> không tìm thấy trong database, kết nối vẫn được tạo (không fail row).
                </span>
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
              <p className="ant-upload-text">
                Nhấn hoặc kéo thả file CSV hoặc Excel (.xlsx) vào đây
              </p>
              <p className="ant-upload-hint">
                Dung lượng tối đa: 20MB. Dòng đầu tiên phải là tiêu đề cột.
              </p>
            </Dragger>

            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button
                type="primary"
                onClick={handleParseFile}
                disabled={!fileList.length}
              >
                Tiếp theo: Ánh xạ cột
              </Button>
            </Space>
          </Space>
        )}

        {step === 1 && csvColumns.length > 0 && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Alert
              type="info"
              showIcon
              message="Ánh xạ cột CSV tới trường kết nối"
              description="Cột có dấu * là bắt buộc. Hệ thống tự động nhận dạng tên cột phổ biến (from_app, to_app, env, type...)."
            />
            <ColumnMapper
              csvColumns={csvColumns}
              targets={CONN_TARGETS}
              value={mapping}
              onChange={setMapping}
              previewRows={csvRows}
            />

            <div>
              <h4 style={{ marginTop: 8, marginBottom: 8 }}>Ánh xạ giá trị (Value Mapping)</h4>
              <ValueMapper
                mapping={mapping}
                targets={CONN_TARGETS}
                csvRows={csvRows}
                value={valueMappings}
                onChange={setValueMappings}
              />
            </div>

            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setStep(0)}>Quay lại</Button>
              <Button type="primary" loading={loading} onClick={handleUploadPreview}>
                Tiếp theo: Xem trước
              </Button>
            </Space>
          </Space>
        )}

        {step === 2 && preview && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Tổng số dòng" value={preview.total} />
              </Col>
              <Col span={8}>
                <Statistic title="Hợp lệ" value={preview.valid} valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Không hợp lệ"
                  value={preview.invalid}
                  valueStyle={{ color: preview.invalid > 0 ? '#ff4d4f' : undefined }}
                />
              </Col>
            </Row>
            {preview.invalid > 0 && (
              <Alert
                type="warning"
                showIcon
                message={`${preview.invalid} dòng có lỗi. Nhấn ô để chỉnh sửa, sau đó bấm "Kiểm tra lại".`}
              />
            )}
            <Alert
              type="info"
              showIcon
              message="Kết nối đã tồn tại (source + target + env + type) sẽ được cập nhật thay vì tạo mới. target_port_id sẽ được resolve lúc execute."
            />

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Switch
                  checked={showOnlyErrors}
                  onChange={setShowOnlyErrors}
                  checkedChildren="Chỉ lỗi"
                  unCheckedChildren="Tất cả"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Hiển thị {filteredPreviewRows.length}/{preview.rows.length} dòng
                </Text>
              </Space>
              <Button
                onClick={handleRevalidate}
                loading={loading}
                disabled={!hasEdits}
                type={hasEdits ? 'primary' : 'default'}
                ghost={hasEdits}
              >
                Kiểm tra lại {hasEdits ? `(${Object.keys(editedRows).length} dòng đã sửa)` : ''}
              </Button>
            </Space>

            <Table
              size="small"
              columns={previewColumns}
              dataSource={filteredPreviewRows}
              rowKey="row"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 'max-content' }}
              rowClassName={(r: ImportRow) => (r.valid ? '' : 'ant-table-row-error')}
            />
            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setStep(1)}>Quay lại</Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleExecute}
                disabled={!preview || preview.valid === 0 || hasEdits}
              >
                Nhập {preview.valid} kết nối hợp lệ
              </Button>
            </Space>
          </Space>
        )}

        {step === 3 && result && (() => {
          const { summary, errors } = result;
          const allSuccess = summary.failed === 0;
          return (
            <div>
              <Result
                status={summary.succeeded > 0 ? 'success' : 'warning'}
                title={allSuccess ? 'Import hoàn tất!' : `Import hoàn tất — ${summary.failed} kết nối thất bại`}
                subTitle={
                  allSuccess
                    ? 'Tất cả kết nối đã được tạo/cập nhật thành công.'
                    : `${summary.failed} dòng không được import — Xem chi tiết lỗi bên dưới.`
                }
                extra={<Button type="primary" onClick={handleReset}>Nhập thêm</Button>}
              />
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic title="Tổng dòng xử lý" value={summary.total} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center', border: '1px solid #b7eb8f', background: '#f6ffed' }}>
                    <Statistic title="Thành công" value={summary.succeeded} valueStyle={{ color: '#52c41a' }} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center', ...(summary.failed > 0 ? { border: '1px solid #ffccc7', background: '#fff2f0' } : {}) }}>
                    <Statistic title="Thất bại" value={summary.failed} valueStyle={{ color: summary.failed > 0 ? '#ff4d4f' : '#8c8c8c' }} />
                  </Card>
                </Col>
              </Row>
              {errors.length > 0 && (
                <>
                  <Divider orientation="left" orientationMargin={0} style={{ fontSize: 13, color: '#ff4d4f' }}>
                    Dòng thất bại ({errors.length})
                  </Divider>
                  <Table
                    size="small"
                    dataSource={errors}
                    rowKey="row"
                    columns={[
                      { title: '#', dataIndex: 'row', width: 60 },
                      { title: 'Source App', dataIndex: 'name', width: 160 },
                      { title: 'Lý do', dataIndex: 'reason', render: (v: string) => <Text type="danger">{v}</Text> },
                    ]}
                    pagination={false}
                  />
                </>
              )}
            </div>
          );
        })()}
      </Card>
    </div>
  );
}
