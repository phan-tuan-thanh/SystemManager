import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SystemSoftwareService } from './system-software.service';
import { CreateSystemSoftwareDto } from './dto/create-system-software.dto';
import { UpdateSystemSoftwareDto } from './dto/update-system-software.dto';
import { QuerySystemSoftwareDto } from './dto/query-system-software.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { ModuleGuard } from '../../common/guards/module.guard';

@ApiTags('system-software')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('SOFTWARE_MGMT')
@Controller('system-software')
export class SystemSoftwareController {
  constructor(private readonly service: SystemSoftwareService) {}

  @ApiOperation({ summary: 'List all system software' })
  @Get()
  list(@Query() query: QuerySystemSoftwareDto) {
    return this.service.list(query);
  }

  @ApiOperation({ summary: 'Get system software by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Create system software' })
  @Roles('ADMIN', 'OPERATOR')
  @Post()
  create(@Body() dto: CreateSystemSoftwareDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update system software' })
  @Roles('ADMIN', 'OPERATOR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSystemSoftwareDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete system software (soft delete)' })
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
