import uuid from "uuid/v4";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { NodeEditorNodeType } from "~/types";
import { DEFAULT_NODE_EDITOR_NODE_WIDTH } from "~/constants";

export const createLayerGraph = (layerId: string): NodeEditorGraphState => {
	const nodeId = "0";
	return {
		id: uuid(),
		nodes: {
			[nodeId]: {
				id: nodeId,
				position: Vec2.new(0, 0),
				state: { propertyId: "" },
				type: NodeEditorNodeType.property_output,
				width: DEFAULT_NODE_EDITOR_NODE_WIDTH,
				outputs: [],
				inputs: [],
			},
		},
		selection: {
			nodes: {},
		},
		layerId,
		moveVector: Vec2.new(0, 0),
		_addNodeOfTypeOnClick: null,
		_dragInputTo: null,
		_dragOutputTo: null,
		_dragSelectRect: null,
	};
};
