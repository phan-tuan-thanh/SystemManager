import { Module } from '@nestjs/common';
import { NetworkZoneController } from './network-zone.controller';
import { NetworkZoneService } from './network-zone.service';

@Module({
  controllers: [NetworkZoneController],
  providers: [NetworkZoneService],
  exports: [NetworkZoneService],
})
export class NetworkZoneModule {}
