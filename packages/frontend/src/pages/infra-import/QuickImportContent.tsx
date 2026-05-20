import { useState, useRef, type ReactNode } from 'react';
import {
  Button,
  Upload,
  Table,
  Tag,
  App,
  Typography,
  Card,
  Select,
  Space,
  Alert,
  Result,
  Row,
  Col,
  Statistic,
  Progress,
  Divider,
  Tooltip,
} from 'antd';
import {
  InboxOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import Papa from 'papaparse';
import apiClient from '../../api/client';
import { parseSpreadsheet } from '../../utils/parseSpreadsheet';

const { Dragger } = Upload;
const { Text, Title } = Typography;

type ImportType = 'app_group' | 'server' | 'network_zone' | 'zone_ip' | 'firewall';
type FileStatus = 'idle' | 'processing' | 'done' | 'error';

const IMPORT_TYPE_OPTIONS = [
  { label: 'Nhóm ứng dụng (App Group)', value: 'app_group' },
  { label: 'Máy chủ (Server)', value: 'server' },
  { label: 'Network Zone', value: 'network_zone' },
  { label: 'Zone IP Entries', value: 'zone_ip' },
  { label: 'Firewall Rules', value: 'firewall' },
];

const TYPE_COLORS: Record<ImportType, string> = {
  app_group: 'purple',
  server: 'blue',
  network_zone: 'green',
  zone_ip: 'cyan',
  firewall: 'orange',
};

// Dependency order: app groups & zones first (no deps), then zone IPs,
// then server (may ref zones), then firewall (refs server + zones)
const IMPORT_ORDER: Record<ImportType, number> = {
  app_group: 0,
  network_zone: 1,
  zone_ip: 2,
  server: 3,
  firewall: 4,
};

interface FileResult {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: string[];
}

interface FileEntry {
  uid: string;
  file: File;
  importType: ImportType | null;
  status: FileStatus;
  result?: FileResult;
  errorMsg?: string;
}

type AggregateByType = Record<ImportType, { total: number; succeeded: number; failed: number; skipped: number }>;

async function normalizeToCSV(file: File): Promise<File> {
  const { rows } = await parseSpreadsheet(file);
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const baseName = file.name.replace(/\.(xls|xlsx)$/i, '.csv');
  return new File([blob], baseName, { type: 'text/csv' });
}

async function importFile(entry: FileEntry): Promise<FileResult> {
  // Re-serialize through Papa to normalize quoting, BOM, and line endings
  // before sending to the backend. This prevents csv-parse from choking on
  // fields containing commas that are not wrapped in double quotes.
  const cleanFile = await normalizeToCSV(entry.file);

  const form = new FormData();
  form.append('file', cleanFile);

  if (entry.importType === 'firewall') {
    const { data } = await apiClient.post('/firewall-rules/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const res = data.data ?? data;
    const errList: string[] = res.errors ?? [];
    return {
      total: (res.created ?? 0) + (res.skipped ?? 0) + errList.length,
      succeeded: res.created ?? 0,
      skipped: res.skipped ?? 0,
      failed: errList.length,
      errors: errList,
    };
  }

  // server / network_zone / zone_ip — preview then execute
  const { data: previewData } = await apiClient.post(
    `/import/preview?type=${entry.importType}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  const preview = previewData.data ?? previewData;

  const { data: execData } = await apiClient.post('/import/execute', {
    session_id: preview.session_id,
  });
  const exec = execData.data ?? execData;

  const rawErrors: any[] = exec.errors ?? [];
  const errStrings = rawErrors.map((e) =>
    typeof e === 'string'
      ? e
      : `Dòng ${e.row ?? '?'}${e.name ? ` (${e.name})` : ''}: ${e.reason ?? e.message ?? 'Lỗi không xác định'}`,
  );

  return {
    total: exec.summary?.total ?? preview.total ?? 0,
    succeeded: exec.summary?.succeeded ?? 0,
    failed: exec.summary?.failed ?? 0,
    skipped: 0,
    errors: errStrings,
  };
}

export default function QuickImportContent() {
  const { message, modal } = App.useApp();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [phase, setPhase] = useState<'setup' | 'importing' | 'report'>('setup');
  const [doneCount, setDoneCount] = useState(0);
  const abortRef = useRef(false);

  const handleReset = () => {
    abortRef.current = false;
    setEntries([]);
    setPhase('setup');
    setDoneCount(0);
  };

  const addFiles = (files: File[]) => {
    const newEntries: FileEntry[] = files.map((f) => ({
      uid: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      importType: guessType(f.name),
      status: 'idle',
    }));
    setEntries((prev) => [...prev, ...newEntries]);
  };

  const guessType = (filename: string): ImportType | null => {
    const lower = filename.toLowerCase();
    if (lower.includes('firewall') || lower.includes('fw_rule') || lower.includes('fwrule')) return 'firewall';
    if (lower.includes('app_group') || lower.includes('appgroup') || lower.includes('app-group') || lower.includes('application_group') || lower.includes('nhom_ung_dung') || lower.includes('nhomungdung')) return 'app_group';
    // Check zone_ip before network_zone — "zone-ips" contains "zone" so order matters
    if (lower.includes('zone_ip') || lower.includes('zoneip') || lower.includes('zone-ip') || lower.includes('ip_entry') || lower.includes('zone-ips')) return 'zone_ip';
    if (lower.includes('network_zone') || lower.includes('networkzone') || lower.includes('network-zone') || lower.includes('zone')) return 'network_zone';
    if (lower.includes('server') || lower.includes('infra') || lower.includes('host')) return 'server';
    return null;
  };

  const removeEntry = (uid: string) => {
    setEntries((prev) => prev.filter((e) => e.uid !== uid));
  };

  const setType = (uid: string, type: ImportType) => {
    setEntries((prev) => prev.map((e) => (e.uid === uid ? { ...e, importType: type } : e)));
  };

  const unassignedCount = entries.filter((e) => !e.importType).length;

  const handleStartImport = () => {
    if (!entries.length) { message.warning('Vui lòng thêm ít nhất một file.'); return; }
    if (unassignedCount > 0) {
      modal.confirm({
        title: 'Còn file chưa chọn loại',
        content: `${unassignedCount} file chưa được gán loại import và sẽ bị bỏ qua. Tiếp tục?`,
        okText: 'Tiếp tục',
        cancelText: 'Huỷ',
        onOk: () => runImport(),
      });
      return;
    }
    runImport();
  };

  const runImport = async () => {
    const toProcess = entries
      .filter((e) => e.importType !== null)
      .slice()
      .sort((a, b) => IMPORT_ORDER[a.importType!] - IMPORT_ORDER[b.importType!]);
    if (!toProcess.length) { message.error('Không có file nào được gán loại import.'); return; }

    abortRef.current = false;
    setPhase('importing');
    setDoneCount(0);

    // Re-order entries state to match processing order so the table reflects it
    const orderedUids = new Set(toProcess.map((e) => e.uid));
    setEntries([
      ...toProcess,
      ...entries.filter((e) => !orderedUids.has(e.uid)),
    ]);

    let processed = 0;

    for (const entry of toProcess) {
      if (abortRef.current) break;

      setEntries((prev) =>
        prev.map((e) => (e.uid === entry.uid ? { ...e, status: 'processing' } : e)),
      );

      try {
        const result = await importFile(entry);
        setEntries((prev) =>
          prev.map((e) =>
            e.uid === entry.uid ? { ...e, status: 'done', result } : e,
          ),
        );
      } catch (err: any) {
        const errMsg =
          err?.response?.data?.message ??
          err?.response?.data?.error?.message ??
          err?.message ??
          'Lỗi không xác định';
        setEntries((prev) =>
          prev.map((e) =>
            e.uid === entry.uid ? { ...e, status: 'error', errorMsg: errMsg } : e,
          ),
        );
      }

      processed++;
      setDoneCount(processed);
    }

    setPhase('report');
  };

  // Aggregate results by type
  const aggregate = (): AggregateByType => {
    const agg: AggregateByType = {
      app_group: { total: 0, succeeded: 0, failed: 0, skipped: 0 },
      server: { total: 0, succeeded: 0, failed: 0, skipped: 0 },
      network_zone: { total: 0, succeeded: 0, failed: 0, skipped: 0 },
      zone_ip: { total: 0, succeeded: 0, failed: 0, skipped: 0 },
      firewall: { total: 0, succeeded: 0, failed: 0, skipped: 0 },
    };
    for (const e of entries) {
      if (!e.importType || !e.result) continue;
      const a = agg[e.importType];
      a.total += e.result.total;
      a.succeeded += e.result.succeeded;
      a.failed += e.result.failed;
      a.skipped += e.result.skipped;
    }
    return agg;
  };

  const toProcess = entries.filter((e) => e.importType !== null);
  const progress = toProcess.length ? Math.round((doneCount / toProcess.length) * 100) : 0;
  const hasAnyError = entries.some((e) => e.status === 'error' || (e.result?.failed ?? 0) > 0);

  // ─── Setup columns ───────────────────────────────────────────────────
  const setupColumns = [
    {
      title: '#',
      key: 'order',
      width: 48,
      render: (_: any, r: FileEntry) =>
        r.importType != null ? (
          <Tag style={{ minWidth: 24, textAlign: 'center' }}>{IMPORT_ORDER[r.importType] + 1}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'File',
      key: 'file',
      render: (_: any, r: FileEntry) => (
        <Space>
          <Text>{r.file.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            ({(r.file.size / 1024).toFixed(1)} KB)
          </Text>
        </Space>
      ),
    },
    {
      title: 'Loại import',
      key: 'type',
      width: 240,
      render: (_: any, r: FileEntry) => (
        <Select
          style={{ width: 220 }}
          placeholder="Chọn loại..."
          value={r.importType ?? undefined}
          onChange={(v) => setType(r.uid, v as ImportType)}
          options={IMPORT_TYPE_OPTIONS}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_: any, r: FileEntry) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeEntry(r.uid)}
        />
      ),
    },
  ];

  // ─── Progress / report columns ────────────────────────────────────────
  const STATUS_ICON: Record<FileStatus, ReactNode> = {
    idle: <MinusCircleOutlined style={{ color: '#d9d9d9' }} />,
    processing: <LoadingOutlined style={{ color: '#1677ff' }} />,
    done: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  };

  const reportColumns = [
    {
      title: 'File',
      key: 'file',
      render: (_: any, r: FileEntry) => <Text>{r.file.name}</Text>,
    },
    {
      title: 'Loại',
      key: 'type',
      width: 160,
      render: (_: any, r: FileEntry) =>
        r.importType ? (
          <Tag color={TYPE_COLORS[r.importType]}>
            {IMPORT_TYPE_OPTIONS.find((o) => o.value === r.importType)?.label ?? r.importType}
          </Tag>
        ) : (
          <Tag>Bỏ qua</Tag>
        ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_: any, r: FileEntry) => (
        <Space>
          {STATUS_ICON[r.status]}
          <Text>
            {r.status === 'idle' && 'Chờ'}
            {r.status === 'processing' && 'Đang nhập...'}
            {r.status === 'done' && 'Hoàn thành'}
            {r.status === 'error' && 'Lỗi'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Kết quả',
      key: 'result',
      width: 260,
      render: (_: any, r: FileEntry) => {
        if (r.status === 'error') {
          return (
            <Tooltip title={r.errorMsg}>
              <Tag color="error">Lỗi: {(r.errorMsg ?? '').slice(0, 50)}</Tag>
            </Tooltip>
          );
        }
        if (!r.result) return <Text type="secondary">—</Text>;
        return (
          <Space size={4}>
            <Tag color="success">+{r.result.succeeded}</Tag>
            {r.result.skipped > 0 && <Tag color="default">bỏ qua: {r.result.skipped}</Tag>}
            {r.result.failed > 0 && <Tag color="error">lỗi: {r.result.failed}</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Ghi chú lỗi',
      key: 'errors',
      render: (_: any, r: FileEntry) => {
        if (!r.result?.errors?.length) return null;
        const first = r.result.errors[0];
        const rest = r.result.errors.length - 1;
        return (
          <Tooltip
            title={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {r.result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                {r.result.errors.length > 10 && <li>...và {r.result.errors.length - 10} lỗi khác</li>}
              </ul>
            }
          >
            <Text type="danger" style={{ fontSize: 12, cursor: 'pointer' }}>
              {first.slice(0, 60)}{rest > 0 ? ` (+${rest} lỗi)` : ''}
            </Text>
          </Tooltip>
        );
      },
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <Card variant="borderless" style={{ background: 'transparent' }}>

      {/* ── Setup Phase ── */}
      {phase === 'setup' && (
        <>
          <Alert
            type="info"
            showIcon
            icon={<ThunderboltOutlined />}
            style={{ marginBottom: 16 }}
            message="Nhập nhanh nhiều file cùng lúc"
            description="Tải lên nhiều file CSV, chọn loại dữ liệu cho từng file, rồi bấm Bắt đầu nhập. Hệ thống tự động nhập theo thứ tự phụ thuộc: Nhóm ứng dụng → Network Zone → Zone IP → Server → Firewall Rules."
          />

          <Dragger
            accept=".csv,.xls,.xlsx"
            multiple
            showUploadList={false}
            beforeUpload={(file) => {
              addFiles([file]);
              return false;
            }}
            style={{ marginBottom: 16 }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Kéo thả hoặc click để chọn nhiều file CSV / Excel</p>
            <p className="ant-upload-hint">Hỗ trợ .csv, .xls, .xlsx · Nhóm ứng dụng, Server, Network Zone, Zone IP, Firewall Rules</p>
          </Dragger>

          {entries.length > 0 && (
            <>
              <Table
                size="small"
                dataSource={entries}
                columns={setupColumns}
                rowKey="uid"
                pagination={false}
                style={{ marginBottom: 16 }}
              />

              {unassignedCount > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={`${unassignedCount} file chưa được gán loại import — sẽ bị bỏ qua khi nhập.`}
                />
              )}

              <Space>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleStartImport}
                >
                  Bắt đầu nhập ({toProcess.length} file)
                </Button>
                <Button onClick={handleReset} icon={<DeleteOutlined />}>
                  Xoá tất cả
                </Button>
              </Space>
            </>
          )}
        </>
      )}

      {/* ── Importing Phase ── */}
      {phase === 'importing' && (
        <>
          <Title level={5} style={{ marginBottom: 16 }}>
            Đang nhập dữ liệu... ({doneCount}/{toProcess.length})
          </Title>
          <Progress
            percent={progress}
            status={progress < 100 ? 'active' : 'success'}
            style={{ marginBottom: 24 }}
          />
          <Table
            size="small"
            dataSource={entries.filter((e) => e.importType !== null)}
            columns={reportColumns}
            rowKey="uid"
            pagination={false}
          />
        </>
      )}

      {/* ── Report Phase ── */}
      {phase === 'report' && (() => {
        const agg = aggregate();
        const activeTypes = (Object.keys(agg) as ImportType[]).filter(
          (t) => entries.some((e) => e.importType === t),
        );
        const totalSucceeded = activeTypes.reduce((s, t) => s + agg[t].succeeded, 0);
        const totalFailed = activeTypes.reduce((s, t) => s + agg[t].failed, 0);
        const totalSkipped = activeTypes.reduce((s, t) => s + agg[t].skipped, 0);

        return (
          <>
            <Result
              status={hasAnyError ? 'warning' : 'success'}
              title={hasAnyError ? 'Nhập hoàn thành với một số lỗi' : 'Nhập tất cả thành công!'}
              subTitle={`${entries.filter((e) => e.importType).length} file đã được xử lý`}
              extra={[
                <Button key="again" type="primary" icon={<ReloadOutlined />} onClick={handleReset}>
                  Nhập lại
                </Button>,
              ]}
            />

            <Divider>Tổng hợp theo loại</Divider>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic title="Tổng tạo mới / cập nhật" value={totalSucceeded} valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={8}>
                <Statistic title="Bỏ qua (trùng lặp)" value={totalSkipped} />
              </Col>
              <Col span={8}>
                <Statistic title="Lỗi" value={totalFailed} valueStyle={{ color: totalFailed ? '#ff4d4f' : undefined }} />
              </Col>
            </Row>

            {activeTypes.length > 0 && (
              <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
                {activeTypes.map((t) => {
                  const a = agg[t];
                  const label = IMPORT_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
                  return (
                    <Col key={t} xs={24} sm={12} md={6}>
                      <Card size="small" style={{ borderColor: a.failed > 0 ? '#ff4d4f' : '#b7eb8f' }}>
                        <Tag color={TYPE_COLORS[t]} style={{ marginBottom: 8 }}>{label}</Tag>
                        <Row gutter={8}>
                          <Col span={12}>
                            <Statistic title="Thành công" value={a.succeeded} valueStyle={{ fontSize: 18, color: '#52c41a' }} />
                          </Col>
                          <Col span={12}>
                            <Statistic title="Lỗi" value={a.failed} valueStyle={{ fontSize: 18, color: a.failed ? '#ff4d4f' : undefined }} />
                          </Col>
                        </Row>
                        {a.skipped > 0 && (
                          <Text type="secondary" style={{ fontSize: 12 }}>Bỏ qua: {a.skipped}</Text>
                        )}
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}

            <Divider>Chi tiết từng file</Divider>

            <Table
              size="small"
              dataSource={entries.filter((e) => e.importType !== null)}
              columns={reportColumns}
              rowKey="uid"
              pagination={false}
              rowClassName={(r) => (r.status === 'error' || (r.result?.failed ?? 0) > 0 ? 'ant-table-row-error' : '')}
            />
          </>
        );
      })()}
    </Card>
  );
}
