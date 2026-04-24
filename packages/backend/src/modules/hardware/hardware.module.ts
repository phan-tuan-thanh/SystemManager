import { Module } from '@nestjs/common';
import { HardwareController } from './hardware.controller';
import { HardwareService } from './hardware.service';
import { ChangeHistoryModule } from '../change-history/change-history.module';
import { ModuleGuard } from '../../common/guards/module.guard';

@Module({
  imports: [ChangeHistoryModule],
  controllers: [HardwareController],
  providers: [HardwareService, ModuleGuard],
  exports: [HardwareService],
})
export class HardwareModule {}
