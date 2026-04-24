import { Module } from '@nestjs/common';
import { AppGroupController } from './app-group.controller';
import { AppGroupService } from './app-group.service';
import { ModuleGuard } from '../../common/guards/module.guard';

@Module({
  controllers: [AppGroupController],
  providers: [AppGroupService, ModuleGuard],
  exports: [AppGroupService],
})
export class AppGroupModule {}
