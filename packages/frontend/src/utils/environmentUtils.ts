import type { EnvironmentConfig, EnvironmentSelectOption, EnvironmentType } from '../types/environment';

const TYPE_FALLBACK_COLOR: Record<EnvironmentType, string> = {
  PROD: '#ff4d4f',
  LIVE: '#ff4d4f',
  UAT:  '#fa8c16',
  DEV:  '#52c41a',
};

export function getEnvColor(code: string, envs: EnvironmentConfig[]): string {
  const env = envs.find((e) => e.code === code);
  if (env) return env.color;
  const upperCode = code?.toUpperCase() as EnvironmentType;
  return TYPE_FALLBACK_COLOR[upperCode] ?? '#8c8c8c';
}

export function getEnvLabel(code: string, envs: EnvironmentConfig[]): string {
  return envs.find((e) => e.code === code)?.label ?? code;
}

export function toSelectOptions(envs: EnvironmentConfig[]): EnvironmentSelectOption[] {
  return envs.map((e) => ({
    value: e.code,
    label: e.label,
    color: e.color,
    type: e.type,
  }));
}

export function groupByType(
  envs: EnvironmentConfig[],
): Array<{ label: string; options: EnvironmentSelectOption[] }> {
  const order: EnvironmentType[] = ['PROD', 'LIVE', 'UAT', 'DEV'];
  const grouped = new Map<EnvironmentType, EnvironmentSelectOption[]>();

  for (const env of envs) {
    if (!grouped.has(env.type)) grouped.set(env.type, []);
    grouped.get(env.type)!.push({ value: env.code, label: env.label, color: env.color, type: env.type });
  }

  return order
    .filter((t) => grouped.has(t))
    .map((t) => ({ label: t, options: grouped.get(t)! }));
}

export function getDefaultEnvCode(envs: EnvironmentConfig[], preferType: EnvironmentType = 'PROD'): string {
  return envs.find((e) => e.type === preferType && e.is_active)?.code ?? envs[0]?.code ?? 'PROD';
}
