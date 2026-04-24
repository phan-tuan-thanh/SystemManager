import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PortService } from './port.service';
import { CreatePortDto } from './dto/create-port.dto';
import { UpdatePortDto } from './dto/update-port.dto';
import { QueryPortDto } from './dto/query-port.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { ModuleGuard } from '../../common/guards/module.guard';

@ApiTags('ports')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('PORT_MGMT')
@Controller('ports')
export class PortController {
  constructor(private readonly service: PortService) {}

  @ApiOperation({ summary: 'List all ports' })
  @Get()
  list(@Query() query: QueryPortDto) {
    return this.service.list(query);
  }

  @ApiOperation({ summary: 'Get port by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Create port — detects conflict (same server + port + protocol)' })
  @Roles('ADMIN', 'OPERATOR')
  @Post()
  create(@Body() dto: CreatePortDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update port' })
  @Roles('ADMIN', 'OPERATOR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePortDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete port (soft delete)' })
  @Roles('ADMIN', 'OPERATOR')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
