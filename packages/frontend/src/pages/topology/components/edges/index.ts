import { type NodeTypes, type EdgeTypes } from 'reactflow';
import ServerFlowNode from '../ServerFlowNode';
import AppFlowNode from '../AppFlowNode';
import ZoneLaneNode from '../ZoneLaneNode';
import LaneWrapperNode from '../LaneWrapperNode';
import { ProtocolEdge } from './ProtocolEdge';
import { FwEdge } from './FwEdge';

export { ProtocolEdge, FwEdge };
export { protocolColors } from './ProtocolEdge';

export const nodeTypes: NodeTypes = {
  serverNode: ServerFlowNode,
  appNode: AppFlowNode,
  zoneLane: ZoneLaneNode,
  laneWrapper: LaneWrapperNode,
};

export const edgeTypes: EdgeTypes = {
  protocolEdge: ProtocolEdge,
  fwEdge: FwEdge,
};
