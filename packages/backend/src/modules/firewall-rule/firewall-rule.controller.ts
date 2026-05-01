import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseUUIDPipe, UseGuards,
  UseInterceptors, UploadedFile, Res, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FirewallRuleService } from './firewall-rule.service';
import { CreateFirewallRuleDto } from './dto/create-firewall-rule.dto';
import { UpdateFirewallRuleDto } from './dto/update-firewall-rule.dto';
import { QueryFirewallRuleDto } from './dto/query-firewall-rule.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Firewall Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('firewall-rules')
export class FirewallRuleController {
  constructor(private readonly service: FirewallRuleService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách firewall rule' })
  findAll(@Query() query: QueryFirewallRuleDto) {
    return this.service.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export danh sách rule ra XLSX' })
  async exportXlsx(@Query() query: QueryFirewallRuleDto, @Res() res: Response) {
    const buffer = await this.service.exportXlsx(query);
    const filename = `firewall-rules-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết firewall rule' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Tạo firewall rule mới' })
  create(@Body() dto: CreateFirewallRuleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Cập nhật firewall rule' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFirewallRuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Xóa firewall rule (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post('import')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Import firewall rules từ CSV/XLSX' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx)$/i)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV or XLSX files are allowed'), false);
        }
      },
    }),
  )
  async importRules(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const rows = await this.parseFile(file);
    return this.service.importRules(rows);
  }

  private async parseFile(file: Express.Multer.File): Promise<Record<string, string>[]> {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      const { parse } = await import('csv-parse/sync');
      return parse(file.buffer.toString(), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const ws = workbook.worksheets[0];
    if (!ws) throw new BadRequestException('Excel has no worksheets');

    const rows: Record<string, string>[] = [];
    const headers: string[] = [];
    ws.eachRow((row: any, rowNum: number) => {
      if (rowNum === 1) {
        row.values.forEach((cell: any, i: number) => {
          if (i > 0) headers.push(String(cell ?? '').trim());
        });
        return;
      }
      const obj: Record<string, string> = {};
      row.values.forEach((cell: any, i: number) => {
        if (i > 0 && headers[i - 1]) obj[headers[i - 1]] = cell != null ? String(cell) : '';
      });
      if (Object.values(obj).some((v) => v !== '')) rows.push(obj);
    });
    return rows;
  }
}
