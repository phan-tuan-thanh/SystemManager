import {
  Controller,
  Post,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ImportService } from './import.service';
import { ImportPreviewDto, ImportConfirmDto } from './dto/import-upload.dto';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('Import')
@ApiBearerAuth()
@Controller('import')
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('preview')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Upload CSV/Excel and preview rows with validation errors' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: ['server', 'application', 'deployment'] },
        environment: { type: 'string', enum: ['DEV', 'UAT', 'PROD'] },
      },
      required: ['file', 'type'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['text/csv', 'application/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (allowed.includes(file.mimetype) || ext === 'csv' || ext === 'xlsx') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV and XLSX files are allowed'), false);
        }
      },
    }),
  )
  async preview(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: ImportPreviewDto,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.importService.previewFile(file.buffer, file.mimetype, file.originalname, query.type, query.environment);
  }

  @Post('execute')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Execute import using a validated session from preview step' })
  async execute(@Body() dto: ImportConfirmDto, @CurrentUser('id') userId: string) {
    return this.importService.executeImport(dto, userId);
  }
}
