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
  imported: number;
  skipped: number;
  errors: string[];
}

const APP_TYPE_OPTIONS = [
  { label: 'BUSINESS - Ứng dụng nghiệp vụ', value: 'BUSINESS' },
  { label: 'SYSTEM - Phần mềm hệ thống', value: 'SYSTEM' },
];
const APP_TYPE_VALUE_ALIASES: Record<string, string> = {
  business: 'BUSINESS',
  nghiep_vu: 'BUSINESS',
  'nghiệp_vụ': 'BUSINESS',
  system: 'SYSTEM',
  he_thong: 'SYSTEM',
  'hệ_thống': 'SYSTEM',
};

const APP_TARGETS: TargetField[] = [
  { key: 'code', label: 'Mã ứng dụng (Code)', required: true, aliases: ['app_code', 'application_code', 'ma', 'ma_ung_dung'] },
  { key: 'name', label: 'Tên ứng dụng (Name)', required: true, aliases: ['app_name', 'application_name', 'ten', 'ten_ung_dung'] },
  { key: 'group_code', label: 'Mã nhóm (Group Code)', aliases: ['group', 'nhom', 'nhom_code'] },
  { key: 'version', label: 'Phiên bản (Version)', aliases: ['ver', 'phien_ban'] },
  { key: 'owner_team', label: 'Nhóm phụ trách (Owner Team)', aliases: ['team', 'owner', 'don_vi'] },
  {
    key: 'application_type',
    label: 'Loại ứng dụng (Type)',
    aliases: ['type', 'loai', 'app_type'],
    options: APP_TYPE_OPTIONS,
    valueAliases: APP_TYPE_VALUE_ALIASES,
  },
  { key: 'description', label: 'Mô tả (Description)', aliases: ['desc', 'mo_ta'] },
];

const APP_TARGET_BY_KEY: Record<string, TargetField> = APP_TARGETS.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {} as Record<string, TargetField>,
);

export default function AppUploadPage() {
  const { message } = App.useApp();
  const [step, setStep] = useState(0);
  const [environment, setEnvironment] = useState<string | undefined>(undefined);
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
    // Also reflect in preview.rows so user sees the update immediately
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

  const handleRevalidate = async () => {
    setLoading(true);
    try {
      const mappedRows = applyAllMappings(csvRows, mapping, valueMappings);
      const editedMappedRows = mappedRows.map((row, idx) => {
        const edits = editedRows[idx + 1];
        return edits ? { ...row, ...edits } : row;
      });
      const csvString = Papa.unparse(editedMappedRows);
      const blob = new Blob([csvString], { type: 'text/csv' });
      const mappedFile = new File([blob], 'mapped.csv', { type: 'text/csv' });

      const form = new FormData();
      form.append('file', mappedFile);
      const params = new URLSearchParams({ type: 'application' });
      if (environment) params.set('environment', environment);

      const { data } = await apiClient.post(`/import/preview?${params}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data.data ?? data);
      setEditedRows({});
      message.success('Đã kiểm tra lại');
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error?.message || 'Kiểm tra lại thất bại.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
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
    const missingRequired = APP_TARGETS.filter((t) => t.required).filter(
      (t) => !Object.values(mapping).includes(t.key),
    );
    if (missingRequired.length) {
      message.error(`Thiếu ánh xạ cho: ${missingRequired.map((t) => t.label).join(', ')}`);
      return;
    }
    setLoading(true);
    try {
      // Apply mapping client-side: rename CSV columns to canonical target keys
      const mappedRows = applyAllMappings(csvRows, mapping, valueMappings);
      const csvString = Papa.unparse(mappedRows);
      const blob = new Blob([csvString], { type: 'text/csv' });
      const mappedFile = new File([blob], 'mapped.csv', { type: 'text/csv' });

      const form = new FormData();
      form.append('file', mappedFile);
      const params = new URLSearchParams({ type: 'application' });
      if (environment) params.set('environment', environment);

      const { data } = await apiClient.post(`/import/preview?${params}`, form, {
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
      const msg = (err as any)?.response?.data?.error?.message || 'Import thất bại.';
      message.error(msg);
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
        const target = APP_TARGET_BY_KEY[col];
        const displayStr = value != null ? String(value) : '';

        // Enum field → Select dropdown
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
                if (newValue !== displayStr) {
                  handleCellEdit(r.row, col, newValue);
                }
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
      <PageHeader title="Upload Ứng dụng" helpKey="application" />

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
            <Space wrap>
              <div>
                <Text strong style={{ marginRight: 8 }}>
                  Môi trường (tùy chọn):
                </Text>
                <Select
                  allowClear
                  value={environment}
                  onChange={setEnvironment}
                  style={{ width: 160 }}
                  placeholder="Tất cả"
                  options={[
                    { value: 'DEV', label: 'DEV' },
                    { value: 'UAT', label: 'UAT' },
                    { value: 'PROD', label: 'PROD' },
                  ]}
                />
              </div>
            </Space>

            <Alert
              type="info"
              showIcon
              message="Cột bắt buộc cho Ứng dụng"
              description="Bắt buộc: code, name. Tùy chọn: group_code, version, owner_team, description."
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
              message="Ánh xạ cột CSV tới trường ứng dụng"
              description="Cột có dấu * là bắt buộc. Cột không được ánh xạ sẽ bị bỏ qua khi import."
            />
            <ColumnMapper
              csvColumns={csvColumns}
              targets={APP_TARGETS}
              value={mapping}
              onChange={setMapping}
              previewRows={csvRows}
            />

            <div>
              <h4 style={{ marginTop: 8, marginBottom: 8 }}>Ánh xạ giá trị (Value Mapping)</h4>
              <ValueMapper
                mapping={mapping}
                targets={APP_TARGETS}
                csvRows={csvRows}
                value={valueMappings}
                onChange={setValueMappings}
              />
            </div>

            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setStep(0)}>Quay lại</Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleUploadPreview}
              >
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
                <Statistic
                  title="Hợp lệ"
                  value={preview.valid}
                  valueStyle={{ color: '#52c41a' }}
                />
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

        {step === 3 && result && (
          <Result
            status={result.imported > 0 ? 'success' : 'warning'}
            title={`Hoàn tất: đã nhập ${result.imported}, bỏ qua ${result.skipped}`}
            subTitle={
              result.errors.length > 0
                ? `Phát sinh ${result.errors.length} lỗi trong quá trình nhập dữ liệu.`
                : 'Tất cả các dòng hợp lệ đã được nhập thành công.'
            }
            extra={
              <Space>
                <Button type="primary" onClick={handleReset}>
                  Nhập thêm
                </Button>
                {result.errors.length > 0 && (
                  <Alert
                    type="error"
                    message="Danh sách lỗi"
                    description={
                      <ul style={{ paddingLeft: 16, margin: 0 }}>
                        {result.errors.slice(0, 10).map((e, i) => (
                          <li key={i} style={{ fontSize: 12 }}>
                            {e}
                          </li>
                        ))}
                        {result.errors.length > 10 && (
                          <li>...và {result.errors.length - 10} lỗi khác</li>
                        )}
                      </ul>
                    }
                  />
                )}
              </Space>
            }
          />
        )}
      </Card>
    </div>
  );
}
