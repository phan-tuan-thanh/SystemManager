import { gql } from '@apollo/client';

export const TOPOLOGY_QUERY = gql`
  query Topology($environment: String) {
    topology(environment: $environment) {
      servers {
        id
        code
        name
        hostname
        purpose
        status
        environment
        infra_type
        site
        description
        deployments {
          id
          version
          status
          environment
          application {
            id
            code
            name
            version
            groupName
            owner_team
            application_type
            ports {
              id
              port_number
              protocol
              service_name
            }
          }
        }
        networkConfigs {
          id
          interface
          private_ip
          public_ip
          domain
        }
      }
      connections {
        id
        sourceAppId
        targetAppId
        sourceAppName
        targetAppName
        connectionType
        environment
        description
        targetPort {
          id
          port_number
          protocol
          service_name
        }
      }
    }
  }
`;

export const SERVER_STATUS_SUBSCRIPTION = gql`
  subscription ServerStatusChanged($environment: String) {
    serverStatusChanged(environment: $environment) {
      id
      name
      status
      environment
    }
  }
`;

export const CONNECTION_STATUS_SUBSCRIPTION = gql`
  subscription ConnectionStatusChanged($environment: String) {
    connectionStatusChanged(environment: $environment) {
      id
      sourceAppName
      targetAppName
      status
      environment
    }
  }
`;

export const TOPOLOGY_CHANGED_SUBSCRIPTION = gql`
  subscription TopologyChanged($environment: String) {
    topologyChanged(environment: $environment) {
      environment
      changeType
    }
  }
`;

export const APP_DEPENDENCY_QUERY = gql`
  query AppDependency($appId: String!) {
    appDependency(appId: $appId) {
      upstream {
        id
        sourceAppId
        targetAppId
        sourceAppName
        targetAppName
        connectionType
        environment
        description
      }
      downstream {
        id
        sourceAppId
        targetAppId
        sourceAppName
        targetAppName
        connectionType
        environment
        description
      }
    }
  }
`;
