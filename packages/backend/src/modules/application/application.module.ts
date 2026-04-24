import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { SystemSoftwareController } from './system-software.controller';
import { SystemSoftwareService } from './system-software.service';
import { ChangeHistoryModule } from '../change-history/change-history.module';
import { ConnectionModule } from '../connection/connection.module';
import { ModuleGuard } from '../../common/guards/module.guard';

@Module({
  imports: [ChangeHistoryModule, ConnectionModule],
  controllers: [ApplicationController, SystemSoftwareController],
  providers: [ApplicationService, SystemSoftwareService, ModuleGuard],
  exports: [ApplicationService],
})
export class ApplicationModule {}
