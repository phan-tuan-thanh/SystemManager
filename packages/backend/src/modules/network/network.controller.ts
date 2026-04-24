import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NetworkService } from './network.service';
import { CreateNetworkConfigDto } from './dto/create-network-config.dto';
import { UpdateNetworkConfigDto } from './dto/update-network-config.dto';
import { QueryNetworkConfigDto } from './dto/query-network-config.dto';
import { Roles, RequireModule } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';

@ApiTags('Network Configs')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('NETWORK_MGMT')
@Controller('network-configs')
export class NetworkController {
  constructor(private networkService: NetworkService) {}

  @Get()
  @ApiOperation({ summary: 'List network configs with filter (server_id, environment, ip)' })
  async findAll(@Query() query: QueryNetworkConfigDto) {
    return this.networkService.findAll(query);
  }

  @Get('lookup-domain')
  @ApiOperation({ summary: 'Lookup domain → server → apps' })
  @ApiQuery({ name: 'domain', required: true })
  async lookupDomain(@Query('domain') domain: string) {
    return this.networkService.lookupDomain(domain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get network config by ID' })
  async findOne(@Param('id') id: string) {
    return this.networkService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Create network config with IP conflict detection (Admin/Operator only)' })
  async create(@Body() dto: CreateNetworkConfigDto) {
    return this.networkService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Update network config with conflict check (Admin/Operator only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateNetworkConfigDto) {
    return this.networkService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete network config (Admin/Operator only)' })
  async remove(@Param('id') id: string) {
    return this.networkService.remove(id);
  }
}
