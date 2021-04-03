import uuid from "uuid/v4";
import { DEFAULT_FLOW_NODE_WIDTH } from "~/constants";
import { FlowGraph, FlowNode, FlowNodeType } from "~/flow/flowTypes";
import { FlowState } from "~/flow/state/flowReducers";
import { createMapNumberId } from "~/util/mapUtils";

const createNode = (graphId: string, flowState: FlowState): FlowNode => {
	const nodeId = createMapNumberId(flowState.nodes);
	return {
		id: nodeId,
		graphId,
		position: Vec2.new(0, 0),
		state: { layerId: "", propertyId: "" },
		type: FlowNodeType.property_output,
		width: DEFAULT_FLOW_NODE_WIDTH,
		outputs: [],
		inputs: [],
	};
};

const createFlowGraphBase = (flowState: FlowState) => {
	const graph = {
		id: uuid(),
		nodes: [] as string[],
		moveVector: Vec2.new(0, 0),
		_addNodeOfTypeOnClick: null,
		_dragInputTo: null,
		_dragOutputTo: null,
		_dragSelectRect: null,
	};
	const node = createNode(graph.id, flowState);
	graph.nodes.push(node.id);
	return { graph, node };
};

export const createLayerFlowGraph = (
	layerId: string,
	flowState: FlowState,
): { graph: FlowGraph; node: FlowNode } => {
	const { graph, node } = createFlowGraphBase(flowState);
	return {
		graph: {
			type: "layer_graph",
			layerId,
			propertyId: "",
			...graph,
		},
		node,
	};
};

export const createArrayModifierFlowGraph = (
	propertyId: string,
	flowState: FlowState,
): { graph: FlowGraph; node: FlowNode } => {
	const { graph, node } = createFlowGraphBase(flowState);
	return {
		graph: {
			type: "array_modifier_graph",
			propertyId,
			layerId: "",
			...graph,
		},
		node,
	};
};
