import { Module } from '@nestjs/common';
import { PortController } from './port.controller';
import { PortService } from './port.service';
import { ModuleGuard } from '../../common/guards/module.guard';

@Module({
  controllers: [PortController],
  providers: [PortService, ModuleGuard],
  exports: [PortService],
})
export class PortModule {}
