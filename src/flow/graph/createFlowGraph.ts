import uuid from "uuid/v4";
import { DEFAULT_NODE_EDITOR_NODE_WIDTH } from "~/constants";
import { FlowGraph, FlowNodeType } from "~/flow/flowTypes";

const createFlowGraphBase = () => {
	const nodeId = "0";
	return {
		id: uuid(),
		nodes: {
			[nodeId]: {
				id: nodeId,
				position: Vec2.new(0, 0),
				state: { layerId: "", propertyId: "" },
				type: FlowNodeType.property_output,
				width: DEFAULT_NODE_EDITOR_NODE_WIDTH,
				outputs: [],
				inputs: [],
			},
		},
		selection: {
			nodes: {},
		},
		moveVector: Vec2.new(0, 0),
		_addNodeOfTypeOnClick: null,
		_dragInputTo: null,
		_dragOutputTo: null,
		_dragSelectRect: null,
	};
};

export const createLayerFlowGraph = (layerId: string): FlowGraph => {
	return {
		type: "layer_graph",
		layerId,
		propertyId: "",
		...createFlowGraphBase(),
	};
};

export const createArrayModifierFlowGraph = (propertyId: string): FlowGraph => {
	return {
		type: "array_modifier_graph",
		propertyId,
		layerId: "",
		...createFlowGraphBase(),
	};
};
