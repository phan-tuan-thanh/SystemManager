import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Roles } from '../../common/decorators';

@ApiTags('Audit Log')
@ApiBearerAuth()
@Roles('ADMIN', 'OPERATOR')
@Controller('audit-logs')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs with filter and pagination' })
  async findAll(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs as CSV (streamed)' })
  async exportCsv(@Query() query: QueryAuditDto, @Res() res: Response) {
    return this.auditService.exportCsv(query, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single audit log entry detail' })
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
