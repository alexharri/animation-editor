import uuid from "uuid/v4";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { NodeEditorNodeInput, getNodeEditorNodeDefaultState } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";
import { CompositionProperty } from "~/composition/compositionTypes";
import { DEFAULT_NODE_EDITOR_NODE_WIDTH } from "~/constants";
import { getLayerPropertyLabel } from "~/composition/util/compositionPropertyUtils";

export const createLayerGraph = (
	layerId: string,
	transformProperties: CompositionProperty[],
): NodeEditorGraphState => {
	const nodeId = "0";
	return {
		id: uuid(),
		nodes: {
			[nodeId]: {
				id: nodeId,
				position: Vec2.new(0, 0),
				state: getNodeEditorNodeDefaultState(NodeEditorNodeType.layer_transform_input),
				type: NodeEditorNodeType.layer_transform_output,
				width: DEFAULT_NODE_EDITOR_NODE_WIDTH,
				outputs: [],
				inputs: transformProperties.map<NodeEditorNodeInput>((property) => ({
					name: getLayerPropertyLabel(property.name),
					pointer: null,
					type: property.valueType,
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
