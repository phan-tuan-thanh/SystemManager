import { useState } from 'react';
import {
  Button,
  Table,
  Steps,
  Space,
  Alert,
  Select,
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
  Result,
} from 'antd';
import type { UploadFile } from 'antd';
import { Upload } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import Papa from 'papaparse';
import PageHeader from '../../components/common/PageHeader';
import apiClient from '../../api/client';
import ColumnMapper, {
  autoDetect,
  applyAllMappings,
  type ColumnMapping,
  type TargetField,
} from '../../components/common/ColumnMapper';
import ValueMapper, { type ValueMappings } from '../../components/common/ValueMapper';

const { Dragger } = Upload;
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

export default function ServerUploadPage() {
  const { message, modal } = App.useApp();

  const [step, setStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [valueMappings, setValueMappings] = useState<ValueMappings>({});
  const [osMappings, setOsMappings] = useState<Record<string, string>>({});
  const [osCatalog, setOsCatalog] = useState<any[]>([]);

  const [serverPreview, setServerPreview] = useState<GenericPreviewResult | null>(null);
  const [serverResult, setServerResult] = useState<ImportResult | null>(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverEditedRows, setServerEditedRows] = useState<Record<number, Record<string, any>>>({});
  const [serverShowOnlyErrors, setServerShowOnlyErrors] = useState(false);
  const [previewPageSize, setPreviewPageSize] = useState(20);

  const fetchOsCatalog = async () => {
    try {
      const res = await apiClient.get('/applications', {
        params: { application_type: 'SYSTEM', sw_type: 'OS', limit: 100 },
      });
      setOsCatalog(res.data.data ?? res.data);
    } catch {
      // non-critical
    }
  };

  const handleReset = () => {
    setStep(0);
    setFileList([]);
    setAllRows([]);
    setCsvColumns([]);
    setPreviewData([]);
    setMapping({});
    setValueMappings({});
    setOsMappings({});
    setServerPreview(null);
    setServerResult(null);
    setServerEditedRows({});
    setServerShowOnlyErrors(false);
    setPreviewPageSize(20);
  };

  const handleFileParsed = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const cols = (results.meta.fields ?? []).filter(Boolean) as string[];
        if (!cols.length) {
          message.error('Không đọc được tiêu đề cột từ file CSV.');
          return;
        }
        setAllRows(rows);
        setCsvColumns(cols);
        setPreviewData(rows.slice(0, 10));
        setMapping({});
        setStep(1);
      },
      error: (err) => message.error(`Không thể đọc file: ${err.message}`),
    });
  };

  const handleGoToMapping = () => {
    const file = fileList[0]?.originFileObj as File | undefined;
    if (!file) { message.error('Vui lòng chọn file.'); return; }
    handleFileParsed(file);
  };

  const handleQuickImport = () => {
    const file = fileList[0]?.originFileObj as File | undefined;
    if (!file) { message.error('Vui lòng chọn file.'); return; }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        const cols = (results.meta.fields ?? []).filter(Boolean) as string[];
        if (!cols.length) { message.error('Không đọc được tiêu đề cột.'); return; }

        const autoMapping = autoDetect(cols, SERVER_TARGETS);
        const mappedTargets = new Set(Object.values(autoMapping).filter(Boolean));
        const missing = SERVER_TARGETS.filter((t) => t.required && !mappedTargets.has(t.key));

        if (missing.length > 0) {
          message.warning(`Không nhận diện được cột: ${missing.map((t) => t.label).join(', ')}. Chuyển sang wizard.`);
          setAllRows(rows);
          setCsvColumns(cols);
          setPreviewData(rows.slice(0, 10));
          setMapping(autoMapping);
          setStep(1);
          return;
        }

        setServerLoading(true);
        try {
          const mappedRows = applyAllMappings(rows, autoMapping, {});
          const blob = new Blob([Papa.unparse(mappedRows)], { type: 'text/csv' });
          const form = new FormData();
          form.append('file', new File([blob], 'mapped.csv', { type: 'text/csv' }));

          const { data } = await apiClient.post('/import/preview?type=server', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const previewResult: GenericPreviewResult = data.data ?? data;
          const newOsCount = previewResult.os_resolution?.filter((o) => o.is_new).length ?? 0;

          modal.confirm({
            title: 'Xác nhận Import nhanh',
            icon: <ThunderboltOutlined style={{ color: '#faad14' }} />,
            content: (
              <div>
                <p>Nhận diện tự động <b>{previewResult.total}</b> server:</p>
                <ul style={{ marginBottom: 0 }}>
                  <li style={{ color: '#52c41a' }}>✓ {previewResult.valid} server hợp lệ</li>
                  {previewResult.invalid > 0 && (
                    <li style={{ color: '#ff4d4f' }}>✗ {previewResult.invalid} dòng lỗi (sẽ bị bỏ qua)</li>
                  )}
                  {newOsCount > 0 && (
                    <li style={{ color: '#fa8c16' }}>⚠ {newOsCount} OS mới sẽ được tự động tạo</li>
                  )}
                </ul>
              </div>
            ),
            okText: `Import ${previewResult.valid} server`,
            okButtonProps: { disabled: previewResult.valid === 0 },
            cancelText: 'Xem chi tiết',
            onOk: async () => {
              const { data: execData } = await apiClient.post('/import/execute', {
                session_id: previewResult.session_id,
                os_resolution: {},
              });
              setServerResult(execData.data ?? execData);
              setStep(3);
            },
            onCancel: () => {
              setAllRows(rows);
              setCsvColumns(cols);
              setPreviewData(rows.slice(0, 10));
              setMapping(autoMapping);
              setServerPreview(previewResult);
              fetchOsCatalog();
              setStep(2);
            },
          });
        } catch (err: unknown) {
          message.error((err as any)?.response?.data?.error?.message || 'Import nhanh thất bại.');
        } finally {
          setServerLoading(false);
        }
      },
      error: (err) => message.error(`Không thể đọc file: ${err.message}`),
    });
  };

  const handleServerPreview = async () => {
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

      const { data } = await apiClient.post('/import/preview?type=server', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setServerPreview(data.data ?? data);
      await fetchOsCatalog();
      setStep(2);
    } catch (err: unknown) {
      message.error((err as any)?.response?.data?.error?.message || 'Xem trước thất bại.');
    } finally {
      setServerLoading(false);
    }
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
      const blob = new Blob([Papa.unparse(editedMappedRows)], { type: 'text/csv' });
      const mappedFile = new File([blob], 'mapped.csv', { type: 'text/csv' });

      const form = new FormData();
      form.append('file', mappedFile);

      const { data } = await apiClient.post('/import/preview?type=server', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setServerPreview(data.data ?? data);
      await fetchOsCatalog();
      setServerEditedRows({});
      message.success('Đã kiểm tra lại dữ liệu');
    } catch (err: unknown) {
      message.error((err as any)?.response?.data?.error?.message || 'Kiểm tra lại thất bại.');
    } finally {
      setServerLoading(false);
    }
  };

  const handleServerExecute = async () => {
    if (!serverPreview?.session_id) return;
    setServerLoading(true);
    try {
      const { data } = await apiClient.post('/import/execute', {
        session_id: serverPreview.session_id,
        os_resolution: osMappings,
      });
      setServerResult(data.data ?? data);
      setServerPreview(null);
      setStep(3);
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

  const mergedCols = (() => {
    if (!serverPreview) return [] as string[];
    const seen = new Set<string>(serverPreview.columns);
    serverPreview.rows.forEach((r) => Object.keys(r.data).forEach((k) => seen.add(k)));
    return Array.from(seen);
  })();

  const filteredRows = serverPreview
    ? serverShowOnlyErrors
      ? serverPreview.rows.filter((r) => !r.valid)
      : serverPreview.rows
    : [];

  const hasServerEdits = Object.keys(serverEditedRows).length > 0;
  const hasErrors = (serverPreview?.invalid ?? 0) > 0;

  return (
    <div className="p-6">
      <style>{`.preview-row-error td { background: #fff2f0 !important; } .preview-row-error:hover td { background: #ffe7e0 !important; }`}</style>
      <PageHeader
        title="Import Server từ CSV"
        subtitle="Khai báo hàng loạt server, hệ thống hạ tầng và phần cứng"
        helpKey="server-import"
      />

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

        {/* Step 0 — Upload */}
        {step === 0 && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Alert
              type="info"
              showIcon
              message="Cột bắt buộc cho Server"
              description={
                <span>
                  Bắt buộc: <b>IP</b> và <b>Tên Server</b>. Tùy chọn: hostname, hệ điều hành (OS), CPU cores, RAM (GB), storage (GB), environment, site, system, purpose.
                  Dữ liệu được <b>Upsert</b> theo mã Server hoặc IP Address.
                </span>
              }
            />

            <Dragger
              accept=".csv"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: list }) => setFileList(list)}
              onRemove={() => {
                setFileList([]);
                setAllRows([]);
                setCsvColumns([]);
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Nhấn hoặc kéo thả file CSV vào đây
              </p>
              <p className="ant-upload-hint">
                Dòng đầu tiên phải là tiêu đề cột. Dung lượng tối đa: 20MB.
              </p>
            </Dragger>

            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button
                icon={<ThunderboltOutlined />}
                onClick={handleQuickImport}
                disabled={!fileList.length}
                loading={serverLoading}
              >
                Import nhanh
              </Button>
              <Button
                type="primary"
                onClick={handleGoToMapping}
                disabled={!fileList.length}
              >
                Tiếp theo: Ánh xạ cột
              </Button>
            </Space>
          </Space>
        )}

        {/* Step 1 — Column Mapping */}
        {step === 1 && csvColumns.length > 0 && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Alert
              type="info"
              showIcon
              message="Ánh xạ cột CSV tới trường server"
              description="Cột có dấu * là bắt buộc. Cột không được ánh xạ sẽ bị bỏ qua khi import."
            />
            <ColumnMapper
              csvColumns={csvColumns}
              targets={SERVER_TARGETS}
              value={mapping}
              onChange={setMapping}
              previewRows={previewData}
            />

            <div>
              <h4 style={{ marginTop: 8, marginBottom: 8 }}>Ánh xạ giá trị (Value Mapping)</h4>
              <ValueMapper
                mapping={mapping}
                targets={SERVER_TARGETS}
                csvRows={allRows}
                value={valueMappings}
                onChange={setValueMappings}
              />
            </div>

            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setStep(0)}>Quay lại</Button>
              <Button type="primary" loading={serverLoading} onClick={handleServerPreview}>
                Tiếp theo: Xem trước ({allRows.length} dòng)
              </Button>
            </Space>
          </Space>
        )}

        {/* Step 2 — Preview & Validate */}
        {step === 2 && serverPreview && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Row gutter={16}>
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

            {hasErrors && (
              <Alert
                type="warning"
                showIcon
                message={`${serverPreview.invalid} dòng có lỗi. Nhấn ô để chỉnh sửa, sau đó bấm "Kiểm tra lại".`}
              />
            )}

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Switch
                  checked={serverShowOnlyErrors}
                  onChange={setServerShowOnlyErrors}
                  checkedChildren={`Chỉ lỗi (${serverPreview.invalid})`}
                  unCheckedChildren="Tất cả"
                  style={hasErrors ? { backgroundColor: '#ff4d4f' } : undefined}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Hiển thị {filteredRows.length}/{serverPreview.rows.length} dòng
                </Text>
              </Space>
              <Button
                onClick={handleServerRevalidate}
                loading={serverLoading}
                disabled={!hasServerEdits}
                type={hasServerEdits ? 'primary' : 'default'}
                ghost={hasServerEdits}
              >
                Kiểm tra lại {hasServerEdits ? `(${Object.keys(serverEditedRows).length} dòng đã sửa)` : ''}
              </Button>
            </Space>

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
                  render: (v: number, r: any) => (
                    <Tooltip title={r.valid ? 'Hợp lệ' : r.errors.join('; ')}>
                      <span>
                        {r.valid ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        )}{' '}{v}
                      </span>
                    </Tooltip>
                  ),
                },
                ...mergedCols.map((col) => ({
                  title: col.replace(/_/g, ' ').toUpperCase(),
                  dataIndex: ['data', col],
                  width: 160,
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
              <div style={{ marginTop: 8 }}>
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
                      render: (_, r: any) => (
                        <Select
                          placeholder="Chọn OS từ Danh mục hoặc Tạo mới"
                          allowClear
                          style={{ width: '100%' }}
                          value={osMappings[r.raw]}
                          onChange={(val) => setOsMappings((prev) => ({ ...prev, [r.raw]: val }))}
                          options={[
                            { label: `+ Tạo mới OS: ${r.suggested_name}`, value: '' },
                            ...osCatalog.map((os: any) => ({ label: os.name, value: os.id })),
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              </div>
            )}

            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setStep(1)}>Quay lại</Button>
              <Button
                type="primary"
                loading={serverLoading}
                onClick={handleServerExecute}
                disabled={!serverPreview || serverPreview.valid === 0 || hasServerEdits}
              >
                Nhập {serverPreview.valid} server hợp lệ
              </Button>
            </Space>
          </Space>
        )}

        {/* Step 3 — Done */}
        {step === 3 && serverResult && (() => {
          const { summary, breakdown, errors } = serverResult;
          const allSuccess = summary.failed === 0;
          return (
            <div>
              <Result
                status={summary.succeeded > 0 ? 'success' : 'warning'}
                title={allSuccess ? 'Import hoàn tất!' : `Import hoàn tất — ${summary.failed} dòng thất bại`}
                subTitle={
                  allSuccess
                    ? 'Tất cả server đã được nhập thành công.'
                    : `${summary.failed} dòng không được import — Xem chi tiết bên dưới.`
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
      </Card>
    </div>
  );
}

export function InfraUploadContent() {
  return <ServerUploadPage />;
}
