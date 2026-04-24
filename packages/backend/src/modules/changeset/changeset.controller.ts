import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChangeSetService } from './changeset.service';
import { CreateChangeSetDto } from './dto/create-changeset.dto';
import { CreateChangeItemDto } from './dto/create-change-item.dto';
import { QueryChangeSetDto } from './dto/query-changeset.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ModuleGuard } from '../../common/guards/module.guard';
import { RequireModule } from '../../common/decorators/require-module.decorator';

@ApiTags('ChangeSets')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('CHANGESET')
@Controller('changesets')
export class ChangeSetController {
  constructor(private readonly svc: ChangeSetService) {}

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Create a new draft ChangeSet' })
  create(@Body() dto: CreateChangeSetDto, @CurrentUser('id') userId: string) {
    return this.svc.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List ChangeSets with filter (status, env, creator) and pagination' })
  findAll(@Query() query: QueryChangeSetDto) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ChangeSet by ID with all ChangeItems' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id/discard')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Discard a draft ChangeSet (status → DISCARDED)' })
  discard(@Param('id') id: string) {
    return this.svc.discard(id);
  }

  @Post(':id/items')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Add a ChangeItem to a DRAFT ChangeSet' })
  addItem(@Param('id') changesetId: string, @Body() dto: CreateChangeItemDto) {
    return this.svc.addItem(changesetId, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a ChangeItem from a DRAFT ChangeSet' })
  removeItem(@Param('id') changesetId: string, @Param('itemId') itemId: string) {
    return this.svc.removeItem(changesetId, itemId);
  }

  @Post(':id/preview')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({
    summary: 'Preview topology with ChangeItems overlaid — returns virtual topology diff + conflict warnings',
  })
  preview(@Param('id') id: string) {
    return this.svc.preview(id);
  }

  @Post(':id/apply')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({
    summary: 'Apply ChangeSet — ACID transaction commits all ChangeItems to live data + auto-snapshot',
  })
  apply(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.apply(id, userId);
  }
}
