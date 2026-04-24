import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppGroupService } from './app-group.service';
import { CreateAppGroupDto } from './dto/create-app-group.dto';
import { UpdateAppGroupDto } from './dto/update-app-group.dto';
import { QueryAppGroupDto } from './dto/query-app-group.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';
import { ModuleGuard } from '../../common/guards/module.guard';

@ApiTags('app-groups')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('APP_GROUP')
@Controller('app-groups')
export class AppGroupController {
  constructor(private readonly service: AppGroupService) {}

  @ApiOperation({ summary: 'List all application groups' })
  @Get()
  list(@Query() query: QueryAppGroupDto) {
    return this.service.list(query);
  }

  @ApiOperation({ summary: 'Get application group by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Create application group' })
  @Roles('ADMIN', 'OPERATOR')
  @Post()
  create(@Body() dto: CreateAppGroupDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update application group' })
  @Roles('ADMIN', 'OPERATOR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppGroupDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete application group (soft delete)' })
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
