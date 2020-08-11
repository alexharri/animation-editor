import uuid from "uuid/v4";
import { DEFAULT_NODE_EDITOR_NODE_WIDTH } from "~/constants";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { NodeEditorNodeType } from "~/types";

const createGraphBase = () => {
	const nodeId = "0";
	return {
		id: uuid(),
		nodes: {
			[nodeId]: {
				id: nodeId,
				position: Vec2.new(0, 0),
				state: { layerId: "", propertyId: "" },
				type: NodeEditorNodeType.property_output,
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

export const createLayerGraph = (layerId: string): NodeEditorGraphState => {
	return {
		type: "layer_graph",
		layerId,
		propertyId: "",
		...createGraphBase(),
	};
};

export const createArrayModifierGraph = (propertyId: string): NodeEditorGraphState => {
	return {
		type: "array_modifier_graph",
		propertyId,
		layerId: "",
		...createGraphBase(),
	};
};
