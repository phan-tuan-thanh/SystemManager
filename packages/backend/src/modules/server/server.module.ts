import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { ChangeHistoryModule } from '../change-history/change-history.module';
import { TopologyModule } from '../topology/topology.module';
import { ModuleGuard } from '../../common/guards/module.guard';

@Module({
  imports: [ChangeHistoryModule, TopologyModule],
  controllers: [ServerController],
  providers: [ServerService, ModuleGuard],
  exports: [ServerService],
})
export class ServerModule {}
