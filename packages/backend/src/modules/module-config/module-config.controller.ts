import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModuleConfigService } from './module-config.service';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('Module Config')
@ApiBearerAuth()
@Controller('module-configs')
export class ModuleConfigController {
  constructor(private moduleConfigService: ModuleConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List all module configurations' })
  async findAll() {
    return this.moduleConfigService.findAll();
  }

  @Get(':moduleKey')
  @ApiOperation({ summary: 'Get module config by key' })
  async findOne(@Param('moduleKey') moduleKey: string) {
    return this.moduleConfigService.findOne(moduleKey);
  }

  @Patch(':moduleKey/toggle')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toggle module on/off (Admin only)' })
  async toggle(
    @Param('moduleKey') moduleKey: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.moduleConfigService.toggle(moduleKey, userId);
  }
}
