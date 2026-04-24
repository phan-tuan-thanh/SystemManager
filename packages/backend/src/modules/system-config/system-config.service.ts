import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { UpdateLogConfigDto } from './dto/update-log-config.dto';
import { CreateClientLogDto } from './dto/create-client-log.dto';
import { LogConfig } from '../../common/logger/log-level.type';

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getLogConfig(): Promise<LogConfig> {
    return this.logger.getConfig();
  }

  async updateLogConfig(dto: UpdateLogConfigDto, userId: string): Promise<LogConfig> {
    const updates: { key: string; value: string }[] = [];

    if (dto.enabled !== undefined) updates.push({ key: 'LOG_ENABLED', value: String(dto.enabled) });
    if (dto.level !== undefined)   updates.push({ key: 'LOG_LEVEL',   value: dto.level });
    if (dto.toFile !== undefined)  updates.push({ key: 'LOG_TO_FILE', value: String(dto.toFile) });
    if (dto.toConsole !== undefined) updates.push({ key: 'LOG_TO_CONSOLE', value: String(dto.toConsole) });

    await this.prisma.$transaction(
      updates.map(({ key, value }) =>
        this.prisma.systemConfig.upsert({
          where: { key },
          update: { value, updated_by: userId },
          create: { key, value, updated_by: userId },
        }),
      ),
    );

    // Hot-reload logger without restart
    await this.logger.reloadConfig();
    return this.logger.getConfig();
  }

  async saveClientLogs(logs: CreateClientLogDto[], userId?: string, userAgent?: string): Promise<void> {
    if (!logs.length) return;
    await this.prisma.clientLog.createMany({
      data: logs.map((l) => ({
        level: l.level,
        message: l.message,
        context: l.context,
        meta: l.meta ?? undefined,
        user_id: userId ?? null,
        session_id: l.sessionId ?? null,
        url: l.url ?? null,
        user_agent: userAgent ?? null,
      })),
    });
  }
}
