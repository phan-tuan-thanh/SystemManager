import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInfraSystemDto } from './dto/create-infra-system.dto';
import { UpdateInfraSystemDto } from './dto/update-infra-system.dto';
import { QueryInfraSystemDto } from './dto/query-infra-system.dto';
import { GrantAccessDto } from './dto/grant-access.dto';
import { parse } from 'csv-parse/sync';

@Injectable()
export class InfraSystemService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryInfraSystemDto, userId: string, roles: string[]) {
    try {
      const { page, limit, search, sortBy, sortOrder } = query;
      const isAdmin = roles.includes('ADMIN');

      const where: any = { deleted_at: null };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        this.prisma.infraSystem.findMany({
          where,
          orderBy: { [sortBy || 'name']: sortBy ? (sortOrder || 'asc') : 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            _count: { select: { servers: { where: { deleted_at: null } } } },
          },
        }),
        this.prisma.infraSystem.count({ where }),
      ]);

      return {
        data: items.map((item) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description,
          created_at: item.created_at,
          updated_at: item.updated_at,
          server_count: item._count.servers,
        })),
        meta: { total, page, limit },
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string, roles: string[]) {
    const system = await this.prisma.infraSystem.findFirst({
      where: { id, deleted_at: null },
      include: {
        servers: {
          include: { server: true },
        },
        access: true,
      },
    });

    if (!system) {
      throw new NotFoundException(`InfraSystem with ID ${id} not found`);
    }

    // Check access
    const isAdmin = roles.includes('ADMIN');
    if (!isAdmin) {
      const userGroups = await this.prisma.userGroupMember.findMany({
        where: { user_id: userId },
        select: { group_id: true },
      });
      const groupIds = userGroups.map((m) => m.group_id);

      const hasAccess =
        system.access.some((a) => a.user_id === userId) ||
        system.access.some((a) => groupIds.includes(a.group_id));

      if (!hasAccess) {
        throw new NotFoundException('Access denied to this system');
      }
    }

    return {
      ...system,
      servers: system.servers.map((s) => s.server),
    };
  }

  async create(dto: CreateInfraSystemDto) {
    const existing = await this.prisma.infraSystem.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      if (!existing.deleted_at) {
        throw new ConflictException(`InfraSystem with code ${dto.code} already exists`);
      }
      // Restore soft-deleted record with new data
      return this.prisma.infraSystem.update({
        where: { id: existing.id },
        data: { ...dto, deleted_at: null },
      });
    }

    return this.prisma.infraSystem.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateInfraSystemDto) {
    const system = await this.prisma.infraSystem.findFirst({
      where: { id, deleted_at: null },
    });

    if (!system) {
      throw new NotFoundException(`InfraSystem with ID ${id} not found`);
    }

    // If code changed, check for duplicates
    if (dto.code && dto.code !== system.code) {
      const existing = await this.prisma.infraSystem.findUnique({
        where: { code: dto.code },
      });

      if (existing && !existing.deleted_at) {
        throw new ConflictException(`InfraSystem with code ${dto.code} already exists`);
      }
    }

    return this.prisma.infraSystem.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const system = await this.prisma.infraSystem.findFirst({
      where: { id, deleted_at: null },
    });

    if (!system) {
      throw new NotFoundException(`InfraSystem with ID ${id} not found`);
    }

    // Check both: direct FK (infra_system_id) and many-to-many join table
    const [directCount, linkCount] = await Promise.all([
      this.prisma.server.count({
        where: { infra_system_id: id, deleted_at: null },
      }),
      this.prisma.infraSystemServer.count({
        where: { system_id: id, server: { deleted_at: null } },
      }),
    ]);

    const serverCount = directCount + linkCount;
    if (serverCount > 0) {
      throw new ConflictException(
        `Hệ thống đang chứa ${serverCount} server, vui lòng gỡ server trước khi xóa`,
      );
    }

    return this.prisma.infraSystem.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async getAccess(id: string) {
    const system = await this.prisma.infraSystem.findFirst({
      where: { id, deleted_at: null },
    });

    if (!system) {
      throw new NotFoundException(`InfraSystem with ID ${id} not found`);
    }

    return this.prisma.infraSystemAccess.findMany({
      where: { system_id: id },
      include: {
        user: { select: { id: true, email: true, full_name: true } },
        group: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async grantAccess(systemId: string, dto: GrantAccessDto) {
    const system = await this.prisma.infraSystem.findFirst({
      where: { id: systemId, deleted_at: null },
    });

    if (!system) {
      throw new NotFoundException(`InfraSystem with ID ${systemId} not found`);
    }

    if (!dto.user_id && !dto.group_id) {
      throw new BadRequestException('Either user_id or group_id must be provided');
    }

    // Check for duplicate
    if (dto.user_id) {
      const existing = await this.prisma.infraSystemAccess.findFirst({
        where: { system_id: systemId, user_id: dto.user_id },
      });

      if (existing) {
        throw new ConflictException('User already has access to this system');
      }

      return this.prisma.infraSystemAccess.create({
        data: {
          system_id: systemId,
          user_id: dto.user_id,
        },
      });
    }

    if (dto.group_id) {
      const existing = await this.prisma.infraSystemAccess.findFirst({
        where: { system_id: systemId, group_id: dto.group_id },
      });

      if (existing) {
        throw new ConflictException('Group already has access to this system');
      }

      return this.prisma.infraSystemAccess.create({
        data: {
          system_id: systemId,
          group_id: dto.group_id,
        },
      });
    }
  }

  async revokeAccess(systemId: string, accessId: string) {
    const system = await this.prisma.infraSystem.findFirst({
      where: { id: systemId, deleted_at: null },
    });

    if (!system) {
      throw new NotFoundException(`InfraSystem with ID ${systemId} not found`);
    }

    const access = await this.prisma.infraSystemAccess.findFirst({
      where: { id: accessId, system_id: systemId },
    });

    if (!access) {
      throw new NotFoundException(`Access record not found`);
    }

    return this.prisma.infraSystemAccess.delete({
      where: { id: accessId },
    });
  }

  async importCsv(
    fileBuffer: Buffer,
    context: { environment?: string; site?: string; system_id?: string },
    userId: string,
  ) {
    const { environment, site, system_id } = context || {};
    const content = fileBuffer.toString('utf-8');

    let rows: any[];
    try {
      rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      throw new BadRequestException(`CSV parsing error: ${error.message}`);
    }

    const validEnvs = ['DEV', 'UAT', 'PROD'];
    const validSites = ['DC', 'DR', 'TEST'];

    const results = {
      servers: { created: [] as string[], duplicate: [] as string[] },
      apps: { created: [] as string[], duplicate: [] as string[] },
      errors: [] as { row: number; message: string }[]
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const { System, AppName, IP, Port, Url, Info, Environment, Site } = row;

        const effectiveEnv = environment && environment !== 'AUTOMATIC' ? environment : (Environment || 'DEV');
        const effectiveSite = site && site !== 'AUTOMATIC' ? site : (Site || 'DC');

        if (!validEnvs.includes(effectiveEnv.toUpperCase())) {
          throw new Error(`Invalid environment: ${effectiveEnv}`);
        }

        if (!validSites.includes(effectiveSite.toUpperCase())) {
          throw new Error(`Invalid site: ${effectiveSite}`);
        }

        if (!IP || !AppName || (!System && (!system_id || system_id === 'AUTOMATIC'))) {
          results.errors.push({
            row: i + 2, // +2 for 1-based index and header
            message: 'Missing required fields: System, AppName, IP',
          });
          continue;
        }

        // Create or find InfraSystem
        let infraSystem;
        let systemCode: string;

        if (system_id && system_id !== 'AUTOMATIC') {
          infraSystem = await this.prisma.infraSystem.findUnique({
            where: { id: system_id },
          });
          if (!infraSystem) throw new Error(`System not found with ID ${system_id}`);
          systemCode = infraSystem.code;
        } else {
          systemCode = System.toUpperCase().replace(/\s+/g, '_').substring(0, 50);
          infraSystem = await this.prisma.infraSystem.findUnique({
            where: { code: systemCode },
          });

          if (!infraSystem) {
            infraSystem = await this.prisma.infraSystem.create({
              data: {
                code: systemCode,
                name: System,
                description: `Auto-imported system: ${System}`,
              },
            });
          }
        }

        // Create or find Server by IP
        let server = await this.prisma.server.findFirst({
          where: {
            deleted_at: null,
            network_configs: {
              some: { private_ip: IP },
            },
          },
          include: { network_configs: true },
        });

        if (!server) {
          // Create new server with selected environment and site
          server = await this.prisma.server.create({
            data: {
              code: `SRV_${IP.replace(/\./g, '_')}`.substring(0, 50),
              name: `Server ${IP}`,
              hostname: IP,
              environment: effectiveEnv.toUpperCase() as any, // Cast to enum
              site: effectiveSite.toUpperCase() as any,
              purpose: 'APP_SERVER',
              infra_type: 'VIRTUAL_MACHINE',
              infra_system_id: infraSystem.id,
              network_configs: {
                create: {
                  private_ip: IP,
                  interface: 'eth0',
                },
              },
            },
            include: { network_configs: true },
          });
          if (!results.servers.created.includes(server.hostname)) {
            results.servers.created.push(server.hostname);
          }
        } else {
          if (!results.servers.duplicate.includes(server.hostname)) {
            results.servers.duplicate.push(server.hostname);
          }
          // Attempt to patch infra_system_id if missing
          if (!server.infra_system_id) {
            await this.prisma.server.update({
              where: { id: server.id },
              data: { infra_system_id: infraSystem.id },
            });
          }
        }

        // Link Server to InfraSystem if not already linked
        const existingLink = await this.prisma.infraSystemServer.findFirst({
          where: {
            system_id: infraSystem.id,
            server_id: server.id,
          },
        });

        if (!existingLink) {
          await this.prisma.infraSystemServer.create({
            data: {
              system_id: infraSystem.id,
              server_id: server.id,
            },
          });
        }

        // Create or find ApplicationGroup for this system
        const appGroupCode = systemCode;
        let appGroup = await this.prisma.applicationGroup.findUnique({
          where: { code: appGroupCode },
        });

        if (!appGroup) {
          appGroup = await this.prisma.applicationGroup.create({
            data: {
              code: appGroupCode,
              name: System,
              description: `Auto-imported application group: ${System}`,
            },
          });
        }

        // Create or find Application
        const appCode = `${systemCode}_${AppName}`.substring(0, 50);
        let application = await this.prisma.application.findUnique({
          where: { code: appCode },
        });

        if (!application) {
          application = await this.prisma.application.create({
            data: {
              code: appCode,
              name: Info || AppName,
              group_id: appGroup.id,
              description: `Auto-imported application: ${AppName}`,
            },
          });
          if (!results.apps.created.includes(application.name)) {
            results.apps.created.push(application.name);
          }
        } else {
          if (!results.apps.duplicate.includes(application.name)) {
            results.apps.duplicate.push(application.name);
          }
        }

        // Create or find AppDeployment
        let appDeployment = await this.prisma.appDeployment.findFirst({
          where: {
            application_id: application.id,
            server_id: server.id,
            environment: effectiveEnv.toUpperCase() as any,
            deleted_at: null,
          },
        });

        if (!appDeployment) {
          appDeployment = await this.prisma.appDeployment.create({
            data: {
              application_id: application.id,
              server_id: server.id,
              environment: effectiveEnv.toUpperCase() as any,
              version: '1.0.0',
              status: 'RUNNING',
              title: `${Info || AppName} on ${IP}`,
            },
          });
        }

        // Create Port if port number provided
        if (Port) {
          const portNumber = parseInt(Port, 10);
          if (!isNaN(portNumber)) {
            const existingPort = await this.prisma.port.findFirst({
              where: {
                application_id: application.id,
                deployment_id: appDeployment.id,
                port_number: portNumber,
                deleted_at: null,
              },
            });

            if (!existingPort) {
              await this.prisma.port.create({
                data: {
                  application_id: application.id,
                  deployment_id: appDeployment.id,
                  port_number: portNumber,
                  protocol: Url && Url.startsWith('https') ? 'HTTPS' : 'HTTP',
                  service_name: AppName,
                  url: Url,
                },
              });
            }
          }
        }
      } catch (error) {
        results.errors.push({
          row: i + 2,
          message: error.message,
        });
      }
    }

    return results;
  }
}
