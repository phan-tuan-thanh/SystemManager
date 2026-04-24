import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class NetworkConfigNode {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  interface?: string;

  @Field({ nullable: true })
  private_ip?: string;

  @Field({ nullable: true })
  public_ip?: string;

  @Field({ nullable: true })
  domain?: string;
}

@ObjectType()
export class PortNode {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  port_number: number;

  @Field()
  protocol: string;

  @Field({ nullable: true })
  service_name?: string;
}

@ObjectType()
export class ApplicationNode {
  @Field(() => ID)
  id: string;

  @Field()
  code: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  version?: string;

  @Field({ nullable: true })
  groupName?: string;

  @Field({ nullable: true })
  owner_team?: string;

  @Field({ nullable: true })
  application_type?: string;

  @Field(() => [PortNode], { nullable: true })
  ports?: PortNode[];
}

@ObjectType()
export class DeploymentNode {
  @Field(() => ID)
  id: string;

  @Field()
  version: string;

  @Field()
  status: string;

  @Field()
  environment: string;

  @Field(() => ApplicationNode)
  application: ApplicationNode;
}

@ObjectType()
export class ServerNode {
  @Field(() => ID)
  id: string;

  @Field()
  code: string;

  @Field()
  name: string;

  @Field()
  hostname: string;

  @Field()
  purpose: string;

  @Field()
  status: string;

  @Field()
  environment: string;

  @Field()
  infra_type: string;

  @Field()
  site: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [DeploymentNode])
  deployments: DeploymentNode[];

  @Field(() => [NetworkConfigNode])
  networkConfigs: NetworkConfigNode[];
}

@ObjectType()
export class ConnectionEdge {
  @Field(() => ID)
  id: string;

  @Field()
  sourceAppId: string;

  @Field()
  targetAppId: string;

  @Field()
  sourceAppName: string;

  @Field()
  targetAppName: string;

  @Field()
  connectionType: string;

  @Field()
  environment: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => PortNode, { nullable: true })
  targetPort?: PortNode;
}

@ObjectType()
export class TopologyData {
  @Field(() => [ServerNode])
  servers: ServerNode[];

  @Field(() => [ConnectionEdge])
  connections: ConnectionEdge[];
}

@ObjectType()
export class DependencyData {
  @Field(() => [ConnectionEdge])
  upstream: ConnectionEdge[];

  @Field(() => [ConnectionEdge])
  downstream: ConnectionEdge[];
}

@ObjectType()
export class ServerStatusPayload {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  status: string;

  @Field()
  environment: string;
}

@ObjectType()
export class ConnectionStatusPayload {
  @Field(() => ID)
  id: string;

  @Field()
  sourceAppName: string;

  @Field()
  targetAppName: string;

  @Field()
  status: string;

  @Field()
  environment: string;
}

@ObjectType()
export class TopologyChangedPayload {
  @Field()
  environment: string;

  @Field()
  changeType: string;
}
