import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SnapshotService } from './snapshot.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { QuerySnapshotDto } from './dto/query-snapshot.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ModuleGuard } from '../../common/guards/module.guard';
import { RequireModule } from '../../common/decorators/require-module.decorator';

@ApiTags('Topology Snapshots')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('TOPOLOGY_2D')
@Controller('api/v1/topology-snapshots')
export class SnapshotController {
  constructor(private readonly snapshotService: SnapshotService) {}

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Create a topology snapshot for the current state' })
  create(
    @Body() dto: CreateSnapshotDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.snapshotService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List topology snapshots (paginated, filter by env)' })
  findAll(@Query() query: QuerySnapshotDto) {
    return this.snapshotService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a snapshot by ID (includes full payload)' })
  findOne(@Param('id') id: string) {
    return this.snapshotService.findOne(id);
  }
}
