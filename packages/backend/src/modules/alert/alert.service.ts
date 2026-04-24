import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface SystemAlert {
  id: string;
  type: 'OS_EOL' | 'PORT_CONFLICT' | 'DEPLOYMENT_STOPPED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  detected_at: Date;
}

@Injectable()
export class AlertService {
  constructor(private prisma: PrismaService) {}

  async getAlerts(): Promise<SystemAlert[]> {
    const [eolAlerts, portConflictAlerts, stoppedAlerts] = await Promise.all([
      this.getOsEndOfSupportAlerts(),
      this.getPortConflictAlerts(),
      this.getStoppedDeploymentAlerts(),
    ]);
    return [...eolAlerts, ...portConflictAlerts, ...stoppedAlerts];
  }

  async getAlertSummary() {
    const alerts = await this.getAlerts();
    return {
      total: alerts.length,
      high: alerts.filter((a) => a.severity === 'HIGH').length,
      medium: alerts.filter((a) => a.severity === 'MEDIUM').length,
      low: alerts.filter((a) => a.severity === 'LOW').length,
      alerts,
    };
  }

  private async getOsEndOfSupportAlerts(): Promise<SystemAlert[]> {
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    const expiredSoftware = await this.prisma.systemSoftware.findMany({
      where: {
        deleted_at: null,
        eol_date: { lte: warningThreshold },
      },
      include: { group: true },
    });

    return expiredSoftware.map((sw) => {
      const isExpired = sw.eol_date! <= now;
      const daysLeft = Math.ceil((sw.eol_date!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: `eol-${sw.id}`,
        type: 'OS_EOL' as const,
        severity: isExpired ? 'HIGH' : daysLeft <= 30 ? 'HIGH' : 'MEDIUM',
        title: isExpired ? `${sw.name} End-of-Support Expired` : `${sw.name} Approaching End-of-Support`,
        message: isExpired
          ? `${sw.name} ${sw.version || ''} reached end-of-support on ${sw.eol_date!.toISOString().split('T')[0]}. Immediate action required.`
          : `${sw.name} ${sw.version || ''} reaches end-of-support in ${daysLeft} days (${sw.eol_date!.toISOString().split('T')[0]}).`,
        resource_type: 'SYSTEM_SOFTWARE',
        resource_id: sw.id,
        resource_name: `${sw.name} ${sw.version || ''}`.trim(),
        detected_at: now,
      };
    });
  }

  private async getPortConflictAlerts(): Promise<SystemAlert[]> {
    // Find ports on the same deployment+server that share port_number+protocol
    const deployments = await this.prisma.appDeployment.findMany({
      where: { deleted_at: null },
      include: {
        ports: { where: { deleted_at: null } },
        server: true,
        application: true,
      },
    });

    const conflicts: SystemAlert[] = [];
    const seen = new Map<string, string>();

    for (const dep of deployments) {
      for (const port of dep.ports) {
        const key = `${dep.server_id}:${port.port_number}:${port.protocol}`;
        if (seen.has(key)) {
          conflicts.push({
            id: `port-conflict-${port.id}`,
            type: 'PORT_CONFLICT' as const,
            severity: 'HIGH',
            title: `Port Conflict: ${port.port_number}/${port.protocol} on ${dep.server.name}`,
            message: `Port ${port.port_number}/${port.protocol} is used by multiple deployments on server '${dep.server.name}'.`,
            resource_type: 'PORT',
            resource_id: port.id,
            resource_name: `${dep.server.name}:${port.port_number}/${port.protocol}`,
            detected_at: new Date(),
          });
        } else {
          seen.set(key, port.id);
        }
      }
    }
    return conflicts;
  }

  private async getStoppedDeploymentAlerts(): Promise<SystemAlert[]> {
    const stopped = await this.prisma.appDeployment.findMany({
      where: { status: 'STOPPED', deleted_at: null },
      include: { application: true, server: true },
      take: 20,
      orderBy: { updated_at: 'desc' },
    });

    return stopped.map((dep) => ({
      id: `stopped-${dep.id}`,
      type: 'DEPLOYMENT_STOPPED' as const,
      severity: 'LOW',
      title: `Stopped Deployment: ${dep.application.name}`,
      message: `${dep.application.name} v${dep.version} is STOPPED on ${dep.server.name} (${dep.environment}).`,
      resource_type: 'DEPLOYMENT',
      resource_id: dep.id,
      resource_name: `${dep.application.name} on ${dep.server.name}`,
      detected_at: dep.updated_at,
    }));
  }
}
