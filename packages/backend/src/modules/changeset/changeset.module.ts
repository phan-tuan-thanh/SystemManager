import { Module } from '@nestjs/common';
import { ChangeSetController } from './changeset.controller';
import { ChangeSetService } from './changeset.service';
import { PreviewEngineService } from './changeset.preview-engine';

@Module({
  controllers: [ChangeSetController],
  providers: [ChangeSetService, PreviewEngineService],
  exports: [ChangeSetService],
})
export class ChangeSetModule {}
