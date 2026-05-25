import { Module } from '@nestjs/common';
import { EnvironmentConfigController } from './environment-config.controller';
import { EnvironmentConfigService } from './environment-config.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EnvironmentConfigController],
  providers: [EnvironmentConfigService],
  exports: [EnvironmentConfigService],
})
export class EnvironmentConfigModule {}
