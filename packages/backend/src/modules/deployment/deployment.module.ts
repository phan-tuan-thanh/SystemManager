import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { DocTypeController } from './doc-type.controller';
import { DocTypeService } from './doc-type.service';
import { ChangeHistoryModule } from '../change-history/change-history.module';
import { ModuleGuard } from '../../common/guards/module.guard';
import { FileUploadService } from '../../common/services/file-upload.service';

@Module({
  imports: [
    ChangeHistoryModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [DeploymentController, DocTypeController],
  providers: [DeploymentService, DocTypeService, ModuleGuard, FileUploadService],
  exports: [DeploymentService],
})
export class DeploymentModule {}
