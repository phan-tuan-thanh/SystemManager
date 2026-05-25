import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { useActiveEnvironments } from '../../hooks/useEnvironments';

interface Props extends Omit<SelectProps, 'options' | 'loading'> {
  allowAll?: boolean;
  allLabel?: string;
}

export default function EnvironmentSelect({ allowAll, allLabel = 'Tất cả', ...rest }: Props) {
  const { data: envs = [], isLoading } = useActiveEnvironments();

  const options = [
    ...(allowAll ? [{ value: '', label: allLabel }] : []),
    ...envs.map((e) => ({
      value: e.code,
      label: (
        <span>
          <span
            style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: 2,
              background: e.color, marginRight: 6, flexShrink: 0,
            }}
          />
          {e.label}
        </span>
      ),
    })),
  ];

  return <Select loading={isLoading} options={options} {...rest} />;
}
