import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ConnectionService } from './connection.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { QueryConnectionDto } from './dto/query-connection.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { ModuleGuard } from '../../common/guards/module.guard';

@ApiTags('connections')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('CONNECTION_MGMT')
@Controller('connections')
export class ConnectionController {
  constructor(private readonly service: ConnectionService) {}

  @ApiOperation({ summary: 'List app connections — filter by env, source, target, protocol' })
  @Get()
  list(@Query() query: QueryConnectionDto) {
    return this.service.list(query);
  }

  @ApiOperation({ summary: 'Get connection by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Create app connection' })
  @Roles('ADMIN', 'OPERATOR')
  @Post()
  create(@Body() dto: CreateConnectionDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update app connection' })
  @Roles('ADMIN', 'OPERATOR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConnectionDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete connection (soft delete)' })
  @Roles('ADMIN', 'OPERATOR')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
