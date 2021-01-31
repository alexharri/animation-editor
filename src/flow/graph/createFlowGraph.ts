import uuid from "uuid/v4";
import { DEFAULT_FLOW_NODE_WIDTH } from "~/constants";
import { FlowGraph, FlowNode, FlowNodeType } from "~/flow/flowTypes";

const createNode = (graphId: string): FlowNode => {
	const nodeId = "0";
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

const createFlowGraphBase = () => {
	const graph = {
		id: uuid(),
		nodes: [] as string[],
		moveVector: Vec2.new(0, 0),
		_addNodeOfTypeOnClick: null,
		_dragInputTo: null,
		_dragOutputTo: null,
		_dragSelectRect: null,
	};
	const node = createNode(graph.id);
	graph.nodes.push(node.id);
	return { graph, node };
};

export const createLayerFlowGraph = (layerId: string): { graph: FlowGraph; node: FlowNode } => {
	const { graph, node } = createFlowGraphBase();
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
): { graph: FlowGraph; node: FlowNode } => {
	const { graph, node } = createFlowGraphBase();
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
