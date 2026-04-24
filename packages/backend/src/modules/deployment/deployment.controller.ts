import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, UseInterceptors,
  UploadedFile, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { DeploymentService } from './deployment.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { QueryDeploymentDto } from './dto/query-deployment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { ModuleGuard } from '../../common/guards/module.guard';

@ApiTags('deployments')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('SOFTWARE_MGMT')
@Controller('deployments')
export class DeploymentController {
  constructor(private readonly service: DeploymentService) {}

  @ApiOperation({ summary: 'List all deployments' })
  @Get()
  list(@Query() query: QueryDeploymentDto) {
    return this.service.list(query);
  }

  @ApiOperation({ summary: 'Get deployment detail with docs progress' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Create deployment — auto-creates DeploymentDoc records from active DocTypes' })
  @Roles('ADMIN', 'OPERATOR')
  @Post()
  create(@Body() dto: CreateDeploymentDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update deployment' })
  @Roles('ADMIN', 'OPERATOR')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDeploymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @ApiOperation({ summary: 'Delete deployment (soft delete)' })
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ─── DeploymentDoc file endpoints ─────────────────────────────────────────

  @ApiOperation({ summary: 'Upload preview file for a deployment document (.pdf, .docx, .xlsx — max 20MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @Roles('ADMIN', 'OPERATOR')
  @Post(':id/docs/:docTypeId/preview')
  @UseInterceptors(FileInterceptor('file', { storage: undefined, limits: { fileSize: 20 * 1024 * 1024 } }))
  uploadPreview(
    @Param('id') id: string,
    @Param('docTypeId') docTypeId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.uploadPreview(id, docTypeId, file, userId);
  }

  @ApiOperation({ summary: 'Upload final PDF for a deployment document (PDF only — max 20MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @Roles('ADMIN', 'OPERATOR')
  @Post(':id/docs/:docTypeId/final')
  @UseInterceptors(FileInterceptor('file', { storage: undefined, limits: { fileSize: 20 * 1024 * 1024 } }))
  uploadFinal(
    @Param('id') id: string,
    @Param('docTypeId') docTypeId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.uploadFinal(id, docTypeId, file, userId);
  }

  @ApiOperation({ summary: 'Waive a deployment document (provide reason)' })
  @Roles('ADMIN', 'OPERATOR')
  @Patch(':id/docs/:docTypeId/waive')
  waiveDoc(
    @Param('id') id: string,
    @Param('docTypeId') docTypeId: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.waiveDoc(id, docTypeId, reason, userId);
  }

  @ApiOperation({ summary: 'Serve uploaded file (preview or final) — inline' })
  @Get(':id/docs/:docTypeId/file')
  serveFile(
    @Param('id') id: string,
    @Param('docTypeId') docTypeId: string,
    @Query('type') type: 'preview' | 'final' = 'final',
    @Res() res: Response,
  ) {
    return this.service.serveFile(id, docTypeId, type, res);
  }
}
