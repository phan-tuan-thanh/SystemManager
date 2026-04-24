import { Injectable } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateSystemSoftwareDto } from './dto/create-system-software.dto';
import { UpdateSystemSoftwareDto } from './dto/update-system-software.dto';
import { QuerySystemSoftwareDto } from './dto/query-system-software.dto';

function generateCode(name: string): string {
  return 'SW_' + name.toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
}

@Injectable()
export class SystemSoftwareService {
  constructor(private applicationService: ApplicationService) {}

  async list(query: QuerySystemSoftwareDto) {
    return this.applicationService.list({
      ...query,
      application_type: 'SYSTEM',
    } as any);
  }

  async findOne(id: string) {
    return this.applicationService.findOne(id);
  }

  async create(dto: CreateSystemSoftwareDto) {
    const code = generateCode(dto.name);
    return this.applicationService.create({
      group_id: dto.group_id,
      code,
      name: dto.name,
      version: dto.version,
      sw_type: dto.sw_type as any,
      eol_date: dto.eol_date,
      application_type: 'SYSTEM',
    });
  }

  async update(id: string, dto: UpdateSystemSoftwareDto) {
    return this.applicationService.update(id, {
      name: dto.name,
      version: dto.version,
      sw_type: dto.sw_type as any,
      eol_date: dto.eol_date,
      vendor: (dto as any).vendor,
    });
  }

  async remove(id: string) {
    return this.applicationService.remove(id);
  }
}
