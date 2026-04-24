import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserGroupService } from './user-group.service';
import { QueryUserGroupDto } from './dto/query-user-group.dto';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { ManageMembersDto } from './dto/manage-members.dto';
import { Roles } from '../../common/decorators';

@ApiTags('User Groups')
@ApiBearerAuth()
@Controller('user-groups')
export class UserGroupController {
  constructor(private userGroupService: UserGroupService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all user groups (Admin only)' })
  async findAll(@Query() query: QueryUserGroupDto) {
    return this.userGroupService.findAll(query);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a user group (Admin only)' })
  async create(@Body() dto: CreateUserGroupDto) {
    return this.userGroupService.create(dto);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user group by ID (Admin only)' })
  async findOne(@Param('id') id: string) {
    return this.userGroupService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user group (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserGroupDto) {
    return this.userGroupService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete user group (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.userGroupService.remove(id);
  }

  @Get(':id/members')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'List members of a user group' })
  async getMembers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userGroupService.getMembers(id, page ? +page : 1, limit ? +limit : 20);
  }

  @Post(':id/members')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bulk add members to user group (Admin only)' })
  async addMembers(@Param('id') id: string, @Body() dto: ManageMembersDto) {
    return this.userGroupService.addMembers(id, dto);
  }

  @Delete(':id/members')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk remove members from user group (Admin only)' })
  async removeMembers(@Param('id') id: string, @Body() dto: ManageMembersDto) {
    return this.userGroupService.removeMembers(id, dto);
  }
}
