import { Resolver, Query, Args, Subscription } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { TopologyService } from './topology.service';
import {
  TopologyData,
  DependencyData,
  ServerStatusPayload,
  ConnectionStatusPayload,
  TopologyChangedPayload,
} from './topology.types';
import {
  TOPOLOGY_PUB_SUB,
  SERVER_STATUS_CHANGED,
  CONNECTION_STATUS_CHANGED,
  TOPOLOGY_CHANGED,
} from './topology.constants';

@Resolver()
export class TopologyResolver {
  constructor(
    private readonly topologyService: TopologyService,
    @Inject(TOPOLOGY_PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => TopologyData, {
    description: 'Get topology data for a given environment (or all environments if omitted)',
  })
  async topology(
    @Args('environment', { nullable: true, type: () => String }) environment?: string,
  ): Promise<TopologyData> {
    return this.topologyService.getTopology(environment);
  }

  @Query(() => DependencyData, {
    description: 'Get upstream and downstream dependencies for an application',
  })
  async appDependency(
    @Args('appId', { type: () => String }) appId: string,
  ): Promise<DependencyData> {
    return this.topologyService.getAppDependency(appId);
  }

  @Subscription(() => ServerStatusPayload, {
    description: 'Subscribe to server status changes',
    filter: (payload, variables) => {
      if (!variables.environment) return true;
      return payload.serverStatusChanged.environment === variables.environment;
    },
  })
  serverStatusChanged(
    @Args('environment', { nullable: true, type: () => String }) _environment?: string,
  ) {
    return this.pubSub.asyncIterator(SERVER_STATUS_CHANGED);
  }

  @Subscription(() => ConnectionStatusPayload, {
    description: 'Subscribe to connection status changes',
    filter: (payload, variables) => {
      if (!variables.environment) return true;
      return payload.connectionStatusChanged.environment === variables.environment;
    },
  })
  connectionStatusChanged(
    @Args('environment', { nullable: true, type: () => String }) _environment?: string,
  ) {
    return this.pubSub.asyncIterator(CONNECTION_STATUS_CHANGED);
  }

  @Subscription(() => TopologyChangedPayload, {
    description: 'Subscribe to topology change events (changeset applied)',
    filter: (payload, variables) => {
      if (!variables.environment) return true;
      return payload.topologyChanged.environment === variables.environment;
    },
  })
  topologyChanged(
    @Args('environment', { nullable: true, type: () => String }) _environment?: string,
  ) {
    return this.pubSub.asyncIterator(TOPOLOGY_CHANGED);
  }
}
