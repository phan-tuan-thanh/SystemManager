import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, Optional,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { ModuleGuard } from '../../common/guards/module.guard';
import { ConnectionService } from '../connection/connection.service';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('SOFTWARE_MGMT')
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly service: ApplicationService,
    @Optional() private readonly connectionService: ConnectionService,
  ) {}

  @ApiOperation({ summary: 'List all applications' })
  @Get()
  list(@Query() query: QueryApplicationDto) {
    return this.service.list(query);
  }

  @ApiOperation({ summary: 'Get application detail with group and active deployments' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Get servers where this application is currently running' })
  @Get(':id/where-running')
  whereRunning(@Param('id') id: string) {
    return this.service.whereRunning(id);
  }

  @ApiOperation({ summary: 'Get change history for an application' })
  @Get(':id/change-history')
  getHistory(@Param('id') id: string) {
    return this.service.getHistory(id);
  }

  @ApiOperation({ summary: 'Get upstream and downstream dependencies for an application' })
  @ApiQuery({ name: 'environment', required: false, enum: ['DEV', 'UAT', 'PROD'] })
  @Get(':id/dependencies')
  getDependencies(@Param('id') id: string, @Query('environment') environment?: string) {
    return this.connectionService.getDependencies(id, environment);
  }

  @ApiOperation({ summary: 'Create application' })
  @Roles('ADMIN', 'OPERATOR')
  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update application' })
  @Roles('ADMIN', 'OPERATOR')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @ApiOperation({ summary: 'Delete application (soft delete)' })
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
