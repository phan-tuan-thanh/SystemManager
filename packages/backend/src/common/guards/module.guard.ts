import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MODULE_KEY } from '../decorators/require-module.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleKey = this.reflector.getAllAndOverride<string>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!moduleKey) {
      return true;
    }

    const moduleConfig = await this.prisma.moduleConfig.findUnique({
      where: { module_key: moduleKey },
    });

    if (!moduleConfig || moduleConfig.status === 'DISABLED') {
      throw new ForbiddenException(
        `Module '${moduleKey}' is currently disabled`,
      );
    }

    return true;
  }
}
