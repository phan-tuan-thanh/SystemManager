import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { UserGroupModule } from './modules/user-group/user-group.module';
import { ModuleConfigModule } from './modules/module-config/module-config.module';
import { AuditModule } from './modules/audit/audit.module';
import { SystemModule } from './modules/system/system.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { ServerModule } from './modules/server/server.module';
import { HardwareModule } from './modules/hardware/hardware.module';
import { NetworkModule } from './modules/network/network.module';
import { AppGroupModule } from './modules/app-group/app-group.module';
import { ApplicationModule } from './modules/application/application.module';
import { DeploymentModule } from './modules/deployment/deployment.module';
import { PortModule } from './modules/port/port.module';
import { ConnectionModule } from './modules/connection/connection.module';
import { TopologyModule } from './modules/topology/topology.module';
import { SnapshotModule } from './modules/snapshot/snapshot.module';
import { InfraSystemModule } from './modules/infra-system/infra-system.module';
import { ChangeSetModule } from './modules/changeset/changeset.module';
import { ImportModule } from './modules/import/import.module';
import { AlertModule } from './modules/alert/alert.module';
import { HelpModule } from './modules/help/help.module';
import { NetworkZoneModule } from './modules/network-zone/network-zone.module';
import { FirewallRuleModule } from './modules/firewall-rule/firewall-rule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      path: '/graphql',
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': false,
      },
    }),
    PrismaModule,
    LoggerModule,
    AuthModule,
    UserModule,
    UserGroupModule,
    ModuleConfigModule,
    AuditModule,
    SystemModule,
    SystemConfigModule,
    ServerModule,
    HardwareModule,
    NetworkModule,
    AppGroupModule,
    ApplicationModule,
    DeploymentModule,
    PortModule,
    ConnectionModule,
    TopologyModule,
    SnapshotModule,
    InfraSystemModule,
    ChangeSetModule,
    ImportModule,
    AlertModule,
    HelpModule,
    NetworkZoneModule,
    FirewallRuleModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
