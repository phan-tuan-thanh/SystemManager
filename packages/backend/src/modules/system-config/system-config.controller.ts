import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SystemConfigService } from './system-config.service';
import { UpdateLogConfigDto } from './dto/update-log-config.dto';
import { BatchClientLogsDto } from './dto/create-client-log.dto';

@ApiTags('admin/system-config')
@ApiBearerAuth()
@Controller('admin/system-config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get('logging')
  @ApiOperation({ summary: 'Get current log config (ADMIN only)' })
  @Roles('ADMIN')
  getLogConfig() {
    return this.service.getLogConfig();
  }

  @Patch('logging')
  @ApiOperation({ summary: 'Update log config — takes effect immediately (ADMIN only)' })
  @Roles('ADMIN')
  updateLogConfig(@Body() dto: UpdateLogConfigDto, @Req() req: { user: { id: string } }) {
    return this.service.updateLogConfig(dto, req.user.id);
  }

  @Post('client-logs')
  @Public()
  @ApiOperation({ summary: 'Receive batched frontend logs (fire-and-forget)' })
  async receiveClientLogs(@Body() body: BatchClientLogsDto, @Req() req: Request & { user?: { id: string } }) {
    const userId = (req as unknown as { user?: { id: string } }).user?.id;
    const userAgent = (req as unknown as { headers: Record<string, string> }).headers['user-agent'];
    await this.service.saveClientLogs(body.logs, userId, userAgent);
  }
}
