import type { CSSProperties } from 'react';
import { Tag } from 'antd';
import { useActiveEnvironments } from '../../hooks/useEnvironments';
import { getEnvColor, getEnvLabel } from '../../utils/environmentUtils';

interface Props {
  code: string;
  style?: CSSProperties;
}

export default function EnvironmentTag({ code, style }: Props) {
  const { data: envs = [] } = useActiveEnvironments();
  const color = getEnvColor(code, envs);
  const label = getEnvLabel(code, envs);
  return <Tag color={color} style={style}>{label}</Tag>;
}
