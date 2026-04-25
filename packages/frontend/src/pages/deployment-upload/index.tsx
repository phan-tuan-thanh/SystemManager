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
  dev: 'DEV',
  development: 'DEV',
  test: 'DEV',
  uat: 'UAT',
  staging: 'UAT',
  prod: 'PROD',
  production: 'PROD',
  live: 'PROD',
};

const STATUS_OPTIONS = [
  { label: 'RUNNING', value: 'RUNNING' },
  { label: 'STOPPED', value: 'STOPPED' },
  { label: 'DEPRECATED', value: 'DEPRECATED' },
];
const STATUS_VALUE_ALIASES: Record<string, string> = {
  running: 'RUNNING',
  active: 'RUNNING',
  stopped: 'STOPPED',
  inactive: 'STOPPED',
  deprecated: 'DEPRECATED',
};

const DEPLOY_TARGETS: TargetField[] = [
  {
    key: 'application_code',
    label: 'Mã ứng dụng (application_code)',
    required: true,
    aliases: ['app_code', 'application', 'ma_ung_dung'],
  },
  {
    key: 'server_code',
    label: 'Mã server (server_code)',
    required: true,
    aliases: ['server', 'host', 'host_code', 'ma_server'],
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
    key: 'version',
    label: 'Phiên bản (version)',
    required: true,
    aliases: ['ver', 'phien_ban'],
  },
  {
    key: 'status',
    label: 'Trạng thái (status)',
    aliases: ['trang_thai'],
    options: STATUS_OPTIONS,
    valueAliases: STATUS_VALUE_ALIASES,
  },
  {
    key: 'deployer',
    label: 'Người triển khai (deployer)',
    aliases: ['deployed_by', 'team', 'don_vi'],
  },
  {
    key: 'ports',
    label: 'Danh sách port (ports)',
    aliases: ['port', 'port_list', 'cong'],
  },
];

const DEPLOY_TARGET_BY_KEY: Record<string, TargetField> = DEPLOY_TARGETS.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {} as Record<string, TargetField>,
);

export function DeploymentUploadContent() {
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
    const missingRequired = DEPLOY_TARGETS.filter((t) => t.required).filter(
      (t) => !Object.values(mapping).includes(t.key),
    );
    if (missingRequired.length) {
      message.error(`Thiếu ánh xạ cho: ${missingRequired.map((t) => t.label).join(', ')}`);
      return;
    }
    setLoading(true);
    try {
      const form = buildFormData();
      const { data } = await apiClient.post('/import/preview?type=deployment', form, {
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
      const { data } = await apiClient.post('/import/preview?type=deployment', form, {
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
        const target = DEPLOY_TARGET_BY_KEY[col];
        const displayStr = value != null ? String(value) : '';

        if (target?.options) {
          const normalized =
            target.valueAliases?.[displayStr.toLowerCase()] ?? displayStr;
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
              message="Cột bắt buộc cho Deployment"
              description={
                <span>
                  Bắt buộc: <b>application_code</b>, <b>server_code</b>, <b>environment</b> (DEV/UAT/PROD), <b>version</b>.
                  <br />
                  Tùy chọn: <b>status</b> (RUNNING/STOPPED/DEPRECATED), <b>deployer</b>.
                  <br />
                  Cột <b>ports</b> — khai báo 1 hoặc nhiều port, cách nhau bởi dấu cách:{' '}
                  <code>8080-HTTP:rest-api 9092-gRPC:grpc-api</code>
                  <br />
                  Định dạng mỗi port: <code>PORT-PROTOCOL</code> hoặc <code>PORT-PROTOCOL:service_name</code>.
                  <br />
                  <b>Lưu ý:</b> Phải import <b>servers.csv</b> và <b>applications.csv</b> trước. Mỗi port được kiểm tra conflict (cùng server + port + protocol). Deployment tồn tại (cùng app + server + env) sẽ được cập nhật.
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
              message="Ánh xạ cột CSV tới trường deployment"
              description="Cột có dấu * là bắt buộc. Cột không được ánh xạ sẽ bị bỏ qua khi import."
            />
            <ColumnMapper
              csvColumns={csvColumns}
              targets={DEPLOY_TARGETS}
              value={mapping}
              onChange={setMapping}
              previewRows={csvRows}
            />

            <div>
              <h4 style={{ marginTop: 8, marginBottom: 8 }}>Ánh xạ giá trị (Value Mapping)</h4>
              <ValueMapper
                mapping={mapping}
                targets={DEPLOY_TARGETS}
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
              message="Deployment đã tồn tại (cùng app + server + env) sẽ được cập nhật version & status thay vì tạo mới."
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
                Nhập {preview.valid} dòng hợp lệ
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
                title={allSuccess ? 'Import hoàn tất!' : `Import hoàn tất — ${summary.failed} dòng thất bại`}
                subTitle={
                  allSuccess
                    ? 'Tất cả deployment đã được nhập/cập nhật thành công.'
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
                    pagination={{ pageSize: 5, showSizeChanger: false, showTotal: (t) => `${t} lỗi` }}
                    columns={[
                      { title: 'Dòng', dataIndex: 'row', width: 60 },
                      { title: 'Ứng dụng', dataIndex: 'name', width: 200, ellipsis: true },
                      {
                        title: 'Lý do',
                        dataIndex: 'reason',
                        render: (r: string) => (
                          <Tooltip title={r}>
                            <span style={{ color: '#ff4d4f', fontSize: 12 }}>{r}</span>
                          </Tooltip>
                        ),
                      },
                    ]}
                  />
                </>
              )}
            </div>
          );
        })()}
      </Card>
  );
}

export default function DeploymentUploadPage() {
  return (
    <div className="p-6">
      <PageHeader title="Upload Deployment" helpKey="deployment" />
      <DeploymentUploadContent />
    </div>
  );
}
