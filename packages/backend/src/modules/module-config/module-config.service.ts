import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ModuleConfigService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.moduleConfig.findMany({
      orderBy: [{ module_type: 'asc' }, { display_name: 'asc' }],
    });
  }

  async findOne(moduleKey: string) {
    const config = await this.prisma.moduleConfig.findUnique({
      where: { module_key: moduleKey },
    });
    if (!config) {
      throw new NotFoundException(`Module '${moduleKey}' not found`);
    }
    return config;
  }

  async toggle(moduleKey: string, userId: string) {
    const config = await this.findOne(moduleKey);

    if (config.module_type === 'CORE') {
      throw new BadRequestException('CORE modules cannot be toggled');
    }

    if (config.status === 'ENABLED') {
      // Check if any other enabled module depends on this one
      const dependents = await this.prisma.moduleConfig.findMany({
        where: {
          status: 'ENABLED',
          dependencies: { has: moduleKey },
        },
      });

      if (dependents.length > 0) {
        const names = dependents.map((d) => d.display_name).join(', ');
        throw new BadRequestException(
          `Cannot disable: modules [${names}] depend on this module`,
        );
      }
    } else {
      // Check all dependencies are enabled
      if (config.dependencies.length > 0) {
        const deps = await this.prisma.moduleConfig.findMany({
          where: { module_key: { in: config.dependencies } },
        });

        const disabled = deps.filter((d) => d.status === 'DISABLED');
        if (disabled.length > 0) {
          const names = disabled.map((d) => d.display_name).join(', ');
          throw new BadRequestException(
            `Cannot enable: dependencies [${names}] must be enabled first`,
          );
        }
      }
    }

    const newStatus = config.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';

    return this.prisma.moduleConfig.update({
      where: { module_key: moduleKey },
      data: { status: newStatus, updated_by: userId },
    });
  }

  async isEnabled(moduleKey: string): Promise<boolean> {
    const config = await this.prisma.moduleConfig.findUnique({
      where: { module_key: moduleKey },
    });
    return config?.status === 'ENABLED';
  }
}
