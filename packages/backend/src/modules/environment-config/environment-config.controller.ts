import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EnvironmentConfigService } from './environment-config.service';
import { CreateEnvironmentConfigDto } from './dto/create-environment-config.dto';
import { UpdateEnvironmentConfigDto } from './dto/update-environment-config.dto';
import { ReorderEnvironmentConfigDto } from './dto/reorder-environment-config.dto';
import { Roles, Public } from '../../common/decorators';

@ApiTags('Environments')
@ApiBearerAuth()
@Controller('environments')
export class EnvironmentConfigController {
  constructor(private readonly service: EnvironmentConfigService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all environments (active only by default)' })
  @ApiQuery({ name: 'all', required: false, type: Boolean })
  findAll(@Query('all') all?: string) {
    return this.service.findAll(all !== 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get environment by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new environment (ADMIN)' })
  create(@Body() dto: CreateEnvironmentConfigDto) {
    return this.service.create(dto);
  }

  @Patch('reorder')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reorder environments (ADMIN)' })
  reorder(@Body() dto: ReorderEnvironmentConfigDto) {
    return this.service.reorder(dto.codes);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update environment (ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateEnvironmentConfigDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Deactivate environment (ADMIN) — safe delete with in-use check' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
