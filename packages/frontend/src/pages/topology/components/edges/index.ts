import { type NodeTypes, type EdgeTypes } from 'reactflow';
import ServerFlowNode from '../ServerFlowNode';
import AppFlowNode from '../AppFlowNode';
import { ProtocolEdge } from './ProtocolEdge';
import { FwEdge } from './FwEdge';

export { ProtocolEdge, FwEdge };
export { protocolColors } from './ProtocolEdge';

export const nodeTypes: NodeTypes = {
  serverNode: ServerFlowNode,
  appNode: AppFlowNode,
};

export const edgeTypes: EdgeTypes = {
  protocolEdge: ProtocolEdge,
  fwEdge: FwEdge,
};
