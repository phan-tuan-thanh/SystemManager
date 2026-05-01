import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NetworkZoneService } from './network-zone.service';
import { CreateNetworkZoneDto } from './dto/create-network-zone.dto';
import { UpdateNetworkZoneDto } from './dto/update-network-zone.dto';
import { QueryNetworkZoneDto } from './dto/query-network-zone.dto';
import { CreateZoneIpDto } from './dto/create-zone-ip.dto';
import { BulkImportIpsDto } from './dto/bulk-import-ips.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Network Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('network-zones')
export class NetworkZoneController {
  constructor(private readonly service: NetworkZoneService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách phân vùng mạng' })
  findAll(@Query() query: QueryNetworkZoneDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phân vùng mạng (bao gồm danh sách IP)' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Tạo phân vùng mạng mới' })
  create(@Body() dto: CreateNetworkZoneDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Cập nhật phân vùng mạng' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNetworkZoneDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Xóa phân vùng mạng (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  // ─── ZoneIpEntry endpoints ───────────────────────────────────────

  @Get(':id/ips')
  @ApiOperation({ summary: 'Danh sách IP trong zone' })
  listIps(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listIps(id);
  }

  @Post(':id/ips')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Thêm IP vào zone' })
  addIp(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateZoneIpDto) {
    return this.service.addIp(id, dto);
  }

  @Post(':id/ips/bulk')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Import hàng loạt IP vào zone' })
  bulkImportIps(@Param('id', ParseUUIDPipe) id: string, @Body() dto: BulkImportIpsDto) {
    return this.service.bulkImportIps(id, dto);
  }

  @Delete(':zoneId/ips/:ipId')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Xóa IP khỏi zone' })
  removeIp(
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Param('ipId', ParseUUIDPipe) ipId: string,
  ) {
    return this.service.removeIp(zoneId, ipId);
  }
}
