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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new local user (Admin only)' })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user full_name, status, avatar (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Post(':id/roles')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign a role to user (Admin only)' })
  async assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.userService.assignRole(id, dto);
  }

  @Delete(':id/roles/:role')
  @Roles('ADMIN')
  @ApiParam({ name: 'role', enum: ['ADMIN', 'OPERATOR', 'VIEWER'] })
  @ApiOperation({ summary: 'Remove a role from user (Admin only)' })
  async removeRole(@Param('id') id: string, @Param('role') role: string) {
    return this.userService.removeRole(id, role);
  }

  @Post(':id/reset-password')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password (Admin only)' })
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(id, dto);
  }

  @Get(':id/login-history')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user login history (Admin only)' })
  async getLoginHistory(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.getLoginHistory(id, page ? +page : 1, limit ? +limit : 20);
  }
}
