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
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { InfraSystemService } from './infra-system.service';
import { QueryInfraSystemDto } from './dto/query-infra-system.dto';
import { CreateInfraSystemDto } from './dto/create-infra-system.dto';
import { UpdateInfraSystemDto } from './dto/update-infra-system.dto';
import { GrantAccessDto } from './dto/grant-access.dto';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Infra Systems')
@ApiBearerAuth()
// @UseGuards(ModuleGuard)  // Temporarily disabled for debugging
// @RequireModule('INFRA_SYSTEM')  // Temporarily disabled for debugging
@Controller('infra-systems')
export class InfraSystemController {
  constructor(private infraSystemService: InfraSystemService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  test() {
    return { message: 'test OK' };
  }

  @Get()
  @ApiOperation({ summary: 'List all systems (filtered by access for non-ADMIN users)' })
  async findAll(
    @Query() query: QueryInfraSystemDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    console.log('findAll called with query:', query, 'userId:', userId, 'roles:', roles);
    try {
      const result = await this.infraSystemService.findAll(query, userId, roles);
      console.log('findAll result:', result);
      return result;
    } catch (error) {
      console.error('findAll error:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get system detail with servers' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    return this.infraSystemService.findOne(id, userId, roles);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new system (Admin only)' })
  async create(@Body() dto: CreateInfraSystemDto) {
    return this.infraSystemService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Update system details (Admin/Operator with access only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInfraSystemDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    // For operators, verify access
    if (!roles.includes('ADMIN')) {
      await this.infraSystemService.findOne(id, userId, roles);
    }
    return this.infraSystemService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a system (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.infraSystemService.remove(id);
  }

  @Get(':id/access')
  @ApiOperation({ summary: 'Get system access grants' })
  async getAccess(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    // Verify access
    if (!roles.includes('ADMIN')) {
      await this.infraSystemService.findOne(id, userId, roles);
    }
    return this.infraSystemService.getAccess(id);
  }

  @Post(':id/access')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Grant access to user or group (Admin only)' })
  async grantAccess(@Param('id') id: string, @Body() dto: GrantAccessDto) {
    return this.infraSystemService.grantAccess(id, dto);
  }

  @Delete(':id/access/:accessId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke access from user or group (Admin only)' })
  async revokeAccess(@Param('id') id: string, @Param('accessId') accessId: string) {
    return this.infraSystemService.revokeAccess(id, accessId);
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Download CSV template for import' })
  getImportTemplate(@Res() res: any) {
    const header = "Environment,Site,System,AppName,Code,IP,Port,Url,Protocol,Description\n";
    const sample = "DEV,DC,BPM_PROCESS_CENTER,IBM Console,IBM_CONSOLE,10.1.51.75,9043,https://10.1.51.75:9043,HTTPS,Console quản trị\n";
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=infra_import_template.csv');
    res.send(header + sample);
  }

  @Post('import')
  @Roles('ADMIN', 'OPERATOR')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with columns: Environment, Site, System, AppName, IP, Port, Url... etc',
        },
        environment: {
          type: 'string',
          description: 'Target environment or AUTOMATIC',
        },
        site: {
          type: 'string',
          description: 'Target site or AUTOMATIC',
        },
        system_id: {
          type: 'string',
          description: 'Target system ID or AUTOMATIC',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Import systems, servers, and applications from CSV with contextual overrides' })
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('environment') environment: string = 'AUTOMATIC',
    @Body('site') site: string = 'AUTOMATIC',
    @Body('system_id') system_id: string = 'AUTOMATIC',
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new Error('File must be a CSV');
    }

    return this.infraSystemService.importCsv(file.buffer, { environment, site, system_id }, userId);
  }
}
