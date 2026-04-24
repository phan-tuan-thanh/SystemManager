import { Module } from '@nestjs/common';
import { InfraSystemController } from './infra-system.controller';
import { InfraSystemService } from './infra-system.service';
import { ModuleGuard } from '../../common/guards/module.guard';

@Module({
  controllers: [InfraSystemController],
  providers: [InfraSystemService, ModuleGuard],
  exports: [InfraSystemService],
})
export class InfraSystemModule {}
