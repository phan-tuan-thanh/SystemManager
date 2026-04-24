import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocTypeService } from './doc-type.service';
import { CreateDocTypeDto } from './dto/create-doc-type.dto';
import { UpdateDocTypeDto } from './dto/update-doc-type.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { ModuleGuard } from '../../common/guards/module.guard';

@ApiTags('deployment-doc-types')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('DEPLOYMENT_DOCS')
@Controller('deployment-doc-types')
export class DocTypeController {
  constructor(private readonly service: DocTypeService) {}

  @ApiOperation({ summary: 'List all deployment document types' })
  @Get()
  list(@Query() query: PaginationDto) {
    return this.service.list(query);
  }

  @ApiOperation({ summary: 'Get deployment document type by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Create deployment document type (ADMIN only)' })
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateDocTypeDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update deployment document type (ADMIN only)' })
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocTypeDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Deactivate deployment document type (ADMIN only)' })
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
