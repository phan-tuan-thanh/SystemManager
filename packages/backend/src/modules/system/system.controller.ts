import { Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { Public, Roles, CurrentUser } from '../../common/decorators';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Check system initialization status' })
  async getStatus() {
    return this.systemService.getStatus();
  }

  @Public()
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize system with default modules and user groups' })
  async initialize() {
    return this.systemService.initialize();
  }

  @Post('seed-demo')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed full demo data — servers, apps, deployments (Admin only)' })
  async seedDemo(@CurrentUser('id') _userId: string) {
    return this.systemService.seedDemoData();
  }

  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Global search: servers, applications, network configs by name/IP/domain' })
  async globalSearch(@Query('q') q: string) {
    return this.systemService.globalSearch(q);
  }
}
