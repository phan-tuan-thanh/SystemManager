import { useMemo } from 'react';
import { Alert, Collapse, Select, Table, Tag, Typography } from 'antd';
import type { ColumnMapping, TargetField } from './ColumnMapper';

const { Text } = Typography;

export type ValueMappings = Record<string, Record<string, string>>;

interface Props {
  mapping: ColumnMapping;
  targets: TargetField[];
  csvRows: Record<string, any>[];
  value: ValueMappings;
  onChange: (mappings: ValueMappings) => void;
}

export default function ValueMapper({ mapping, targets, csvRows, value, onChange }: Props) {
  const applicable = useMemo(() => {
    return Object.entries(mapping)
      .map(([csvCol, targetKey]) => ({
        csvCol,
        target: targets.find((t) => t.key === targetKey),
      }))
      .filter(
        (x): x is { csvCol: string; target: TargetField } =>
          !!x.target && !!x.target.options && x.target.options.length > 0,
      );
  }, [mapping, targets]);

  if (!applicable.length) return null;

  const items = applicable.map(({ csvCol, target }) => {
    const rawValues = Array.from(
      new Set(
        csvRows
          .map((r) => (r[csvCol] != null ? String(r[csvCol]).trim() : ''))
          .filter((v) => v !== ''),
      ),
    ).sort();

    const currentMap = value[csvCol] ?? {};
    const validValues = (target.options ?? []).map((o) => o.value);

    // A raw value is "resolved" if: explicit user mapping exists, OR valueAliases match,
    // OR the raw value is already a valid enum value.
    const resolveFor = (raw: string): string | undefined => {
      if (currentMap[raw] !== undefined) return currentMap[raw];
      const alias = target.valueAliases?.[raw.toLowerCase()];
      if (alias && validValues.includes(alias)) return alias;
      if (validValues.includes(raw)) return raw;
      return undefined;
    };

    const unresolved = rawValues.filter((v) => resolveFor(v) === undefined).length;

    return {
      key: csvCol,
      label: (
        <span>
          <Text strong>{target.label}</Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            ({csvCol}) · {rawValues.length} giá trị khác biệt
          </Text>
          {unresolved > 0 && (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {unresolved} chưa ánh xạ
            </Tag>
          )}
        </span>
      ),
      children: (
        <Table
          size="small"
          pagination={false}
          dataSource={rawValues.map((v) => ({ key: v, raw: v }))}
          columns={[
            {
              title: 'Giá trị trong CSV',
              dataIndex: 'raw',
              width: 240,
              render: (v: string) => <Text code>{v}</Text>,
            },
            {
              title: 'Gợi ý hệ thống',
              width: 160,
              render: (_: unknown, r: { raw: string }) => {
                const alias = target.valueAliases?.[r.raw.toLowerCase()];
                if (alias && validValues.includes(alias)) {
                  return <Tag color="blue">{alias}</Tag>;
                }
                if (validValues.includes(r.raw)) {
                  return <Tag color="green">{r.raw} (đã hợp lệ)</Tag>;
                }
                return <Text type="secondary">—</Text>;
              },
            },
            {
              title: 'Ánh xạ tới giá trị',
              render: (_: unknown, r: { raw: string }) => {
                const defaultValue = resolveFor(r.raw);
                const isExplicit = currentMap[r.raw] !== undefined;
                return (
                  <Select
                    size="small"
                    style={{ width: '100%', maxWidth: 280 }}
                    allowClear
                    value={isExplicit ? currentMap[r.raw] : defaultValue}
                    placeholder={defaultValue ? '— Dùng gợi ý —' : '— Chọn giá trị —'}
                    options={target.options}
                    onChange={(v) => {
                      const next = { ...currentMap };
                      if (v) next[r.raw] = v;
                      else delete next[r.raw];
                      onChange({ ...value, [csvCol]: next });
                    }}
                  />
                );
              },
            },
          ]}
        />
      ),
    };
  });

  const totalUnresolved = applicable.reduce((acc, { csvCol, target }) => {
    const rawValues = new Set(
      csvRows
        .map((r) => (r[csvCol] != null ? String(r[csvCol]).trim() : ''))
        .filter((v) => v !== ''),
    );
    const validValues = (target.options ?? []).map((o) => o.value);
    const cm = value[csvCol] ?? {};
    let unresolved = 0;
    for (const v of rawValues) {
      if (cm[v] !== undefined) continue;
      const alias = target.valueAliases?.[v.toLowerCase()];
      if (alias && validValues.includes(alias)) continue;
      if (validValues.includes(v)) continue;
      unresolved++;
    }
    return acc + unresolved;
  }, 0);

  return (
    <div>
      {totalUnresolved > 0 ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`Có ${totalUnresolved} giá trị chưa được ánh xạ`}
          description="Các giá trị chưa ánh xạ sẽ được giữ nguyên gửi lên backend — nếu không phải giá trị hợp lệ, import sẽ báo lỗi."
        />
      ) : (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 12 }}
          message="Tất cả giá trị đã được ánh xạ tới giá trị hệ thống"
        />
      )}
      <Collapse items={items} defaultActiveKey={applicable.map((a) => a.csvCol)} />
    </div>
  );
}
