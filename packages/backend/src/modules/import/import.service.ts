import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import { randomBytes } from 'crypto';
import type { ImportPreviewResult, ImportRow, ImportConfirmDto } from './dto/import-upload.dto';

interface ServerRowDetail {
  serverAction: 'created' | 'updated';
  systemAction: 'created' | 'updated' | 'none';
  osAppAction: 'created' | 'reused' | 'none';
  hwCreated: number;
  hwUpdated: number;
}

interface ImportExecuteResult {
  summary: { total: number; succeeded: number; failed: number };
  breakdown: {
    systems: { created: number; updated: number };
    servers: { created: number; updated: number };
    os_apps: { created: number; reused: number };
    hardware: { created: number; updated: number };
  };
  errors: Array<{ row: number; name: string; ip: string; reason: string }>;
}

// In-memory session store for import previews (TTL: 10 minutes)
const importSessions = new Map<string, { result: ImportPreviewResult; expiresAt: Date }>();

const SERVER_COLUMNS = [
  'ip', 'name', 'system', 'system_name', 'description',
  'environment', 'site', 'os', 'cpu', 'ram', 'total_storage_gb',
  'hostname', 'code', 'purpose', 'status', 'infra_type',
];
const APPLICATION_COLUMNS = ['code', 'name', 'group_code', 'version', 'owner_team', 'application_type', 'description'];

const APP_HEADER_ALIASES: Record<string, string> = {
  'app_code': 'code',
  'application_code': 'code',
  'ma': 'code',
  'app_name': 'name',
  'application_name': 'name',
  'ten': 'name',
  'ten_ung_dung': 'name',
  'group': 'group_code',
  'nhom': 'group_code',
  'nhom_code': 'group_code',
  'ver': 'version',
  'phien_ban': 'version',
  'team': 'owner_team',
  'owner': 'owner_team',
  'don_vi': 'owner_team',
  'type': 'application_type',
  'loai': 'application_type',
  'app_type': 'application_type',
  'desc': 'description',
  'mo_ta': 'description',
};

const APP_TYPE_ALIASES: Record<string, 'BUSINESS' | 'SYSTEM'> = {
  business: 'BUSINESS',
  nghiep_vu: 'BUSINESS',
  'nghiệp_vụ': 'BUSINESS',
  system: 'SYSTEM',
  he_thong: 'SYSTEM',
  'hệ_thống': 'SYSTEM',
};
const DEPLOYMENT_COLUMNS = ['application_code', 'server_code', 'environment', 'version', 'status', 'deployer'];

const DEPLOYMENT_HEADER_ALIASES: Record<string, string> = {
  'app_code': 'application_code',
  'application': 'application_code',
  'server': 'server_code',
  'host': 'server_code',
  'host_code': 'server_code',
  'env': 'environment',
  'ver': 'version',
  'deployed_by': 'deployer',
  'team': 'deployer',
};

// Header aliases: map common spreadsheet header variants to canonical keys
const SERVER_HEADER_ALIASES: Record<string, string> = {
  'ip_address': 'ip',
  'ipaddress': 'ip',
  'private_ip': 'ip',
  'server_ip': 'ip',
  'server_name': 'name',
  'system_name': 'system_name',
  'total_storage_(gb)': 'total_storage_gb',
  'total_storage': 'total_storage_gb',
  'storage': 'total_storage_gb',
  'storage_gb': 'total_storage_gb',
  'ram_(gb)': 'ram',
  'ram_gb': 'ram',
  'cpu_(cores)': 'cpu',
  'cpu_cores': 'cpu',
  'operating_system': 'os',
  'he_dieu_hanh': 'os',
  'os_name': 'os',
};

// Environment alias: maps spreadsheet values to canonical enum
const ENV_ALIASES: Record<string, 'DEV' | 'UAT' | 'PROD'> = {
  live: 'PROD',
  prod: 'PROD',
  production: 'PROD',
  uat: 'UAT',
  staging: 'UAT',
  dev: 'DEV',
  development: 'DEV',
  test: 'DEV',
};

// Site alias
const SITE_ALIASES: Record<string, 'DC' | 'DR' | 'TEST'> = {
  dc: 'DC',
  datacenter: 'DC',
  dr: 'DR',
  test: 'TEST',
  none: 'TEST',
  '': 'TEST',
};

function normaliseIp(ip: string): string {
  return ip.trim();
}

function ipToCode(ip: string): string {
  return `SRV_${ip.replace(/\./g, '_')}`;
}

function toInt(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  async previewFile(
    buffer: Buffer,
    mimetype: string,
    originalname: string,
    type: 'server' | 'application' | 'deployment',
    environment?: string,
  ): Promise<ImportPreviewResult> {
    const rows = await this.parseFile(buffer, mimetype, originalname);
    const result = this.validateRows(rows, type, environment);

    const sessionId = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    importSessions.set(sessionId, { result: { ...result, session_id: sessionId }, expiresAt });

    // Cleanup expired sessions
    for (const [key, val] of importSessions.entries()) {
      if (val.expiresAt < new Date()) importSessions.delete(key);
    }

    return { ...result, session_id: sessionId };
  }

  async executeImport(dto: ImportConfirmDto, userId: string): Promise<ImportExecuteResult> {
    const session = importSessions.get(dto.session_id);
    if (!session) throw new NotFoundException('Import session expired or not found. Please re-upload the file.');
    if (session.expiresAt < new Date()) {
      importSessions.delete(dto.session_id);
      throw new BadRequestException('Import session has expired. Please re-upload the file.');
    }

    const { result } = session;
    importSessions.delete(dto.session_id);

    const validRows = result.rows.filter((r) => r.valid);
    const breakdown: ImportExecuteResult['breakdown'] = {
      systems: { created: 0, updated: 0 },
      servers: { created: 0, updated: 0 },
      os_apps: { created: 0, reused: 0 },
      hardware: { created: 0, updated: 0 },
    };
    const errors: ImportExecuteResult['errors'] = [];

    for (const row of validRows) {
      try {
        if (result.type === 'server') {
          const detail = await this.importServer(row, dto.os_resolution);
          if (detail.systemAction === 'created') breakdown.systems.created++;
          else if (detail.systemAction === 'updated') breakdown.systems.updated++;
          if (detail.serverAction === 'created') breakdown.servers.created++;
          else breakdown.servers.updated++;
          if (detail.osAppAction === 'created') breakdown.os_apps.created++;
          else if (detail.osAppAction === 'reused') breakdown.os_apps.reused++;
          breakdown.hardware.created += detail.hwCreated;
          breakdown.hardware.updated += detail.hwUpdated;
        } else if (result.type === 'application') {
          await this.importApplication(row);
          breakdown.servers.created++;
        } else if (result.type === 'deployment') {
          await this.importDeployment(row);
          breakdown.servers.created++;
        }
      } catch (err) {
        const d = row.data;
        errors.push({
          row: row.row,
          name: d['name'] ? String(d['name']) : `Row ${row.row}`,
          ip: d['ip'] ? String(d['ip']) : '—',
          reason: (err as Error).message,
        });
      }
    }

    const succeeded = validRows.length - errors.length;
    return {
      summary: { total: validRows.length, succeeded, failed: errors.length },
      breakdown,
      errors,
    };
  }

  private async importServer(row: ImportRow, osResolution?: Record<string, string>): Promise<ServerRowDetail> {
    const detail: ServerRowDetail = { serverAction: 'updated', systemAction: 'none', osAppAction: 'none', hwCreated: 0, hwUpdated: 0 };
    const d = row.data;
    const ip = normaliseIp(String(d['ip']));
    const name = String(d['name']);
    const code = d['code'] ? String(d['code']) : ipToCode(ip);
    const hostname = d['hostname'] ? String(d['hostname']) : name;

    const envRaw = d['environment'] ? String(d['environment']).toLowerCase() : '';
    const environment = ENV_ALIASES[envRaw] ?? 'DEV';

    const siteRaw = d['site'] ? String(d['site']).toLowerCase() : '';
    const site = SITE_ALIASES[siteRaw] ?? 'TEST';

    const description = d['description'] ? String(d['description']) : null;
    const osRaw = d['os'] ? String(d['os']) : null;

    // Upsert infra system if provided
    let infraSystemId: string | null = null;
    if (d['system']) {
      const sysCode = String(d['system']).trim();
      const sysName = d['system_name'] ? String(d['system_name']).trim() : sysCode;
      const existingSys = await this.prisma.infraSystem.findUnique({ where: { code: sysCode } });
      const sys = await this.prisma.infraSystem.upsert({
        where: { code: sysCode },
        create: { code: sysCode, name: sysName },
        update: { name: sysName, deleted_at: null },
      });
      detail.systemAction = existingSys ? 'updated' : 'created';
      infraSystemId = sys.id;
    }

    // Upsert server (by code)
    const existingServer = await this.prisma.server.findUnique({ where: { code } });
    detail.serverAction = existingServer ? 'updated' : 'created';
    const server = await this.prisma.server.upsert({
      where: { code },
      create: {
        code,
        name,
        hostname,
        purpose: String(d['purpose'] || 'APP_SERVER') as any,
        status: String(d['status'] || 'ACTIVE') as any,
        environment: environment as any,
        infra_type: String(d['infra_type'] || 'VIRTUAL_MACHINE') as any,
        site: site as any,
        description,
        infra_system_id: infraSystemId,
      },
      update: {
        name,
        hostname,
        environment: environment as any,
        site: site as any,
        description,
        ...(infraSystemId ? { infra_system_id: infraSystemId } : {}),
        deleted_at: null,
      },
      include: { current_os_install: true },
    });

    // Handle OS Lifecycle
    if (osRaw) {
      const osName = osRaw.trim();
      // Empty string means "create new" — treat same as no mapping
      const osAppId = osResolution?.[osName] || null;
      let osApp = osAppId
        ? await this.prisma.application.findUnique({ where: { id: osAppId, deleted_at: null } })
        : await this.prisma.application.findFirst({
            where: { name: osName, sw_type: 'OS' as any, deleted_at: null },
          });

      if (!osApp) {
        let group = await this.prisma.applicationGroup.findUnique({ where: { code: 'OS' } });
        if (!group) {
          group = await this.prisma.applicationGroup.create({
            data: { code: 'OS', name: 'Operating Systems', group_type: 'INFRASTRUCTURE' as any },
          });
        }
        const osCode = `OS_${osName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 40)}`;
        osApp = await this.prisma.application.upsert({
          where: { code: osCode },
          create: { code: osCode, name: osName, group_id: group.id, application_type: 'SYSTEM' as any, sw_type: 'OS' as any },
          update: { deleted_at: null },
        });
        detail.osAppAction = 'created';
      } else {
        detail.osAppAction = 'reused';
      }

      const current = server.current_os_install;
      if (!current || current.application_id !== osApp.id) {
        // New install or upgrade
        await this.prisma.$transaction(async (tx) => {
          if (current) {
            await tx.serverOsInstall.update({
              where: { id: current.id },
              data: { replaced_at: new Date() },
            });
          }
          const install = await tx.serverOsInstall.create({
            data: {
              server_id: server.id,
              application_id: osApp.id,
              version: 'LATEST', // Placeholder for imported OS version
              installed_at: new Date(),
              change_reason: current ? 'Import upgrade' : 'Initial import',
            },
          });
          await tx.server.update({
            where: { id: server.id },
            data: { current_os_install_id: install.id },
          });
        });
      }
    }

    // NetworkConfig: attach IP if not already present
    const existingNet = await this.prisma.networkConfig.findFirst({
      where: { server_id: server.id, private_ip: ip, deleted_at: null },
    });
    if (!existingNet) {
      await this.prisma.networkConfig.create({
        data: { server_id: server.id, private_ip: ip, interface: 'eth0' },
      });
    }

    // Hardware components (optional)
    const cpuCores = toInt(d['cpu']);
    const ramGb = toInt(d['ram']);
    const storageGb = toInt(d['total_storage_gb']);
    const hwEntries: Array<{ type: 'CPU' | 'RAM' | 'HDD'; specs: any }> = [];
    if (cpuCores != null) hwEntries.push({ type: 'CPU', specs: { cores: cpuCores } });
    if (ramGb != null) hwEntries.push({ type: 'RAM', specs: { gb: ramGb } });
    if (storageGb != null) hwEntries.push({ type: 'HDD', specs: { gb: storageGb } });

    for (const hw of hwEntries) {
      const existing = await this.prisma.hardwareComponent.findFirst({
        where: { server_id: server.id, type: hw.type as any, deleted_at: null },
      });
      if (existing) {
        await this.prisma.hardwareComponent.update({ where: { id: existing.id }, data: { specs: hw.specs } });
        detail.hwUpdated++;
      } else {
        await this.prisma.hardwareComponent.create({ data: { server_id: server.id, type: hw.type as any, specs: hw.specs } });
        detail.hwCreated++;
      }
    }

    return detail;
  }

  private async importApplication(row: ImportRow) {
    const d = row.data;
    const code = String(d['code']);
    const groupCode = String(d['group_code'] || 'DEFAULT');

    let group = await this.prisma.applicationGroup.findUnique({ where: { code: groupCode } });
    if (!group) {
      group = await this.prisma.applicationGroup.create({
        data: { code: groupCode, name: groupCode, group_type: 'BUSINESS' as any },
      });
    }

    const appTypeRaw = d['application_type'] ? String(d['application_type']).toLowerCase().replace(/\s+/g, '_') : '';
    const application_type =
      appTypeRaw === 'business' || appTypeRaw === 'system'
        ? (appTypeRaw.toUpperCase() as 'BUSINESS' | 'SYSTEM')
        : (APP_TYPE_ALIASES[appTypeRaw] ?? 'BUSINESS');

    await this.prisma.application.upsert({
      where: { code },
      create: {
        code,
        name: String(d['name'] || code),
        group_id: group.id,
        version: d['version'] ? String(d['version']) : null,
        owner_team: d['owner_team'] ? String(d['owner_team']) : null,
        description: d['description'] ? String(d['description']) : null,
        application_type: application_type as any,
      },
      update: {
        name: String(d['name'] || code),
        application_type: application_type as any,
        deleted_at: null,
      },
    });
  }

  private async importDeployment(row: ImportRow) {
    const d = row.data;
    const appCode = String(d['application_code']);
    const serverCode = String(d['server_code']);

    const app = await this.prisma.application.findUnique({ where: { code: appCode, deleted_at: null } });
    if (!app) throw new Error(`Application '${appCode}' not found`);

    const server = await this.prisma.server.findUnique({ where: { code: serverCode, deleted_at: null } });
    if (!server) throw new Error(`Server '${serverCode}' not found`);

    const environment = String(d['environment'] || 'DEV') as any;
    const version = String(d['version'] || '1.0.0');
    const status = String(d['status'] || 'RUNNING') as any;
    const deployer = d['deployer'] ? String(d['deployer']) : null;

    const existing = await this.prisma.appDeployment.findFirst({
      where: { application_id: app.id, server_id: server.id, environment, deleted_at: null },
    });

    if (existing) {
      await this.prisma.appDeployment.update({
        where: { id: existing.id },
        data: { version, status, deployer },
      });
    } else {
      await this.prisma.appDeployment.create({
        data: { application_id: app.id, server_id: server.id, environment, version, status, deployer },
      });
    }
  }

  private validateRows(
    rawRows: Record<string, string>[],
    type: 'server' | 'application' | 'deployment',
    environment?: string,
  ): Omit<ImportPreviewResult, 'session_id'> {
    const columns = type === 'server' ? SERVER_COLUMNS : type === 'application' ? APPLICATION_COLUMNS : DEPLOYMENT_COLUMNS;
    const requiredCols = type === 'server'
      ? ['ip', 'name']
      : type === 'application'
      ? ['code', 'name']
      : ['application_code', 'server_code', 'environment', 'version'];

    const rows: ImportRow[] = rawRows.map((raw, idx) => {
      const errors: string[] = [];
      const normalised: Record<string, string | number | undefined> = {};

      // Normalise column keys (trim, lowercase, replace spaces → underscores) and apply aliases
      for (const [k, v] of Object.entries(raw)) {
        const key = k.trim().toLowerCase().replace(/\s+/g, '_');
        const canonical =
          type === 'server' ? (SERVER_HEADER_ALIASES[key] ?? key)
          : type === 'application' ? (APP_HEADER_ALIASES[key] ?? key)
          : type === 'deployment' ? (DEPLOYMENT_HEADER_ALIASES[key] ?? key)
          : key;
        normalised[canonical] = typeof v === 'string' ? v.trim() : v;
      }

      // Override environment from query param if provided
      if (environment && type !== 'deployment') {
        normalised['environment'] = environment;
      }

      for (const col of requiredCols) {
        if (!normalised[col]) errors.push(`Missing required field: ${col}`);
      }

      // IP/code uniqueness is checked at execute time
      // row is 1-indexed data row (first data row = 1)
      return { row: idx + 1, data: normalised, errors, valid: errors.length === 0 };
    });

    return {
      type,
      total: rows.length,
      valid: rows.filter((r) => r.valid).length,
      invalid: rows.filter((r) => !r.valid).length,
      rows: rows.slice(0, 100), // preview cap 100 rows
      columns,
      os_resolution: type === 'server' ? this.calculateOsResolution(rows) : undefined,
    };
  }

  private calculateOsResolution(rows: ImportRow[]) {
    const uniqueOs = new Set<string>();
    rows.forEach((r) => {
      if (r.data['os']) uniqueOs.add(String(r.data['os']).trim());
    });

    return Array.from(uniqueOs).map((os) => ({
      raw: os,
      suggested_name: os,
      is_new: true, // Simplified for now, should ideally check DB
    }));
  }

  private async parseFile(
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ): Promise<Record<string, string>[]> {
    const ext = originalname.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || mimetype === 'text/csv' || mimetype === 'application/csv') {
      return parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    }

    if (ext === 'xlsx' || mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return this.parseExcel(buffer);
    }

    throw new BadRequestException('Unsupported file format. Please upload a .csv or .xlsx file.');
  }

  private async parseExcel(buffer: Buffer): Promise<Record<string, string>[]> {
    // Dynamic import to avoid load error if exceljs is not yet installed
    let Workbook: any;
    try {
      const exceljs = await import('exceljs');
      Workbook = exceljs.Workbook;
    } catch {
      throw new BadRequestException('Excel support not available. Please use CSV format or contact administrator.');
    }

    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new BadRequestException('Excel file has no worksheets.');

    const rows: Record<string, string>[] = [];
    const headers: string[] = [];

    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) {
        row.values.forEach((cell: any, idx: number) => {
          if (idx > 0) headers.push(String(cell ?? '').trim());
        });
        return;
      }
      const rowObj: Record<string, string> = {};
      row.values.forEach((cell: any, idx: number) => {
        if (idx > 0 && headers[idx - 1]) {
          rowObj[headers[idx - 1]] = cell != null ? String(cell) : '';
        }
      });
      if (Object.values(rowObj).some((v) => v !== '')) rows.push(rowObj);
    });

    return rows;
  }
}
