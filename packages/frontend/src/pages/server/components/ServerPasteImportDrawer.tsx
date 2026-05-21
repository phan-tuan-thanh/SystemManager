import { useState } from 'react';
import {
  Drawer,
  Steps,
  Input,
  Button,
  Space,
  Alert,
  Typography,
  App,
  Tag,
  Divider,
  Table,
  Statistic,
  Row,
  Col,
  Card,
  Select,
  Tooltip,
  Result,
  Descriptions,
  Badge,
  Switch,
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import Papa from 'papaparse';
import apiClient from '../../../api/client';
import ColumnMapper, {
  autoDetect,
  applyAllMappings,
  type TargetField,
  type ColumnMapping,
} from '../../../components/common/ColumnMapper';
import ValueMapper, { type ValueMappings } from '../../../components/common/ValueMapper';

const { TextArea } = Input;
const { Text } = Typography;

// ── Field definitions (same as infra-upload, extended with ip) ──────────────

const ENV_OPTIONS = [
  { value: 'DEV', label: 'DEV' },
  { value: 'UAT', label: 'UAT' },
  { value: 'PROD', label: 'PROD' },
];

const SERVER_TARGETS: TargetField[] = [
  { key: 'ip', label: 'Địa chỉ IP *', required: true, aliases: ['ip_address', 'private_ip', 'server_ip', 'dia_chi_ip'] },
  { key: 'name', label: 'Tên server *', required: true, aliases: ['server_name', 'ten', 'ten_server'] },
  { key: 'hostname', label: 'Hostname', aliases: ['host'] },
  { key: 'code', label: 'Mã server', aliases: ['server_code', 'ma'] },
  { key: 'system', label: 'Mã hệ thống', aliases: ['he_thong', 'system_code'] },
  { key: 'system_name', label: 'Tên hệ thống', aliases: ['ten_he_thong'] },
  { key: 'environment', label: 'Môi trường', aliases: ['env', 'moi_truong'],
    options: ENV_OPTIONS,
    valueAliases: { dev: 'DEV', development: 'DEV', uat: 'UAT', staging: 'UAT', prod: 'PROD', production: 'PROD', live: 'PROD' },
  },
  { key: 'site', label: 'Site', aliases: ['trung_tam'],
    options: [{ value: 'DC', label: 'DC' }, { value: 'DR', label: 'DR' }, { value: 'TEST', label: 'TEST' }],
    valueAliases: { dc: 'DC', datacenter: 'DC', dr: 'DR', test: 'TEST' },
  },
  { key: 'os', label: 'Hệ điều hành', aliases: ['operating_system', 'he_dieu_hanh', 'os_name'] },
  { key: 'cpu', label: 'CPU (cores)', aliases: ['cpu_cores', 'cores', 'nhan_cpu'] },
  { key: 'ram', label: 'RAM (GB)', aliases: ['ram_gb', 'memory', 'bo_nho'] },
  { key: 'total_storage_gb', label: 'Lưu trữ (GB)', aliases: ['storage', 'storage_gb', 'total_storage', 'dung_luong'] },
  { key: 'purpose', label: 'Mục đích', aliases: ['muc_dich', 'role'],
    options: [
      { value: 'APP_SERVER', label: 'App Server' }, { value: 'DB_SERVER', label: 'DB Server' },
      { value: 'PROXY', label: 'Proxy' }, { value: 'LOAD_BALANCER', label: 'Load Balancer' },
      { value: 'CACHE', label: 'Cache' }, { value: 'MESSAGE_QUEUE', label: 'Message Queue' },
      { value: 'OTHER', label: 'Khác' },
    ],
  },
  { key: 'status', label: 'Trạng thái', aliases: ['trang_thai'],
    options: [
      { value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Không hoạt động' },
      { value: 'MAINTENANCE', label: 'Bảo trì' },
    ],
    valueAliases: { active: 'ACTIVE', inactive: 'INACTIVE', maintenance: 'MAINTENANCE' },
  },
  { key: 'infra_type', label: 'Loại hạ tầng', aliases: ['infra', 'loai_ha_tang'],
    options: [
      { value: 'VIRTUAL_MACHINE', label: 'Virtual Machine' }, { value: 'PHYSICAL_SERVER', label: 'Physical Server' },
      { value: 'CONTAINER', label: 'Container' }, { value: 'CLOUD_INSTANCE', label: 'Cloud Instance' },
    ],
    valueAliases: { vm: 'VIRTUAL_MACHINE', virtual: 'VIRTUAL_MACHINE', physical: 'PHYSICAL_SERVER', container: 'CONTAINER', cloud: 'CLOUD_INSTANCE' },
  },
  { key: 'description', label: 'Mô tả', aliases: ['desc', 'mo_ta', 'ghi_chu'] },
];

const SERVER_TARGET_BY_KEY = SERVER_TARGETS.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {} as Record<string, TargetField>,
);

// ── Types ────────────────────────────────────────────────────────────────────

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
  os_resolution?: Array<{ raw: string; suggested_name?: string; is_new: boolean }>;
}

interface ImportResult {
  summary: { total: number; succeeded: number; failed: number };
  breakdown: {
    systems: { created: number; updated: number };
    servers: { created: number; updated: number };
    os_apps: { created: number; reused: number };
    hardware: { created: number; updated: number };
  };
  errors: Array<{ row: number; name: string; ip: string; reason: string }>;
}

// ── Parse pasted text (CSV, TSV, JSON) ──────────────────────────────────────

function parsePasteText(text: string): { rows: Record<string, string>[]; columns: string[] } | { error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { error: 'Nội dung trống.' };

  // JSON array
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) return { error: 'JSON phải là array.' };
      if (!parsed.length) return { error: 'JSON array rỗng.' };
      const columns = Object.keys(parsed[0]);
      const rows = parsed.map((item: Record<string, unknown>) =>
        Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v == null ? '' : String(v)])),
      );
      return { rows, columns };
    } catch {
      return { error: 'JSON không hợp lệ.' };
    }
  }

  // Auto-detect TSV (Excel copy-paste) vs CSV
  const firstLine = trimmed.split('\n')[0];
  const tabCount = (firstLine.match(/\t/g) ?? []).length;
  const commaCount = (firstLine.match(/,/g) ?? []).length;

  let parseText = trimmed;
  if (tabCount > 0 && tabCount >= commaCount) {
    // Convert TSV → CSV
    parseText = trimmed
      .split('\n')
      .map((line) =>
        line
          .split('\t')
          .map((cell) => (cell.includes(',') || cell.includes('"') || cell.includes('\n') ? `"${cell.replace(/"/g, '""')}"` : cell))
          .join(','),
      )
      .join('\n');
  }

  const result = Papa.parse<Record<string, string>>(parseText, { header: true, skipEmptyLines: true });
  if (result.errors.length > 0 && result.data.length === 0) {
    return { error: `Lỗi parse: ${result.errors[0].message}` };
  }
  return { rows: result.data, columns: result.meta.fields ?? [] };
}

// ── Main Component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'paste' | 'map-columns' | 'map-values' | 'preview' | 'result';

export default function ServerPasteImportDrawer({ open, onClose, onSuccess }: Props) {
  const { message, modal } = App.useApp();

  const [step, setStep] = useState<Step>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [colMapping, setColMapping] = useState<ColumnMapping>({});
  const [valMappings, setValMappings] = useState<ValueMappings>({});
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [osMappings, setOsMappings] = useState<Record<string, string>>({});
  const [osCatalog, setOsCatalog] = useState<Array<{ id: string; name: string }>>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [editedRows, setEditedRows] = useState<Record<number, Record<string, unknown>>>({});

  const hasValueFields = SERVER_TARGETS.some((f) => f.options && f.options.length > 0);

  // ── Reset ────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep('paste');
    setPasteText('');
    setParseError(null);
    setCsvRows([]);
    setCsvColumns([]);
    setColMapping({});
    setValMappings({});
    setPreviewResult(null);
    setOsMappings({});
    setImportResult(null);
    setEditedRows({});
    setShowOnlyErrors(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const buildMappedCsv = (): string => {
    const mapped = applyAllMappings(csvRows, colMapping, valMappings);
    const withEdits = mapped.map((row, idx) => {
      const edits = editedRows[idx + 1];
      return edits ? { ...row, ...edits } : row;
    });
    return Papa.unparse(withEdits);
  };

  const postToPreview = async (csvString: string): Promise<PreviewResult> => {
    const blob = new Blob([csvString], { type: 'text/csv' });
    const form = new FormData();
    form.append('file', new File([blob], 'paste.csv', { type: 'text/csv' }));
    const { data } = await apiClient.post('/import/preview?type=server', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data ?? data;
  };

  const fetchOsCatalog = async () => {
    try {
      const res = await apiClient.get('/applications', { params: { application_type: 'SYSTEM', sw_type: 'OS', limit: 100 } });
      setOsCatalog(res.data.data ?? res.data);
    } catch { /* non-critical */ }
  };

  // ── Step handlers ────────────────────────────────────────────────────────

  const handleParse = () => {
    const parsed = parsePasteText(pasteText);
    if ('error' in parsed) {
      setParseError(parsed.error);
      return;
    }
    setParseError(null);
    setCsvRows(parsed.rows);
    setCsvColumns(parsed.columns);
    setColMapping(autoDetect(parsed.columns, SERVER_TARGETS));
    setStep('map-columns');
  };

  const handleAfterColumnMap = () => {
    if (hasValueFields) setStep('map-values');
    else goToPreview();
  };

  const goToPreview = async () => {
    setLoading(true);
    try {
      const csv = buildMappedCsv();
      const result = await postToPreview(csv);
      setPreviewResult(result);
      await fetchOsCatalog();
      setEditedRows({});
      setStep('preview');
    } catch (e: unknown) {
      message.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Không thể preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevalidate = async () => {
    setLoading(true);
    try {
      const csv = buildMappedCsv();
      const result = await postToPreview(csv);
      setPreviewResult(result);
      setEditedRows({});
    } catch {
      message.error('Kiểm tra lại thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCellEdit = (rowNum: number, colKey: string, value: unknown) => {
    setEditedRows((prev) => ({ ...prev, [rowNum]: { ...(prev[rowNum] ?? {}), [colKey]: value } }));
    setPreviewResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((r) =>
          r.row === rowNum
            ? { ...r, data: { ...r.data, [colKey]: value as string | number | undefined } }
            : r,
        ),
      };
    });
  };

  const handleExecute = async () => {
    if (!previewResult?.session_id) return;
    modal.confirm({
      title: 'Xác nhận tạo server',
      content: `Tạo ${previewResult.valid} server từ dữ liệu đã dán?`,
      okText: `Tạo ${previewResult.valid} server`,
      cancelText: 'Huỷ',
      onOk: async () => {
        setLoading(true);
        try {
          const { data } = await apiClient.post('/import/execute', {
            session_id: previewResult.session_id,
            os_resolution: osMappings,
          });
          const result: ImportResult = data.data ?? data;
          setImportResult(result);
          setStep('result');
          if (result.summary.failed === 0) {
            message.success(`Tạo thành công ${result.summary.succeeded} server`);
          }
          onSuccess?.();
        } catch {
          message.error('Tạo server thất bại.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ── Quick import (skip manual mapping if auto-detect succeeds) ────────────

  const handleQuickImport = async () => {
    const parsed = parsePasteText(pasteText);
    if ('error' in parsed) { setParseError(parsed.error); return; }

    const auto = autoDetect(parsed.columns, SERVER_TARGETS);
    const mapped = new Set(Object.values(auto).filter(Boolean));
    const missing = SERVER_TARGETS.filter((t) => t.required && !mapped.has(t.key));

    if (missing.length > 0) {
      message.warning(`Không nhận diện được cột: ${missing.map((t) => t.label).join(', ')}. Vui lòng ánh xạ thủ công.`);
      setCsvRows(parsed.rows);
      setCsvColumns(parsed.columns);
      setColMapping(auto);
      setParseError(null);
      setStep('map-columns');
      return;
    }

    setLoading(true);
    setCsvRows(parsed.rows);
    setCsvColumns(parsed.columns);
    setColMapping(auto);
    setParseError(null);
    try {
      const mappedRows = applyAllMappings(parsed.rows, auto, {});
      const csv = Papa.unparse(mappedRows);
      const result = await postToPreview(csv);
      await fetchOsCatalog();
      setPreviewResult(result);
      setStep('preview');
    } catch {
      message.error('Không thể preview dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  const mergedCols = previewResult
    ? Array.from(new Set([...previewResult.columns, ...previewResult.rows.flatMap((r) => Object.keys(r.data))]))
    : [];

  const filteredRows = previewResult
    ? showOnlyErrors
      ? previewResult.rows.filter((r) => !r.valid)
      : previewResult.rows
    : [];

  const hasEdits = Object.keys(editedRows).length > 0;
  const hasErrors = (previewResult?.invalid ?? 0) > 0;

  const stepIndex: Record<Step, number> = {
    paste: 0,
    'map-columns': 1,
    'map-values': hasValueFields ? 2 : 1,
    preview: hasValueFields ? 3 : 2,
    result: hasValueFields ? 4 : 3,
  };

  const stepItems = [
    { title: 'Dán dữ liệu' },
    { title: 'Ánh xạ cột' },
    ...(hasValueFields ? [{ title: 'Ánh xạ giá trị' }] : []),
    { title: 'Kiểm tra' },
    { title: 'Kết quả' },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Drawer
      title="Dán & Tạo Server — đầy đủ hệ thống / phần cứng / OS"
      open={open}
      onClose={handleClose}
      width={960}
      destroyOnClose
    >
      <Steps
        size="small"
        current={stepIndex[step]}
        items={stepItems}
        style={{ marginBottom: 24 }}
      />

      {/* ── Step: Paste ─────────────────────────────────────────────────── */}
      {step === 'paste' && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type="info"
            showIcon
            icon={<FileTextOutlined />}
            message="Dán dữ liệu server từ CSV, Excel (Tab-separated) hoặc JSON array"
            description={
              <div style={{ marginTop: 4 }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>Hỗ trợ:</strong>{' '}
                  <Tag>CSV</Tag>
                  <Tag>TSV (Copy từ Excel)</Tag>
                  <Tag>JSON array</Tag>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>Cột nhận diện:</strong>{' '}
                  {SERVER_TARGETS.filter((t) => t.required).map((t) => (
                    <Tag key={t.key} color="blue">{t.key} *</Tag>
                  ))}
                  {SERVER_TARGETS.filter((t) => !t.required).map((t) => (
                    <Tag key={t.key}>{t.key}</Tag>
                  ))}
                </div>
                <a href="/templates/server_template.csv" download="server_template.csv">
                  <Button size="small" icon={<DownloadOutlined />}>Tải file mẫu CSV</Button>
                </a>
              </div>
            }
          />

          <TextArea
            rows={14}
            placeholder={`Dán CSV / TSV (Excel) / JSON array vào đây\n\nVí dụ CSV:\nip,name,hostname,environment,os,cpu,ram,total_storage_gb,purpose\n192.168.10.10,Web Server 01,web-srv-01,PROD,Ubuntu 22.04 LTS,8,32,500,APP_SERVER\n\nVí dụ JSON:\n[{"ip":"192.168.10.10","name":"Web Server 01","os":"Ubuntu 22.04 LTS","cpu":8,"ram":32}]`}
            value={pasteText}
            onChange={(e) => { setPasteText(e.target.value); setParseError(null); }}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />

          {parseError && <Alert type="error" showIcon message={parseError} />}

          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={loading}
              disabled={!pasteText.trim()}
              onClick={handleQuickImport}
            >
              Nhập nhanh
            </Button>
            <Button
              disabled={!pasteText.trim()}
              onClick={handleParse}
            >
              Ánh xạ cột thủ công
            </Button>
            <Button onClick={handleClose}>Huỷ</Button>
          </Space>
        </Space>
      )}

      {/* ── Step: Map Columns ───────────────────────────────────────────── */}
      {step === 'map-columns' && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space>
            <Tag color="blue">{csvRows.length} dòng</Tag>
            <Tag>{csvColumns.length} cột phát hiện</Tag>
          </Space>
          <ColumnMapper
            csvColumns={csvColumns}
            targets={SERVER_TARGETS}
            value={colMapping}
            onChange={setColMapping}
            previewRows={csvRows.slice(0, 3)}
          />
          <Divider />
          <Space>
            <Button type="primary" onClick={handleAfterColumnMap}>
              {hasValueFields ? 'Ánh xạ giá trị →' : 'Kiểm tra →'}
            </Button>
            <Button onClick={() => setStep('paste')}>← Quay lại</Button>
          </Space>
        </Space>
      )}

      {/* ── Step: Map Values ────────────────────────────────────────────── */}
      {step === 'map-values' && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <ValueMapper
            mapping={colMapping}
            targets={SERVER_TARGETS}
            csvRows={csvRows}
            value={valMappings}
            onChange={setValMappings}
          />
          <Divider />
          <Space>
            <Button type="primary" loading={loading} onClick={goToPreview}>Kiểm tra →</Button>
            <Button onClick={() => setStep('map-columns')}>← Quay lại</Button>
          </Space>
        </Space>
      )}

      {/* ── Step: Preview ───────────────────────────────────────────────── */}
      {step === 'preview' && previewResult && (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small"><Statistic title="Tổng dòng" value={previewResult.total} /></Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="Hợp lệ" value={previewResult.valid} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={hasErrors ? { border: '1px solid #ff4d4f', background: '#fff2f0' } : undefined}>
                <Statistic title="Lỗi" value={previewResult.invalid} valueStyle={{ color: hasErrors ? '#ff4d4f' : '#8c8c8c' }} />
              </Card>
            </Col>
          </Row>

          {hasErrors && (
            <Alert
              type="warning"
              showIcon
              message={`${previewResult.invalid} dòng có lỗi. Nhấn ô để chỉnh sửa, sau đó bấm "Kiểm tra lại".`}
            />
          )}

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Switch
                size="small"
                checked={showOnlyErrors}
                onChange={setShowOnlyErrors}
                disabled={!hasErrors}
              />
              <Text type="secondary">Chỉ hiện lỗi ({previewResult.invalid})</Text>
            </Space>
            <Button
              size="small"
              loading={loading}
              disabled={!hasEdits}
              type={hasEdits ? 'primary' : 'default'}
              ghost={hasEdits}
              onClick={handleRevalidate}
            >
              Kiểm tra lại{hasEdits ? ` (${Object.keys(editedRows).length} dòng sửa)` : ''}
            </Button>
          </Space>

          <style>{`.paste-row-error td { background: #fff2f0 !important; }`}</style>
          <Table
            size="small"
            dataSource={filteredRows}
            rowKey="row"
            pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (t, r) => `${r[0]}–${r[1]} / ${t}` }}
            scroll={{ x: 'max-content' }}
            rowClassName={(r) => (r.valid ? '' : 'paste-row-error')}
            columns={[
              {
                title: '#',
                dataIndex: 'row',
                width: 60,
                fixed: 'left' as const,
                render: (v: number, r: ImportRow) => (
                  <Tooltip title={r.valid ? 'Hợp lệ' : r.errors.join('; ')}>
                    <span>
                      {r.valid
                        ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      }{' '}{v}
                    </span>
                  </Tooltip>
                ),
              },
              ...mergedCols.map((col) => ({
                title: col.replace(/_/g, ' ').toUpperCase(),
                dataIndex: ['data', col],
                width: 150,
                render: (_: unknown, r: ImportRow) => {
                  const value = r.data[col];
                  const isEdited = editedRows[r.row]?.[col] !== undefined;
                  const target = SERVER_TARGET_BY_KEY[col];
                  const displayStr = value != null ? String(value) : '';

                  if (target?.options) {
                    const normalized = target.valueAliases?.[displayStr.toLowerCase()] ?? displayStr;
                    const valid = target.options.map((o) => o.value);
                    return (
                      <Select
                        size="small"
                        value={valid.includes(normalized) ? normalized : undefined}
                        placeholder={displayStr || '—'}
                        style={{ width: '100%', background: isEdited ? '#fffbe6' : undefined }}
                        options={target.options}
                        onChange={(v) => handleCellEdit(r.row, col, v)}
                      />
                    );
                  }

                  return (
                    <Input
                      size="small"
                      defaultValue={displayStr}
                      style={{ background: isEdited ? '#fffbe6' : undefined }}
                      onBlur={(e) => {
                        if (e.target.value !== displayStr) handleCellEdit(r.row, col, e.target.value);
                      }}
                    />
                  );
                },
              })),
              {
                title: 'Lỗi',
                dataIndex: 'errors',
                width: 200,
                fixed: 'right' as const,
                render: (errors: string[]) =>
                  errors.length ? (
                    <Tooltip title={errors.join('; ')}>
                      <Tag color="error" icon={<CloseCircleOutlined />} style={{ cursor: 'help' }}>
                        {errors[0].slice(0, 30)}{errors.length > 1 ? ` +${errors.length - 1}` : ''}
                      </Tag>
                    </Tooltip>
                  ) : (
                    <Tag color="success" icon={<CheckCircleOutlined />}>OK</Tag>
                  ),
              },
            ]}
          />

          {/* OS Resolution */}
          {previewResult.os_resolution && previewResult.os_resolution.length > 0 && (
            <div>
              <Alert
                type="warning"
                showIcon
                message="Xác nhận hệ điều hành"
                description="Các OS chưa có trong hệ thống sẽ được tự động tạo mới. Bạn có thể ánh xạ tới OS đã có."
                style={{ marginBottom: 8 }}
              />
              <Table
                size="small"
                pagination={false}
                dataSource={previewResult.os_resolution}
                rowKey="raw"
                columns={[
                  { title: 'OS trong dữ liệu', dataIndex: 'raw' },
                  {
                    title: 'Ánh xạ danh mục OS',
                    render: (_: unknown, r: { raw: string }) => (
                      <Select
                        size="small"
                        allowClear
                        style={{ width: '100%' }}
                        placeholder="Tự động tạo OS mới"
                        value={osMappings[r.raw]}
                        onChange={(v) => setOsMappings((prev) => ({ ...prev, [r.raw]: v }))}
                        options={osCatalog.map((os) => ({ label: os.name, value: os.id }))}
                      />
                    ),
                  },
                ]}
              />
            </div>
          )}

          <Divider />
          <Space>
            <Button onClick={() => setStep(hasValueFields ? 'map-values' : 'map-columns')}>← Quay lại</Button>
            <Button
              type="primary"
              loading={loading}
              disabled={!previewResult.valid || hasEdits}
              onClick={handleExecute}
            >
              Tạo {previewResult.valid} server hợp lệ
            </Button>
          </Space>
        </Space>
      )}

      {/* ── Step: Result ────────────────────────────────────────────────── */}
      {step === 'result' && importResult && (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Result
            status={importResult.summary.failed === 0 ? 'success' : 'warning'}
            title={
              importResult.summary.failed === 0
                ? 'Tạo server thành công!'
                : `Hoàn tất — ${importResult.summary.failed} dòng thất bại`
            }
            subTitle={`${importResult.summary.succeeded} / ${importResult.summary.total} server đã được tạo hoặc cập nhật`}
            extra={[
              <Button key="more" type="primary" onClick={handleReset}>Dán thêm</Button>,
              <Button key="close" onClick={handleClose}>Đóng</Button>,
            ]}
          />

          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label={<><Badge color="#1677ff" /> Hệ thống (InfraSystem)</>} span={2}>
              <Space size="large">
                <span><Tag color="green">Tạo mới</Tag>{importResult.breakdown.systems.created}</span>
                <span><Tag color="blue">Cập nhật</Tag>{importResult.breakdown.systems.updated}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={<><Badge color="#52c41a" /> Server</>} span={2}>
              <Space size="large">
                <span><Tag color="green">Tạo mới</Tag>{importResult.breakdown.servers.created}</span>
                <span><Tag color="blue">Cập nhật</Tag>{importResult.breakdown.servers.updated}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={<><Badge color="#fa8c16" /> Hệ điều hành (OS)</>} span={2}>
              <Space size="large">
                <span><Tag color="green">Tạo mới</Tag>{importResult.breakdown.os_apps.created}</span>
                <span><Tag color="default">Dùng lại</Tag>{importResult.breakdown.os_apps.reused}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={<><Badge color="#722ed1" /> Phần cứng (CPU/RAM/HDD)</>} span={2}>
              <Space size="large">
                <span><Tag color="green">Tạo mới</Tag>{importResult.breakdown.hardware.created}</span>
                <span><Tag color="blue">Cập nhật</Tag>{importResult.breakdown.hardware.updated}</span>
              </Space>
            </Descriptions.Item>
          </Descriptions>

          {importResult.errors.length > 0 && (
            <Table
              size="small"
              title={() => <Text type="danger">Dòng thất bại ({importResult.errors.length})</Text>}
              dataSource={importResult.errors}
              rowKey="row"
              pagination={false}
              columns={[
                { title: '#', dataIndex: 'row', width: 50 },
                { title: 'Tên', dataIndex: 'name', ellipsis: true },
                { title: 'IP', dataIndex: 'ip', width: 130 },
                { title: 'Lý do', dataIndex: 'reason', render: (r: string) => <Text type="danger" style={{ fontSize: 12 }}>{r}</Text> },
              ]}
            />
          )}
        </Space>
      )}
    </Drawer>
  );
}
