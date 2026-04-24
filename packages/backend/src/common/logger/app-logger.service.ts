import { Injectable, LoggerService, OnModuleInit } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_LOG_CONFIG, LogConfig, LogLevel, NEST_TO_WINSTON } from './log-level.type';

@Injectable()
export class AppLoggerService implements LoggerService, OnModuleInit {
  private winston: winston.Logger;
  private config: LogConfig = { ...DEFAULT_LOG_CONFIG };

  constructor(private readonly prisma: PrismaService) {
    this.winston = this.buildWinstonLogger(this.config);
  }

  async onModuleInit() {
    await this.reloadConfig();
  }

  // Called by system-config service after config update
  async reloadConfig(): Promise<void> {
    try {
      const rows = await this.prisma.systemConfig.findMany({
        where: { key: { in: ['LOG_ENABLED', 'LOG_LEVEL', 'LOG_TO_FILE', 'LOG_TO_CONSOLE'] } },
      });
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

      this.config = {
        enabled: (map['LOG_ENABLED'] ?? 'true') === 'true',
        level: (map['LOG_LEVEL'] as LogLevel) ?? 'log',
        toFile: (map['LOG_TO_FILE'] ?? 'true') === 'true',
        toConsole: (map['LOG_TO_CONSOLE'] ?? 'true') === 'true',
      };
      this.winston = this.buildWinstonLogger(this.config);
    } catch {
      // DB may not be ready on first boot — use defaults silently
    }
  }

  getConfig(): LogConfig {
    return { ...this.config };
  }

  log(message: string, context?: string) {
    this.write('log', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.write('error', message, context, trace ? { trace } : undefined);
  }

  warn(message: string, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: string, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: string, context?: string) {
    this.write('verbose', message, context);
  }

  private write(level: LogLevel, message: string, context?: string, meta?: Record<string, unknown>) {
    if (!this.config.enabled) return;

    const winstonLevel = NEST_TO_WINSTON[level];
    this.winston.log(winstonLevel, message, {
      context: context ?? 'App',
      ...meta,
    });
  }

  private buildWinstonLogger(config: LogConfig): winston.Logger {
    const transports: winston.transport[] = [];

    const fmt = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    const consoleFmt = winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context }) =>
        `${timestamp} [${context ?? 'App'}] ${level}: ${message}`,
      ),
    );

    const winstonLevel = this.nestLevelToWinston(config.level);

    if (config.toConsole) {
      transports.push(
        new winston.transports.Console({
          level: winstonLevel,
          format: consoleFmt,
        }),
      );
    }

    if (config.toFile) {
      transports.push(
        new (require('winston-daily-rotate-file'))({
          level: winstonLevel,
          dirname: 'logs',
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          format: fmt,
        }),
        new (require('winston-daily-rotate-file'))({
          level: 'error',
          dirname: 'logs',
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          format: fmt,
        }),
      );
    }

    // Fallback — always have at least a silent transport so winston doesn't throw
    if (transports.length === 0) {
      transports.push(new winston.transports.Console({ silent: true }));
    }

    return winston.createLogger({ transports });
  }

  private nestLevelToWinston(level: LogLevel): string {
    return NEST_TO_WINSTON[level] ?? 'info';
  }
}
