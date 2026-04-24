import { useEffect, useMemo } from 'react';
import { Alert, Select, Space, Table, Tag, Typography } from 'antd';

const { Text } = Typography;

export interface TargetField {
  key: string;
  label: string;
  required?: boolean;
  aliases?: string[];
  /** If provided, the cell editor becomes a dropdown restricted to these values. */
  options?: Array<{ label: string; value: string }>;
  /** Optional aliases mapping raw CSV values → valid option values (e.g. "LIVE" → "PROD"). */
  valueAliases?: Record<string, string>;
}

export type ColumnMapping = Record<string, string | undefined>;

interface Props {
  csvColumns: string[];
  targets: TargetField[];
  value: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
  previewRows?: Record<string, any>[];
}

const normaliseKey = (s: string): string =>
  s.trim().toLowerCase().replace(/[\s()]+/g, '_').replace(/__+/g, '_').replace(/_+$/g, '');

function autoDetect(csvColumns: string[], targets: TargetField[]): ColumnMapping {
  const result: ColumnMapping = {};
  const usedTargets = new Set<string>();
  for (const col of csvColumns) {
    const nc = normaliseKey(col);
    const match = targets.find((t) => {
      if (usedTargets.has(t.key)) return false;
      if (normaliseKey(t.key) === nc) return true;
      if (normaliseKey(t.label) === nc) return true;
      if (t.aliases?.some((a) => normaliseKey(a) === nc)) return true;
      return false;
    });
    if (match) {
      result[col] = match.key;
      usedTargets.add(match.key);
    } else {
      result[col] = undefined;
    }
  }
  return result;
}

/**
 * Apply a column mapping to a set of rows: rename CSV column keys → target field keys.
 * Columns mapped to `undefined` are dropped.
 */
export function applyMapping<T extends Record<string, any>>(
  rows: T[],
  mapping: ColumnMapping,
): Record<string, any>[] {
  return rows.map((row) => {
    const out: Record<string, any> = {};
    for (const [csvCol, target] of Object.entries(mapping)) {
      if (target && row[csvCol] !== undefined) out[target] = row[csvCol];
    }
    return out;
  });
}

/**
 * Apply both column mapping AND value mapping in a single pass.
 * `valueMappings` is keyed by CSV column name: { [csvCol]: { [rawValue]: canonicalValue } }.
 * Value substitution happens before the key is renamed to the target field.
 */
export function applyAllMappings<T extends Record<string, any>>(
  rows: T[],
  mapping: ColumnMapping,
  valueMappings: Record<string, Record<string, string>> = {},
): Record<string, any>[] {
  return rows.map((row) => {
    const out: Record<string, any> = {};
    for (const [csvCol, target] of Object.entries(mapping)) {
      if (!target || row[csvCol] === undefined) continue;
      let val = row[csvCol];
      const vmap = valueMappings[csvCol];
      if (vmap) {
        const strVal = String(val);
        if (vmap[strVal] !== undefined) val = vmap[strVal];
      }
      out[target] = val;
    }
    return out;
  });
}

export default function ColumnMapper({ csvColumns, targets, value, onChange, previewRows }: Props) {
  // On first render (or when csvColumns change), auto-detect and emit initial mapping
  useEffect(() => {
    if (!csvColumns.length) return;
    const hasAnySet = Object.values(value).some((v) => v !== undefined);
    if (!hasAnySet) {
      onChange(autoDetect(csvColumns, targets));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvColumns.join('|')]);

  const targetsInUse = useMemo(() => new Set(Object.values(value).filter(Boolean) as string[]), [value]);

  const missingRequired = targets
    .filter((t) => t.required)
    .filter((t) => !targetsInUse.has(t.key));

  const handleSelect = (csvCol: string, target: string | undefined) => {
    onChange({ ...value, [csvCol]: target });
  };

  const columns = [
    {
      title: 'Cột trong file CSV',
      dataIndex: 'csv',
      width: 220,
      render: (csv: string) => (
        <Space direction="vertical" size={0}>
          <Text strong>{csv}</Text>
          {previewRows && previewRows.length > 0 && (
            <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
              VD: {String(previewRows[0][csv] ?? '').slice(0, 40)}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Ánh xạ tới trường',
      dataIndex: 'target',
      render: (_: unknown, r: { csv: string }) => (
        <Select
          allowClear
          style={{ width: '100%', maxWidth: 360 }}
          placeholder="— Bỏ qua cột này —"
          value={value[r.csv]}
          onChange={(v) => handleSelect(r.csv, v)}
          options={targets.map((t) => ({
            label: (
              <span>
                {t.label}
                {t.required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                  {t.key}
                </Text>
              </span>
            ),
            value: t.key,
            disabled: targetsInUse.has(t.key) && value[r.csv] !== t.key,
          }))}
        />
      ),
    },
  ];

  const dataSource = csvColumns.map((c) => ({ csv: c, key: c }));

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      {missingRequired.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={
            <span>
              Chưa ánh xạ các trường bắt buộc:{' '}
              {missingRequired.map((t) => (
                <Tag color="red" key={t.key}>
                  {t.label}
                </Tag>
              ))}
            </span>
          }
        />
      )}
      <Table
        size="small"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
      />
    </Space>
  );
}
