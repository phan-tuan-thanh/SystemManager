import { useState } from 'react';
import {
  Button,
  Table,
  Space,
  Upload,
  Alert,
  Select,
  Form,
  App,
  Modal,
  Card,
  Tag,
  Statistic,
  Row,
  Col,
  Typography,
  Switch,
  Input,
  Tooltip,
  Descriptions,
  Divider,
  Badge,
} from 'antd';
import {
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import Papa from 'papaparse';
import PageHeader from '../../components/common/PageHeader';
import apiClient from '../../api/client';
import ColumnMapper, {
  applyAllMappings,
  type ColumnMapping,
  type TargetField,
} from '../../components/common/ColumnMapper';
import ValueMapper, { type ValueMappings } from '../../components/common/ValueMapper';

const { Text } = Typography;

const ENV_OPTIONS = [
  { label: 'DEV', value: 'DEV' },
  { label: 'UAT', value: 'UAT' },
  { label: 'PROD', value: 'PROD' },
];
const ENV_VALUE_ALIASES: Record<string, string> = {
  live: 'PROD',
  prod: 'PROD',
  production: 'PROD',
  uat: 'UAT',
  staging: 'UAT',
  dev: 'DEV',
  development: 'DEV',
  test: 'DEV',
};

const SITE_OPTIONS = [
  { label: 'DC - Data Center', value: 'DC' },
  { label: 'DR - Disaster Recovery', value: 'DR' },
  { label: 'TEST - Test Environment', value: 'TEST' },
];
const SITE_VALUE_ALIASES: Record<string, string> = {
  dc: 'DC',
  datacenter: 'DC',
  dr: 'DR',
  test: 'TEST',
  none: 'TEST',
  '': 'TEST',
};

const PURPOSE_OPTIONS = [
  { label: 'APP_SERVER', value: 'APP_SERVER' },
  { label: 'DB_SERVER', value: 'DB_SERVER' },
  { label: 'PROXY', value: 'PROXY' },
  { label: 'LOAD_BALANCER', value: 'LOAD_BALANCER' },
  { label: 'CACHE', value: 'CACHE' },
  { label: 'MESSAGE_QUEUE', value: 'MESSAGE_QUEUE' },
  { label: 'OTHER', value: 'OTHER' },
];

const STATUS_OPTIONS = [
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
  { label: 'MAINTENANCE', value: 'MAINTENANCE' },
];

const INFRA_TYPE_OPTIONS = [
  { label: 'VIRTUAL_MACHINE', value: 'VIRTUAL_MACHINE' },
  { label: 'PHYSICAL_SERVER', value: 'PHYSICAL_SERVER' },
  { label: 'CONTAINER', value: 'CONTAINER' },
  { label: 'CLOUD_INSTANCE', value: 'CLOUD_INSTANCE' },
];

const SERVER_TARGETS: TargetField[] = [
  { key: 'ip', label: 'Địa chỉ IP', required: true, aliases: ['ip_address', 'private_ip', 'server_ip'] },
  { key: 'name', label: 'Tên Server (Name)', required: true, aliases: ['server_name', 'ten', 'ten_server'] },
  { key: 'hostname', label: 'Hostname', aliases: ['host'] },
  { key: 'code', label: 'Mã Server (Code)', aliases: ['server_code', 'ma'] },
  { key: 'system', label: 'Hệ thống (System)', aliases: ['he_thong', 'system_code'] },
  { key: 'system_name', label: 'Tên hệ thống (System Name)', aliases: ['he_thong_name', 'ten_he_thong'] },
  { key: 'description', label: 'Mô tả', aliases: ['desc', 'mo_ta'] },
  { key: 'environment', label: 'Môi trường (Environment)', aliases: ['env', 'moi_truong'], options: ENV_OPTIONS, valueAliases: ENV_VALUE_ALIASES },
  { key: 'site', label: 'Site', aliases: ['trung_tam'], options: SITE_OPTIONS, valueAliases: SITE_VALUE_ALIASES },
  { key: 'os', label: 'Hệ điều hành (OS)', aliases: ['operating_system', 'he_dieu_hanh'] },
  { key: 'cpu', label: 'Số nhân CPU', aliases: ['cpu_cores', 'cores'] },
  { key: 'ram', label: 'RAM (GB)', aliases: ['ram_gb', 'memory'] },
  { key: 'total_storage_gb', label: 'Dung lượng lưu trữ (GB)', aliases: ['total_storage', 'storage', 'storage_gb', 'disk'] },
  { key: 'purpose', label: 'Mục đích (Purpose)', aliases: ['muc_dich', 'role'], options: PURPOSE_OPTIONS },
  { key: 'status', label: 'Trạng thái (Status)', aliases: ['trang_thai'], options: STATUS_OPTIONS },
  { key: 'infra_type', label: 'Loại hạ tầng', aliases: ['infra', 'loai_ha_tang'], options: INFRA_TYPE_OPTIONS },
];

// Build a lookup for quick target-by-key access in the cell renderer
const SERVER_TARGET_BY_KEY: Record<string, TargetField> = SERVER_TARGETS.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {} as Record<string, TargetField>,
);

interface GenericPreviewResult {
  session_id: string;
  type: string;
  total: number;
  valid: number;
  invalid: number;
  rows: Array<{
    row: number;
    data: Record<string, any>;
    errors: string[];
    valid: boolean;
  }>;
  columns: string[];
  os_resolution?: Array<{
    raw: string;
    suggested_app_id?: string;
    suggested_name?: string;
    is_new: boolean;
  }>;
}

export default function ServerUploadPage() {
  const { message } = App.useApp();

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [valueMappings, setValueMappings] = useState<ValueMappings>({});
  const [osMappings, setOsMappings] = useState<Record<string, string>>({});
  const [osCatalog, setOsCatalog] = useState<any[]>([]);

  const fetchOsCatalog = async () => {
    try {
      const res = await apiClient.get('/applications', {
        params: { application_type: 'SYSTEM', sw_type: 'OS', limit: 100 }
      });
      const items = res.data.data ?? res.data;
      setOsCatalog(items);
    } catch (err) {
      console.error('Failed to fetch OS catalog', err);
    }
  };

  // Server import state
  const [serverPreview, setServerPreview] = useState<GenericPreviewResult | null>(null);
  const [serverResult, setServerResult] = useState<{
    summary: { total: number; succeeded: number; failed: number };
    breakdown: {
      systems: { created: number; updated: number };
      servers: { created: number; updated: number };
      os_apps: { created: number; reused: number };
      hardware: { created: number; updated: number };
    };
    errors: Array<{ row: number; name: string; ip: string; reason: string }>;
  } | null>(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverEditedRows, setServerEditedRows] = useState<Record<number, Record<string, any>>>({});
  const [serverShowOnlyErrors, setServerShowOnlyErrors] = useState(false);
  const [previewPageSize, setPreviewPageSize] = useState(20);

  const handleFileSelect = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const cols = (results.meta.fields ?? []).filter(Boolean) as string[];
        setTotalRows(rows.length);
        setAllRows(rows);
        setCsvColumns(cols);
        setMapping({});
        setPreviewData(rows.slice(0, 10));
        setFileToUpload(file);
      },
      error: (err) => {
        message.error(`Không thể đọc file CSV: ${err.message}`);
      },
    });
    return false;
  };

  const handleReset = () => {
    setFileToUpload(null);
    setPreviewData([]);
    setTotalRows(0);
    setCsvColumns([]);
    setAllRows([]);
    setMapping({});
    setValueMappings({});
    setServerPreview(null);
    setServerResult(null);
    setServerEditedRows({});
    setServerShowOnlyErrors(false);
    setPreviewPageSize(20);
  };

  const handleServerCellEdit = (rowNum: number, colKey: string, value: any) => {
    setServerEditedRows((prev) => ({
      ...prev,
      [rowNum]: { ...(prev[rowNum] ?? {}), [colKey]: value },
    }));
    setServerPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((r) =>
          r.row === rowNum ? { ...r, data: { ...r.data, [colKey]: value } } : r,
        ),
      };
    });
  };

  const handleServerRevalidate = async () => {
    if (!allRows.length) return;
    setServerLoading(true);
    try {
      const mappedRows = applyAllMappings(allRows, mapping, valueMappings);
      const editedMappedRows = mappedRows.map((row, idx) => {
        const edits = serverEditedRows[idx + 1];
        return edits ? { ...row, ...edits } : row;
      });
      const csvString = Papa.unparse(editedMappedRows);
      const blob = new Blob([csvString], { type: 'text/csv' });
      const mappedFile = new File([blob], 'mapped.csv', { type: 'text/csv' });

      const form = new FormData();
      form.append('file', mappedFile);
      const params = new URLSearchParams({ type: 'server' });

      const { data } = await apiClient.post(`/import/preview?${params}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setServerPreview(data.data ?? data);
      await fetchOsCatalog();
      setServerEditedRows({});
      message.success('Đã kiểm tra lại dữ liệu');
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error?.message || 'Kiểm tra lại thất bại.';
      message.error(msg);
    } finally {
      setServerLoading(false);
    }
  };

  const handleServerPreview = async () => {
    if (!allRows.length) {
      message.error('Vui lòng chọn file trước khi xem trước.');
      return;
    }
    const missingRequired = SERVER_TARGETS.filter((t) => t.required).filter(
      (t) => !Object.values(mapping).includes(t.key),
    );
    if (missingRequired.length) {
      message.error(`Thiếu ánh xạ cho: ${missingRequired.map((t) => t.label).join(', ')}`);
      return;
    }
    setServerLoading(true);
    try {
      const mappedRows = applyAllMappings(allRows, mapping, valueMappings);
      const csvString = Papa.unparse(mappedRows);
      const blob = new Blob([csvString], { type: 'text/csv' });
      const mappedFile = new File([blob], 'mapped.csv', { type: 'text/csv' });

      const form = new FormData();
      form.append('file', mappedFile);
      const params = new URLSearchParams({ type: 'server' });

      const { data } = await apiClient.post(`/import/preview?${params}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setServerPreview(data.data ?? data);
      await fetchOsCatalog();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error?.message || 'Xem trước thất bại.';
      message.error(msg);
    } finally {
      setServerLoading(false);
    }
  };

  // Inject error-row highlight style once
  const errorRowStyle = `.preview-row-error td { background: #fff2f0 !important; }
.preview-row-error:hover td { background: #ffe7e0 !important; }`;

  const handleServerExecute = async () => {
    if (!serverPreview?.session_id) return;
    setServerLoading(true);
    try {
      const { data } = await apiClient.post('/import/execute', {
        session_id: serverPreview.session_id,
        os_resolution: osMappings,
      });
      const result = data.data ?? data;
      setServerResult(result);
      setServerPreview(null);
      // Reset upload form state (keep serverResult so modal stays open)
      setFileToUpload(null);
      setPreviewData([]);
      setTotalRows(0);
      setCsvColumns([]);
      setAllRows([]);
      setMapping({});
      setValueMappings({});
      setServerEditedRows({});
      setServerShowOnlyErrors(false);
      setPreviewPageSize(20);
      setOsMappings({});
    } catch (err: unknown) {
      const status = (err as any)?.response?.status;
      const msg = (err as any)?.response?.data?.error?.message || 'Import thất bại.';
      if (status === 404) {
        message.error('Phiên import đã hết hạn. Vui lòng upload lại file CSV.');
        handleReset();
      } else {
        message.error(msg);
      }
    } finally {
      setServerLoading(false);
    }
  };

  return (
    <div className="p-6">
      <style>{errorRowStyle}</style>
      <PageHeader
        title="Upload Server Chi tiết"
        helpKey="server-import"
      />

      <Card>
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="Hướng dẫn Import Server"
          description={
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              <li>Bắt buộc: <b>IP</b> và <b>Tên Server</b>.</li>
              <li>Thông số kỹ thuật: Tự động tách <b>CPU (Cores)</b>, <b>RAM (GB)</b>, <b>Total Storage (GB)</b>.</li>
              <li>Hệ điều hành: Nhập vào cột <b>OS</b> (ví dụ: Windows Server 2019, RHEL 8.4).</li>
              <li>Dữ liệu sẽ được <b>Upsert</b> dựa trên mã Server (Code) hoặc IP Address.</li>
            </ul>
          }
          style={{ marginBottom: 16 }}
        />

        <Upload
          beforeUpload={handleFileSelect}
          accept=".csv"
          showUploadList={true}
          multiple={false}
          maxCount={1}
          onRemove={() => {
            setFileToUpload(null);
            setPreviewData([]);
          }}
        >
          <Button icon={<UploadOutlined />} block size="large">
            Chọn file CSV để import Server
          </Button>
        </Upload>

        {csvColumns.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ marginBottom: 12 }}>Ánh xạ cột (Column Mapping)</h4>
            <ColumnMapper
              csvColumns={csvColumns}
              targets={SERVER_TARGETS}
              value={mapping}
              onChange={setMapping}
              previewRows={previewData}
            />
          </div>
        )}

        {csvColumns.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ marginBottom: 12 }}>Ánh xạ giá trị (Value Mapping)</h4>
            <ValueMapper
              mapping={mapping}
              targets={SERVER_TARGETS}
              csvRows={allRows}
              value={valueMappings}
              onChange={setValueMappings}
            />
          </div>
        )}

        {serverPreview && (() => {
          const hasErrors = serverPreview.invalid > 0;
          const hasServerEdits = Object.keys(serverEditedRows).length > 0;
          const mergedCols = (() => {
            const seen = new Set<string>(serverPreview.columns);
            serverPreview.rows.forEach((r) =>
              Object.keys(r.data).forEach((k) => seen.add(k)),
            );
            return Array.from(seen);
          })();
          const filteredRows = serverShowOnlyErrors
            ? serverPreview.rows.filter((r) => !r.valid)
            : serverPreview.rows;

          return (
            <div style={{ marginTop: 24 }}>
              {hasErrors && (
                <Alert
                  type="error"
                  showIcon
                  banner
                  message={`Phát hiện ${serverPreview.invalid} dòng lỗi — Kiểm tra và sửa trực tiếp trên bảng hoặc loại bỏ trước khi import.`}
                  style={{ marginBottom: 12, borderRadius: 6 }}
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>Bản xem trước &amp; Kiểm tra</h4>
                <Space>
                  <Switch
                    checked={serverShowOnlyErrors}
                    onChange={setServerShowOnlyErrors}
                    checkedChildren={`Chỉ lỗi (${serverPreview.invalid})`}
                    unCheckedChildren="Tất cả"
                    style={hasErrors ? { backgroundColor: '#ff4d4f' } : undefined}
                  />
                  <Button
                    onClick={handleServerRevalidate}
                    loading={serverLoading}
                    disabled={!hasServerEdits}
                    type="primary"
                    ghost
                  >
                    Kiểm tra lại {hasServerEdits ? `(${Object.keys(serverEditedRows).length} dòng đã sửa)` : ''}
                  </Button>
                </Space>
              </div>

              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card size="small"><Statistic title="Tổng số dòng" value={serverPreview.total} /></Card>
                </Col>
                <Col span={8}>
                  <Card size="small"><Statistic title="Hợp lệ" value={serverPreview.valid} valueStyle={{ color: '#52c41a' }} /></Card>
                </Col>
                <Col span={8}>
                  <Card
                    size="small"
                    style={hasErrors ? { border: '1px solid #ff4d4f', background: '#fff2f0' } : undefined}
                  >
                    <Statistic
                      title="Lỗi"
                      value={serverPreview.invalid}
                      valueStyle={{ color: hasErrors ? '#ff4d4f' : '#8c8c8c' }}
                      suffix={hasErrors ? <CloseCircleOutlined style={{ fontSize: 16 }} /> : undefined}
                    />
                  </Card>
                </Col>
              </Row>

              <Table
                size="small"
                dataSource={filteredRows}
                rowKey="row"
                pagination={{
                  pageSize: previewPageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} dòng`,
                  onShowSizeChange: (_current, size) => setPreviewPageSize(size),
                }}
                scroll={{ x: 'max-content' }}
                rowClassName={(r) => (r.valid ? '' : 'preview-row-error')}
                columns={[
                  {
                    title: '#',
                    dataIndex: 'row',
                    width: 70,
                    fixed: 'left' as const,
                    filters: [
                      { text: 'Hợp lệ', value: 'valid' },
                      { text: 'Lỗi', value: 'invalid' },
                    ],
                    onFilter: (value, record: any) =>
                      value === 'valid' ? record.valid : !record.valid,
                    render: (v: number, r) => (
                      <Tooltip title={r.valid ? 'Hợp lệ' : r.errors.join('; ')}>
                        <span>
                          {r.valid ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                          )} {v}
                        </span>
                      </Tooltip>
                    ),
                  },
                  ...mergedCols.map((col) => ({
                    title: col.replace(/_/g, ' ').toUpperCase(),
                    dataIndex: ['data', col],
                    width: 160,
                    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
                      <div style={{ padding: 8 }}>
                        <Input
                          placeholder={`Lọc ${col}`}
                          value={selectedKeys[0]}
                          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                          onPressEnter={() => confirm()}
                          style={{ marginBottom: 8, display: 'block' }}
                        />
                        <Space>
                          <Button type="primary" onClick={() => confirm()} size="small">Lọc</Button>
                          <Button onClick={() => { clearFilters?.(); confirm(); }} size="small">Xóa</Button>
                        </Space>
                      </div>
                    ),
                    onFilter: (value: any, record: any) =>
                      String(record.data[col] ?? '').toLowerCase().includes(String(value).toLowerCase()),
                    render: (_: unknown, r: any) => {
                      const value = r.data[col];
                      const isEdited = serverEditedRows[r.row]?.[col] !== undefined;
                      const target = SERVER_TARGET_BY_KEY[col];
                      const displayStr = value != null ? String(value) : '';

                      if (target?.options) {
                        const normalized = target.valueAliases?.[displayStr.toLowerCase()] ?? displayStr;
                        const validValues = target.options.map((o: any) => o.value);
                        const currentValue = validValues.includes(normalized) ? normalized : undefined;

                        return (
                          <Select
                            size="small"
                            value={currentValue}
                            placeholder={displayStr || '—'}
                            style={{ width: '100%', background: isEdited ? '#fffbe6' : undefined }}
                            options={target.options}
                            onChange={(v) => handleServerCellEdit(r.row, col, v)}
                          />
                        );
                      }

                      return (
                        <Input
                          size="small"
                          defaultValue={displayStr}
                          style={{ background: isEdited ? '#fffbe6' : undefined }}
                          onBlur={(e) => {
                            const newValue = e.target.value;
                            if (newValue !== displayStr) handleServerCellEdit(r.row, col, newValue);
                          }}
                        />
                      );
                    },
                  })),
                  {
                    title: 'Thông báo lỗi',
                    dataIndex: 'errors',
                    width: 220,
                    fixed: 'right' as const,
                    render: (errors: string[]) =>
                      errors.length ? (
                        <Tooltip title={errors.join('\n')}>
                          <div style={{
                            color: '#ff4d4f',
                            fontSize: 12,
                            background: '#fff2f0',
                            border: '1px solid #ffccc7',
                            borderRadius: 4,
                            padding: '2px 6px',
                            cursor: 'help',
                          }}>
                            <CloseCircleOutlined style={{ marginRight: 4 }} />
                            {errors[0]}{errors.length > 1 ? ` (+${errors.length - 1})` : ''}
                          </div>
                        </Tooltip>
                      ) : (
                        <Tag color="green" icon={<CheckCircleOutlined />}>Hợp lệ</Tag>
                      ),
                  },
                ]}
              />

              {serverPreview.os_resolution && serverPreview.os_resolution.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <Alert
                    type="warning"
                    showIcon
                    message="Xác nhận Danh mục Hệ điều hành"
                    description="Các Hệ điều hành mới sẽ được tự động tạo trong Danh mục (SYSTEM Application) nếu chưa tồn tại."
                    style={{ marginBottom: 12 }}
                  />
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={serverPreview.os_resolution}
                    rowKey="raw"
                    columns={[
                      { title: 'OS trong file', dataIndex: 'raw', key: 'raw' },
                      { 
                        title: 'Ánh xạ Danh mục', 
                        key: 'action',
                        render: (_, r) => (
                          <Select
                            placeholder="Chọn OS từ Danh mục hoặc Tạo mới"
                            allowClear
                            style={{ width: '100%' }}
                            value={osMappings[r.raw]}
                            onChange={(val) => setOsMappings(prev => ({ ...prev, [r.raw]: val }))}
                            options={[
                              { label: `+ Tạo mới OS: ${r.suggested_name}`, value: '' },
                              ...osCatalog.map(os => ({ label: os.name, value: os.id }))
                            ]}
                          />
                        )
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          );
        })()}

        <Space style={{ marginTop: 24, width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={handleReset}>Hủy bỏ</Button>
          {serverPreview ? (
            <Button
              type="primary"
              onClick={handleServerExecute}
              disabled={serverPreview.valid === 0 || Object.keys(serverEditedRows).length > 0}
              loading={serverLoading}
              size="large"
            >
              Tiến hành Nhập {serverPreview.valid} Server
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleServerPreview}
              disabled={!fileToUpload}
              loading={serverLoading}
              size="large"
            >
              Kiểm tra &amp; Xem trước ({totalRows} dòng)
            </Button>
          )}
        </Space>
      </Card>

      <Modal
        title="Kết quả Import Server"
        open={!!serverResult}
        onCancel={handleReset}
        footer={<Button type="primary" onClick={handleReset}>Đóng &amp; Bắt đầu lại</Button>}
        width={760}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
      >
        {serverResult && (() => {
          const { summary, breakdown, errors } = serverResult;
          const allSuccess = summary.failed === 0;
          return (
            <div>
              {/* Tổng quan */}
              <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic title="Tổng dòng xử lý" value={summary.total} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center', border: '1px solid #b7eb8f' }}>
                    <Statistic title="Thành công" value={summary.succeeded} valueStyle={{ color: '#52c41a' }} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center', ...(summary.failed > 0 ? { border: '1px solid #ffccc7', background: '#fff2f0' } : {}) }}>
                    <Statistic title="Thất bại" value={summary.failed} valueStyle={{ color: summary.failed > 0 ? '#ff4d4f' : '#8c8c8c' }} />
                  </Card>
                </Col>
              </Row>

              {allSuccess
                ? <Alert type="success" showIcon message="Import hoàn tất — Tất cả dữ liệu đã được xử lý thành công." style={{ marginBottom: 16 }} />
                : <Alert type="warning" showIcon message={`${summary.failed} dòng không được import — Xem chi tiết lỗi bên dưới.`} style={{ marginBottom: 16 }} />
              }

              {/* Breakdown */}
              <Divider orientation="left" orientationMargin={0} style={{ fontSize: 13, color: '#595959' }}>Chi tiết theo loại dữ liệu</Divider>
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label={<><Badge color="#1677ff" /> Hệ thống (InfraSystem)</>} span={2}>
                  <Space size="large">
                    <span><Tag color="green">Tạo mới</Tag>{breakdown.systems.created}</span>
                    <span><Tag color="blue">Cập nhật</Tag>{breakdown.systems.updated}</span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={<><Badge color="#52c41a" /> Server</>} span={2}>
                  <Space size="large">
                    <span><Tag color="green">Tạo mới</Tag>{breakdown.servers.created}</span>
                    <span><Tag color="blue">Cập nhật</Tag>{breakdown.servers.updated}</span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={<><Badge color="#fa8c16" /> Hệ điều hành (OS App)</>} span={2}>
                  <Space size="large">
                    <span><Tag color="green">Tạo mới</Tag>{breakdown.os_apps.created}</span>
                    <span><Tag color="default">Dùng lại</Tag>{breakdown.os_apps.reused}</span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={<><Badge color="#722ed1" /> Phần cứng (CPU/RAM/HDD)</>} span={2}>
                  <Space size="large">
                    <span><Tag color="green">Tạo mới</Tag>{breakdown.hardware.created}</span>
                    <span><Tag color="blue">Cập nhật</Tag>{breakdown.hardware.updated}</span>
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              {/* Danh sách lỗi */}
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
                      { title: 'Tên Server', dataIndex: 'name', width: 160, ellipsis: true },
                      { title: 'IP', dataIndex: 'ip', width: 130 },
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
      </Modal>
    </div>
  );
}
