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
} from 'antd';
import {
  FileTextOutlined,
  TableOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import Papa from 'papaparse';
import ColumnMapper, {
  autoDetect,
  applyAllMappings,
  type TargetField,
  type ColumnMapping,
} from './ColumnMapper';
import ValueMapper, { type ValueMappings } from './ValueMapper';
import EditableTable, { type EditableColumnDef, type EditableRow } from './EditableTable';

const { TextArea } = Input;
const { Text } = Typography;

export interface PasteImportConfig {
  targetFields: TargetField[];
  editableColumns: EditableColumnDef[];
  onImport: (rows: Record<string, unknown>[]) => Promise<void>;
  title?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  config: PasteImportConfig;
  onSuccess?: () => void;
}

type Step = 'paste' | 'map-columns' | 'map-values' | 'preview';

function detectFormat(text: string): 'json' | 'csv' | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('[')) return 'json';
  if (trimmed.length > 0) return 'csv';
  return null;
}

function parsePaste(text: string): { rows: Record<string, string>[]; columns: string[] } | { error: string } {
  const format = detectFormat(text);
  if (!format) return { error: 'Không nhận diện được định dạng. Vui lòng dán JSON array hoặc CSV.' };

  if (format === 'json') {
    try {
      const parsed = JSON.parse(text.trim());
      if (!Array.isArray(parsed)) return { error: 'JSON phải là array (bắt đầu bằng []).' };
      if (parsed.length === 0) return { error: 'JSON array rỗng.' };
      const columns = Object.keys(parsed[0]);
      const rows = parsed.map((item: Record<string, unknown>) =>
        Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v == null ? '' : String(v)])),
      );
      return { rows, columns };
    } catch {
      return { error: 'JSON không hợp lệ. Kiểm tra lại cú pháp.' };
    }
  }

  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0 && result.data.length === 0) {
    return { error: `Lỗi parse CSV: ${result.errors[0].message}` };
  }
  const columns = result.meta.fields ?? [];
  return { rows: result.data, columns };
}

let _uid = 0;
const genId = () => `paste_${Date.now()}_${_uid++}`;

function toEditableRows(rows: Record<string, unknown>[]): EditableRow[] {
  return rows.map((r) => ({ _id: genId(), ...r }));
}

export default function PasteImportDrawer({ open, onClose, config, onSuccess }: Props) {
  const { message } = App.useApp();
  const [step, setStep] = useState<Step>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [colMapping, setColMapping] = useState<ColumnMapping>({});
  const [valMappings, setValMappings] = useState<ValueMappings>({});
  const [editableRows, setEditableRows] = useState<EditableRow[]>([]);
  const [importing, setImporting] = useState(false);

  const needsValueMapping = config.targetFields.some(
    (f) => f.options && f.options.length > 0,
  );

  const handleReset = () => {
    setStep('paste');
    setPasteText('');
    setParseError(null);
    setCsvRows([]);
    setCsvColumns([]);
    setColMapping({});
    setValMappings({});
    setEditableRows([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleParse = () => {
    const result = parsePaste(pasteText);
    if ('error' in result) {
      setParseError(result.error);
      return;
    }
    setParseError(null);
    setCsvRows(result.rows);
    setCsvColumns(result.columns);
    const detected = autoDetect(result.columns, config.targetFields);
    setColMapping(detected);
    setStep('map-columns');
  };

  const handleAfterColumnMap = () => {
    if (needsValueMapping) {
      setStep('map-values');
    } else {
      buildPreview({});
    }
  };

  const buildPreview = (vMappings: ValueMappings) => {
    const mapped = applyAllMappings(csvRows, colMapping, vMappings);
    setEditableRows(toEditableRows(mapped));
    setStep('preview');
  };

  const handleImport = async (rows: Record<string, unknown>[]) => {
    setImporting(true);
    try {
      await config.onImport(rows);
      message.success(`Đã nhập ${rows.length} bản ghi thành công`);
      handleClose();
      onSuccess?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Nhập dữ liệu thất bại');
    } finally {
      setImporting(false);
    }
  };

  const stepItems = [
    { title: 'Dán dữ liệu', icon: <FileTextOutlined /> },
    { title: 'Ánh xạ cột', icon: <TableOutlined /> },
    ...(needsValueMapping ? [{ title: 'Ánh xạ giá trị', icon: <TableOutlined /> }] : []),
    { title: 'Xem & sửa', icon: <CheckCircleOutlined /> },
  ];

  const stepIndex: Record<Step, number> = {
    paste: 0,
    'map-columns': 1,
    'map-values': needsValueMapping ? 2 : 1,
    preview: needsValueMapping ? 3 : 2,
  };

  return (
    <Drawer
      title={config.title ?? 'Dán & Nhập dữ liệu'}
      open={open}
      onClose={handleClose}
      width={760}
      destroyOnClose
    >
      <Steps
        size="small"
        current={stepIndex[step]}
        items={stepItems}
        style={{ marginBottom: 24 }}
      />

      {/* Step 1: Paste */}
      {step === 'paste' && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type="info"
            showIcon
            message="Dán JSON array hoặc CSV có header vào ô bên dưới"
            description={
              <span>
                JSON: <Text code>{'[{"code":"SRV-001","hostname":"app-01"},...]'}</Text>
                <br />
                CSV: dòng đầu là tên cột, các dòng sau là dữ liệu
              </span>
            }
          />
          <TextArea
            rows={12}
            placeholder={'[{"code": "SRV-001", "hostname": "app-01.internal", ...}]\n\nhoặc CSV:\ncode,hostname,environment\nSRV-001,app-01.internal,PROD'}
            value={pasteText}
            onChange={(e) => { setPasteText(e.target.value); setParseError(null); }}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
          {parseError && <Alert type="error" showIcon message={parseError} />}
          <Space>
            <Button
              type="primary"
              onClick={handleParse}
              disabled={!pasteText.trim()}
            >
              Phân tích →
            </Button>
            <Button onClick={handleClose}>Huỷ</Button>
          </Space>
        </Space>
      )}

      {/* Step 2: Map Columns */}
      {step === 'map-columns' && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space>
            <Tag>{csvRows.length} dòng dữ liệu</Tag>
            <Tag>{csvColumns.length} cột phát hiện</Tag>
          </Space>
          <ColumnMapper
            csvColumns={csvColumns}
            targets={config.targetFields}
            value={colMapping}
            onChange={setColMapping}
            previewRows={csvRows.slice(0, 3)}
          />
          <Divider />
          <Space>
            <Button type="primary" onClick={handleAfterColumnMap}>
              {needsValueMapping ? 'Ánh xạ giá trị →' : 'Xem & sửa →'}
            </Button>
            <Button onClick={() => setStep('paste')}>← Quay lại</Button>
          </Space>
        </Space>
      )}

      {/* Step 3: Map Values (optional) */}
      {step === 'map-values' && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <ValueMapper
            mapping={colMapping}
            targets={config.targetFields}
            csvRows={csvRows}
            value={valMappings}
            onChange={setValMappings}
          />
          <Divider />
          <Space>
            <Button
              type="primary"
              onClick={() => { buildPreview(valMappings); }}
            >
              Xem & sửa →
            </Button>
            <Button onClick={() => setStep('map-columns')}>← Quay lại</Button>
          </Space>
        </Space>
      )}

      {/* Step 4: Editable Preview */}
      {step === 'preview' && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type="info"
            showIcon
            message="Kiểm tra và sửa trực tiếp trên bảng trước khi nhập. Chỉ những dòng hợp lệ mới được nhập."
          />
          <EditableTable
            columns={config.editableColumns}
            initialRows={editableRows}
            onSave={handleImport}
            loading={importing}
            saveLabel="Nhập dữ liệu"
          />
          <Button onClick={() => setStep(needsValueMapping ? 'map-values' : 'map-columns')}>
            ← Quay lại
          </Button>
        </Space>
      )}
    </Drawer>
  );
}
