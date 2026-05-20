import { useState, useCallback } from 'react';
import {
  Table,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Tooltip,
  Typography,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;

export interface EditableColumnDef {
  key: string;
  title: string;
  type: 'text' | 'select' | 'number' | 'date';
  options?: { label: string; value: string }[];
  required?: boolean;
  placeholder?: string;
  width?: number;
  disabled?: boolean | ((row: EditableRow) => boolean);
}

export interface EditableRow {
  _id: string;
  [key: string]: unknown;
}

interface EditableTableProps {
  columns: EditableColumnDef[];
  initialRows?: EditableRow[];
  onSave: (rows: Record<string, unknown>[]) => Promise<void>;
  loading?: boolean;
  maxRows?: number;
  saveLabel?: string;
}

let _uid = 0;
const genId = () => `row_${Date.now()}_${_uid++}`;

function makeEmptyRow(): EditableRow {
  return { _id: genId() };
}

function validateRow(row: EditableRow, columns: EditableColumnDef[]): string[] {
  return columns
    .filter((col) => col.required && !row[col.key])
    .map((col) => `Thiếu "${col.title}"`);
}

function CellEditor({
  col,
  value,
  row,
  onChange,
}: {
  col: EditableColumnDef;
  value: unknown;
  row: EditableRow;
  onChange: (v: unknown) => void;
}) {
  const disabled = typeof col.disabled === 'function' ? col.disabled(row) : col.disabled;

  if (col.type === 'select') {
    return (
      <Select
        size="small"
        style={{ width: '100%', minWidth: 100 }}
        placeholder={col.placeholder ?? `Chọn ${col.title}`}
        value={value as string | undefined}
        onChange={onChange}
        showSearch
        optionFilterProp="label"
        allowClear
        options={col.options ?? []}
        disabled={disabled}
      />
    );
  }
  if (col.type === 'number') {
    return (
      <InputNumber
        size="small"
        style={{ width: '100%' }}
        placeholder={col.placeholder}
        value={value as number | undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (col.type === 'date') {
    return (
      <DatePicker
        size="small"
        style={{ width: '100%' }}
        format="YYYY-MM-DD"
        value={value ? dayjs(value as string) : undefined}
        onChange={(d) => onChange(d ? d.format('YYYY-MM-DD') : undefined)}
        disabled={disabled}
      />
    );
  }
  return (
    <Input
      size="small"
      placeholder={col.placeholder ?? col.title}
      value={value as string | undefined}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}

export default function EditableTable({
  columns,
  initialRows,
  onSave,
  loading = false,
  maxRows,
  saveLabel = 'Lưu tất cả',
}: EditableTableProps) {
  const [rows, setRows] = useState<EditableRow[]>(initialRows ?? [makeEmptyRow()]);
  const [saving, setSaving] = useState(false);

  const updateCell = useCallback((rowId: string, key: string, value: unknown) => {
    setRows((prev) =>
      prev.map((r) => (r._id === rowId ? { ...r, [key]: value } : r)),
    );
  }, []);

  const addRow = () => {
    setRows((prev) => [...prev, makeEmptyRow()]);
  };

  const deleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r._id !== rowId));
  };

  const handleSave = async () => {
    const valid = rows.filter((r) => validateRow(r, columns).length === 0);
    if (!valid.length) return;
    setSaving(true);
    try {
      const payload = valid.map(({ _id: _ignored, ...rest }) => rest);
      await onSave(payload);
      setRows([makeEmptyRow()]);
    } finally {
      setSaving(false);
    }
  };

  const validCount = rows.filter((r) => validateRow(r, columns).length === 0).length;
  const invalidCount = rows.length - validCount;

  const tableColumns: ColumnType<EditableRow>[] = [
    ...columns.map((col) => ({
      title: (
        <span>
          {col.title}
          {col.required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
        </span>
      ),
      key: col.key,
      dataIndex: col.key,
      width: col.width,
      render: (_: unknown, row: EditableRow) => {
        const errors = validateRow(row, columns.filter((c) => c.key === col.key));
        const isEmpty = col.required && !row[col.key];
        return (
          <div style={{ position: 'relative' }}>
            <div style={{ border: isEmpty ? '1px solid #ff4d4f' : undefined, borderRadius: 6 }}>
              <CellEditor
                col={col}
                value={row[col.key]}
                row={row}
                onChange={(v) => updateCell(row._id, col.key, v)}
              />
            </div>
            {errors.length > 0 && (
              <Tooltip title={errors.join(', ')}>
                <WarningOutlined
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    color: '#ff4d4f',
                    fontSize: 12,
                    background: '#fff',
                    borderRadius: '50%',
                  }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    })),
    {
      key: '_actions',
      width: 48,
      render: (_: unknown, row: EditableRow) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => deleteRow(row._id)}
          disabled={rows.length === 1}
        />
      ),
    },
  ];

  const canAddMore = !maxRows || rows.length < maxRows;

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Table<EditableRow>
        size="small"
        dataSource={rows}
        columns={tableColumns}
        rowKey="_id"
        pagination={false}
        bordered
        footer={() => (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addRow}
            disabled={!canAddMore}
            block
          >
            Thêm dòng
          </Button>
        )}
      />

      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Space>
          {validCount > 0 && <Tag color="success">{validCount} dòng hợp lệ</Tag>}
          {invalidCount > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {invalidCount} dòng chưa đủ thông tin (sẽ bị bỏ qua)
            </Text>
          )}
        </Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving || loading}
          onClick={handleSave}
          disabled={validCount === 0}
        >
          {saveLabel} ({validCount})
        </Button>
      </Space>
    </Space>
  );
}
