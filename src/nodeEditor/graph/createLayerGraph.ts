import uuid from "uuid/v4";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { NodeEditorNodeInput, getNodeEditorNodeDefaultState } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";
import { CompositionLayerProperty } from "~/composition/compositionTypes";
import { DEFAULT_NODE_EDITOR_NODE_WIDTH } from "~/constants";

export const createLayerGraph = (
	layerId: string,
	properties: CompositionLayerProperty[],
): NodeEditorGraphState => {
	const nodeId = "0";
	return {
		id: uuid(),
		nodes: {
			[nodeId]: {
				id: nodeId,
				position: Vec2.new(0, 0),
				state: getNodeEditorNodeDefaultState(NodeEditorNodeType.layer_input),
				type: NodeEditorNodeType.layer_input,
				width: DEFAULT_NODE_EDITOR_NODE_WIDTH,
				outputs: [],
				inputs: properties.map<NodeEditorNodeInput>((property) => ({
					name: property.name,
					pointer: null,
					type: property.type,
					value: null,
				})),
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
