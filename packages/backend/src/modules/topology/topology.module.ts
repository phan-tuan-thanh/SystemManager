import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { TopologyResolver } from './topology.resolver';
import { TopologyService } from './topology.service';
import { TOPOLOGY_PUB_SUB } from './topology.constants';

export { TOPOLOGY_PUB_SUB };

@Module({
  providers: [
    TopologyResolver,
    TopologyService,
    {
      provide: TOPOLOGY_PUB_SUB,
      useValue: new PubSub(),
    },
  ],
  exports: [TopologyService, TOPOLOGY_PUB_SUB],
})
export class TopologyModule {}
