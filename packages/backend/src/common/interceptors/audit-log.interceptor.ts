import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../logger/app-logger.service';
// Using string literals instead of Prisma enums until client is generated
type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ENABLE_MODULE'
  | 'DISABLE_MODULE'
  | 'VIEW_SENSITIVE';
type AuditResult = 'SUCCESS' | 'FAILED';

const METHOD_ACTION_MAP: Record<string, AuditAction> = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private logger: AppLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // GraphQL contexts have no HTTP request — audit logging is REST-only
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const action = METHOD_ACTION_MAP[method];

    if (!action) {
      return next.handle();
    }

    const userId = request.user?.id ?? null;
    const resourceType = this.extractResourceType(request.path);
    const resourceId = request.params?.id ?? null;
    const ip = request.ip;
    const userAgent = request.get('user-agent') ?? null;

    return next.handle().pipe(
      tap(() => {
        this.log(userId, action, resourceType, resourceId, ip, userAgent, 'SUCCESS');
      }),
      catchError((error) => {
        this.log(userId, action, resourceType, resourceId, ip, userAgent, 'FAILED');
        throw error;
      }),
    );
  }

  private extractResourceType(path: string): string {
    const segments = path.replace(/^\/api\/v1\//, '').split('/');
    return segments[0] || 'unknown';
  }

  private log(
    userId: string | null,
    action: AuditAction,
    resourceType: string,
    resourceId: string | null,
    ip: string,
    userAgent: string | null,
    result: AuditResult,
  ) {
    this.prisma.auditLog
      .create({
        data: {
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          ip_address: ip,
          user_agent: userAgent,
          result,
        },
      })
      .catch((err) => {
        this.logger.error('Failed to write audit log', String(err), 'AuditLogInterceptor');
      });
  }
}
