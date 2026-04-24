import { Module } from '@nestjs/common';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import { ModuleGuard } from '../../common/guards/module.guard';

@Module({
  controllers: [NetworkController],
  providers: [NetworkService, ModuleGuard],
  exports: [NetworkService],
})
export class NetworkModule {}
