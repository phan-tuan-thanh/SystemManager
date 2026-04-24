import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HardwareService } from './hardware.service';
import { QueryHardwareDto } from './dto/query-hardware.dto';
import { CreateHardwareDto } from './dto/create-hardware.dto';
import { UpdateHardwareDto } from './dto/update-hardware.dto';
import { AttachHardwareDto } from './dto/attach-hardware.dto';
import { CurrentUser, Roles, RequireModule } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Hardware')
@ApiBearerAuth()
@UseGuards(ModuleGuard)
@RequireModule('HARDWARE_MGMT')
@Controller('hardware')
export class HardwareController {
  constructor(private hardwareService: HardwareService) {}

  @Get()
  @ApiOperation({ summary: 'List hardware components with filter (server_id, type)' })
  async findAll(@Query() query: QueryHardwareDto) {
    return this.hardwareService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hardware component detail' })
  async findOne(@Param('id') id: string) {
    return this.hardwareService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Create hardware component and attach to server (Admin/Operator)' })
  async create(@Body() dto: CreateHardwareDto, @CurrentUser('id') userId: string) {
    return this.hardwareService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Update hardware component specs (Admin/Operator)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHardwareDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.hardwareService.update(id, dto, userId);
  }

  @Post(':id/attach')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach (move) hardware component to a server (Admin/Operator)' })
  async attach(
    @Param('id') id: string,
    @Body() dto: AttachHardwareDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.hardwareService.attach(id, dto, userId);
  }

  @Post(':id/detach')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detach and retire hardware component from server (Admin/Operator)' })
  async detach(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.hardwareService.detach(id, userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get hardware component change/attach history' })
  async getHistory(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.hardwareService.getHistory(id, query);
  }
}
