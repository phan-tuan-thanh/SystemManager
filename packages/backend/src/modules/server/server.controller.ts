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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServerService } from './server.service';
import { QueryServerDto } from './dto/query-server.dto';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { CreateOsInstallDto } from './dto/create-os-install.dto';
import { CurrentUser, Roles, RequireModule } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Servers')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('SERVER_MGMT')
@Controller('servers')
export class ServerController {
  constructor(private serverService: ServerService) {}

  @Get()
  @ApiOperation({ summary: 'List all servers with filter (env, status, infra_type, site)' })
  async findAll(@Query() query: QueryServerDto) {
    return this.serverService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get server detail with hardware, network, deployments' })
  async findOne(@Param('id') id: string) {
    return this.serverService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Create a new server (Admin/Operator only)' })
  async create(@Body() dto: CreateServerDto, @CurrentUser('id') userId: string) {
    return this.serverService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Update server details (Admin/Operator only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.serverService.update(id, dto, userId);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Update server status (ACTIVE/INACTIVE/MAINTENANCE) — triggers realtime subscription' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser('id') userId: string,
  ) {
    const allowed = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
    if (!allowed.includes(status)) throw new BadRequestException(`status must be one of: ${allowed.join(', ')}`);
    return this.serverService.updateStatus(id, status, userId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a server (Admin/Operator only)' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.serverService.remove(id, userId);
  }

  @Get(':id/change-history')
  @ApiOperation({ summary: 'Get server change history' })
  async getChangeHistory(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.serverService.getChangeHistory(id, query);
  }

  @Get(':id/applications')
  @ApiOperation({ summary: 'Get all applications currently deployed on this server' })
  async getApplications(@Param('id') id: string) {
    return this.serverService.getApplications(id);
  }

  @Post(':id/os-installs')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Install or upgrade OS on server' })
  async installOs(
    @Param('id') id: string,
    @Body() dto: CreateOsInstallDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.serverService.installOs(id, dto, userId);
  }

  @Get(':id/os-history')
  @ApiOperation({ summary: 'Get OS installation history for a server' })
  async getOsHistory(@Param('id') id: string) {
    return this.serverService.getOsHistory(id);
  }
}
