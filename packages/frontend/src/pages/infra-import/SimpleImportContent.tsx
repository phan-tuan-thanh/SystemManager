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
  ThunderboltOutlined,
} from '@ant-design/icons';
import Papa from 'papaparse';
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
  errors?: Array<{ row: number; field?: string; reason: string }>;
}

export interface SimpleImportContentProps {
  type: 'network_zone' | 'zone_ip';
  title: string;
  targetFields: TargetField[];
  templateLink?: string;
}

export default function SimpleImportContent({
  type,
  title,
  targetFields,
}: SimpleImportContentProps) {
  const { message, modal } = App.useApp();
  const [step, setStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [valueMappings, setValueMappings] = useState<ValueMappings>({});
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [editedRows, setEditedRows] = useState<Record<number, Record<string, any>>>({});

  const handleReset = () => {
    setStep(0);
    setFileList([]);
    setCsvColumns([]);
    setCsvRows([]);
    setMapping({});
    setValueMappings({});
    setPreview(null);
    setResult(null);
    setLoading(false);
    setShowOnlyErrors(false);
    setEditedRows({});
  };

  const handleCellEdit = (rowNum: number, colKey: string, value: any) => {
    setEditedRows((prev) => ({ ...prev, [rowNum]: { ...(prev[rowNum] ?? {}), [colKey]: value } }));
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
    const blob = new Blob([Papa.unparse(finalRows)], { type: 'text/csv' });
    const form = new FormData();
    form.append('file', new File([blob], 'mapped.csv', { type: 'text/csv' }));
    return form;
  };

  const handleQuickImport = () => {
    const file = fileList[0]?.originFileObj as File | undefined;
    if (!file) { message.error('Vui lòng chọn file.'); return; }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, any>[];
        const cols = (results.meta.fields ?? []).filter(Boolean) as string[];
        if (!cols.length) { message.error('Không đọc được tiêu đề cột.'); return; }

        const autoMapping = autoDetect(cols, targetFields);
        const mappedTargets = new Set(Object.values(autoMapping).filter(Boolean));
        const missing = targetFields.filter((t) => t.required && !mappedTargets.has(t.key));

        if (missing.length > 0) {
          message.warning(
            `Không nhận diện được cột: ${missing.map((t) => t.label).join(', ')}. Chuyển sang wizard.`,
          );
          setCsvColumns(cols);
          setCsvRows(rows);
          setMapping(autoMapping);
          setStep(1);
          return;
        }

        setLoading(true);
        try {
          const mappedRows = applyAllMappings(rows, autoMapping, {});
          const blob = new Blob([Papa.unparse(mappedRows)], { type: 'text/csv' });
          const form = new FormData();
          form.append('file', new File([blob], 'mapped.csv', { type: 'text/csv' }));

          const { data } = await apiClient.post(`/import/preview?type=${type}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const previewResult: PreviewResult = data.data ?? data;

          modal.confirm({
            title: 'Xác nhận Import nhanh',
            icon: <ThunderboltOutlined style={{ color: '#faad14' }} />,
            content: (
              <div>
                <p>
                  Phát hiện <strong>{previewResult.valid}</strong> dòng hợp lệ
                  {previewResult.invalid > 0 && (
                    <span style={{ color: '#ff4d4f' }}>
                      , <strong>{previewResult.invalid}</strong> dòng lỗi sẽ bỏ qua
                    </span>
                  )}
                  .
                </p>
                <p>Tiếp tục import {title}?</p>
              </div>
            ),
            okText: 'Import',
            cancelText: 'Xem chi tiết',
            onOk: async () => {
              try {
                const { data: execData } = await apiClient.post('/import/execute', {
                  session_id: previewResult.session_id,
                });
                const execResult: ExecuteResult = execData.data ?? execData;
                setResult(execResult);
                setStep(2);
                message.success(
                  `Import hoàn thành: ${execResult.summary.succeeded}/${execResult.summary.total} thành công`,
                );
              } catch {
                message.error('Lỗi khi thực thi import.');
              }
            },
            onCancel: () => {
              setCsvColumns(cols);
              setCsvRows(rows);
              setMapping(autoMapping);
              setPreview(previewResult);
              setStep(1);
            },
          });
        } catch {
          message.error('Lỗi khi preview file.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handlePreview = async () => {
    if (!csvRows.length) { message.error('Không có dữ liệu để preview.'); return; }
    setLoading(true);
    try {
      const form = buildFormData();
      const { data } = await apiClient.post(`/import/preview?type=${type}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data.data ?? data);
      setStep(2);
    } catch {
      message.error('Lỗi khi preview dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!preview?.session_id) return;
    modal.confirm({
      title: `Xác nhận import ${title}`,
      content: `Import ${preview.valid} dòng hợp lệ vào hệ thống?`,
      okText: 'Xác nhận',
      cancelText: 'Huỷ',
      okButtonProps: { danger: false },
      onOk: async () => {
        setLoading(true);
        try {
          const { data } = await apiClient.post('/import/execute', {
            session_id: preview.session_id,
          });
          const execResult: ExecuteResult = data.data ?? data;
          setResult(execResult);
          setStep(3);
          message.success(
            `Import hoàn thành: ${execResult.summary.succeeded}/${execResult.summary.total} thành công`,
          );
        } catch {
          message.error('Lỗi khi thực thi import.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const previewColumns = preview
    ? [
        { title: '#', dataIndex: 'row', width: 55, render: (v: number) => <Text type="secondary">{v}</Text> },
        ...targetFields.map((f) => ({
          title: f.label.split(' (')[0],
          dataIndex: ['data', f.key],
          ellipsis: true,
          render: (v: any, record: ImportRow) => {
            const hasErr = record.errors.some((e) => e.toLowerCase().includes(f.key));
            return (
              <Tooltip title={hasErr ? record.errors.join('; ') : undefined}>
                <span style={{ color: hasErr ? '#ff4d4f' : undefined }}>{v ?? '—'}</span>
              </Tooltip>
            );
          },
        })),
        {
          title: 'Trạng thái',
          width: 110,
          render: (_: any, record: ImportRow) =>
            record.valid ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>Hợp lệ</Tag>
            ) : (
              <Tooltip title={record.errors.join(' | ')}>
                <Tag color="error" icon={<CloseCircleOutlined />}>Lỗi</Tag>
              </Tooltip>
            ),
        },
      ]
    : [];

  const displayRows = preview
    ? showOnlyErrors
      ? preview.rows.filter((r) => !r.valid)
      : preview.rows
    : [];

  return (
    <Card variant="borderless" style={{ background: 'transparent' }}>
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: 'Chọn file' },
          { title: 'Ánh xạ cột' },
          { title: 'Kiểm tra' },
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
            onRemove={() => { setFileList([]); }}
            style={{ marginBottom: 16 }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kéo thả hoặc click để chọn file CSV</p>
            <p className="ant-upload-hint">
              Import {title} từ CSV. Hỗ trợ ký tự Unicode (UTF-8).
            </p>
          </Dragger>

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={`Các cột CSV cho ${title}`}
            description={
              <Space wrap>
                {targetFields.map((f) => (
                  <Tag key={f.key} color={f.required ? 'blue' : 'default'}>
                    {f.key}
                    {f.required ? ' *' : ''}
                  </Tag>
                ))}
              </Space>
            }
          />

          <Space>
            <Button
              type="primary"
              disabled={!fileList.length}
              loading={loading}
              icon={<ThunderboltOutlined />}
              onClick={handleQuickImport}
            >
              Import nhanh
            </Button>
            <Button
              disabled={!fileList.length}
              onClick={() => {
                const file = fileList[0]?.originFileObj as File | undefined;
                if (!file) return;
                Papa.parse(file, {
                  header: true,
                  skipEmptyLines: true,
                  complete: (r) => {
                    const cols = (r.meta.fields ?? []).filter(Boolean) as string[];
                    const rows = r.data as Record<string, any>[];
                    setCsvColumns(cols);
                    setCsvRows(rows);
                    setMapping(autoDetect(cols, targetFields));
                    setStep(1);
                  },
                });
              }}
            >
              Wizard ánh xạ cột
            </Button>
          </Space>
        </div>
      )}

      {/* Step 1 — Column mapping */}
      {step === 1 && (
        <div>
          <ColumnMapper
            csvColumns={csvColumns}
            targets={targetFields}
            value={mapping}
            onChange={setMapping}
          />
          <ValueMapper
            targets={targetFields}
            mapping={mapping}
            csvRows={csvRows}
            value={valueMappings}
            onChange={setValueMappings}
          />
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setStep(0)}>Quay lại</Button>
            <Button type="primary" loading={loading} onClick={handlePreview}>
              Tiếp theo — Kiểm tra
            </Button>
          </Space>
        </div>
      )}

      {/* Step 2 — Preview */}
      {step === 2 && preview && (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic title="Tổng dòng" value={preview.total} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Hợp lệ"
                value={preview.valid}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Lỗi"
                value={preview.invalid}
                valueStyle={{ color: preview.invalid ? '#ff4d4f' : undefined }}
              />
            </Col>
          </Row>

          {preview.invalid > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${preview.invalid} dòng có lỗi sẽ bị bỏ qua khi import.`}
              style={{ marginBottom: 12 }}
            />
          )}

          <div style={{ marginBottom: 8 }}>
            <Space>
              <Switch
                size="small"
                checked={showOnlyErrors}
                onChange={setShowOnlyErrors}
                disabled={!preview.invalid}
              />
              <Text type="secondary">Chỉ hiện dòng lỗi ({preview.invalid})</Text>
            </Space>
          </div>

          <Table
            size="small"
            dataSource={displayRows}
            columns={previewColumns as any}
            rowKey="row"
            pagination={{ pageSize: 15, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            rowClassName={(r) => (!r.valid ? 'ant-table-row-error' : '')}
            style={{ marginBottom: 16 }}
          />

          <Space>
            <Button onClick={() => setStep(1)}>Quay lại</Button>
            <Button
              type="primary"
              loading={loading}
              disabled={!preview.valid}
              onClick={handleExecute}
            >
              Import {preview.valid} dòng hợp lệ
            </Button>
          </Space>
        </div>
      )}

      {/* Step 3 — Result */}
      {(step === 3 || (step === 2 && result)) && result && (
        <Result
          status={result.summary.failed > 0 ? 'warning' : 'success'}
          title={
            result.summary.failed > 0
              ? `Import hoàn thành với ${result.summary.failed} lỗi`
              : 'Import thành công!'
          }
          subTitle={`${result.summary.succeeded} / ${result.summary.total} bản ghi đã được lưu`}
          extra={[
            <Button key="again" type="primary" onClick={handleReset}>
              Import thêm
            </Button>,
          ]}
        >
          {result.errors && result.errors.length > 0 && (
            <Alert
              type="error"
              showIcon
              message="Chi tiết lỗi"
              description={
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i} style={{ fontSize: 12 }}>
                      Dòng {e.row}
                      {e.field ? ` [${e.field}]` : ''}: {e.reason}
                    </li>
                  ))}
                  {result.errors.length > 20 && (
                    <li style={{ fontSize: 12, color: '#8c8c8c' }}>
                      ...và {result.errors.length - 20} lỗi khác
                    </li>
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
