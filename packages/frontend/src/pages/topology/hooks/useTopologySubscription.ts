import { useSubscription } from '@apollo/client';
import { useEffect } from 'react';
import {
  SERVER_STATUS_SUBSCRIPTION,
  CONNECTION_STATUS_SUBSCRIPTION,
  TOPOLOGY_CHANGED_SUBSCRIPTION,
} from '../../../graphql/topology';

interface ServerStatusEvent {
  id: string;
  name: string;
  status: string;
  environment: string;
}

interface ConnectionStatusEvent {
  id: string;
  sourceAppName: string;
  targetAppName: string;
  status: string;
  environment: string;
}

interface TopologyChangedEvent {
  environment: string;
  changeType: string;
}

interface UseTopologySubscriptionOptions {
  environment?: string;
  onServerStatusChanged?: (event: ServerStatusEvent) => void;
  onConnectionStatusChanged?: (event: ConnectionStatusEvent) => void;
  onTopologyChanged?: (event: TopologyChangedEvent) => void;
}

export function useTopologySubscription({
  environment,
  onServerStatusChanged,
  onConnectionStatusChanged,
  onTopologyChanged,
}: UseTopologySubscriptionOptions) {
  const { data: serverData } = useSubscription<{ serverStatusChanged: ServerStatusEvent }>(
    SERVER_STATUS_SUBSCRIPTION,
    { variables: { environment } },
  );

  const { data: connData } = useSubscription<{ connectionStatusChanged: ConnectionStatusEvent }>(
    CONNECTION_STATUS_SUBSCRIPTION,
    { variables: { environment } },
  );

  const { data: topoData } = useSubscription<{ topologyChanged: TopologyChangedEvent }>(
    TOPOLOGY_CHANGED_SUBSCRIPTION,
    { variables: { environment } },
  );

  useEffect(() => {
    if (serverData?.serverStatusChanged && onServerStatusChanged) {
      onServerStatusChanged(serverData.serverStatusChanged);
    }
  }, [serverData]);

  useEffect(() => {
    if (connData?.connectionStatusChanged && onConnectionStatusChanged) {
      onConnectionStatusChanged(connData.connectionStatusChanged);
    }
  }, [connData]);

  useEffect(() => {
    if (topoData?.topologyChanged && onTopologyChanged) {
      onTopologyChanged(topoData.topologyChanged);
    }
  }, [topoData]);
}
