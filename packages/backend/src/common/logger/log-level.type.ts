export type LogLevel = 'error' | 'warn' | 'log' | 'debug' | 'verbose';

export const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  log: 2,
  debug: 3,
  verbose: 4,
};

// Map NestJS log levels to Winston levels
export const NEST_TO_WINSTON: Record<LogLevel, string> = {
  error: 'error',
  warn: 'warn',
  log: 'info',
  debug: 'debug',
  verbose: 'verbose',
};

export interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  toFile: boolean;
  toConsole: boolean;
}

export const DEFAULT_LOG_CONFIG: LogConfig = {
  enabled: true,
  level: 'log',
  toFile: true,
  toConsole: true,
};
