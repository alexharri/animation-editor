import { CompositionState } from "~/composition/compositionReducer";
import { FlowNodeType } from "~/flow/flowTypes";
import { FlowState } from "~/flow/state/flowReducers";
import { FlowGraphSelection, FlowSelectionState } from "~/flow/state/flowSelectionReducer";
import { isMapShallowEqual, mergeItemInMap, removeKeysFromMap } from "~/util/mapUtils";

const flowNodeTypeToLabel: Record<FlowNodeType, string> = {
	[FlowNodeType.array_modifier_index]: "Index",
	[FlowNodeType.color_from_rgba_factors]: "Color from RGBA",
	[FlowNodeType.color_input]: "Color Input",
	[FlowNodeType.color_to_rgba_factors]: "RGBA from Color",
	[FlowNodeType.composition]: "Composition",
	[FlowNodeType.deg_to_rad]: "Degrees to Radians",
	[FlowNodeType.empty]: "Empty",
	[FlowNodeType.expr]: "Expression",
	[FlowNodeType.num_cap]: "Cap number",
	[FlowNodeType.num_input]: "Number input",
	[FlowNodeType.num_lerp]: "Number interpolation",
	[FlowNodeType.property_input]: "Property Input",
	[FlowNodeType.property_output]: "Property Output",
	[FlowNodeType.rad_to_deg]: "Radians to Degrees",
	[FlowNodeType.rect_translate]: "Translate Rect",
	[FlowNodeType.vec2_add]: "Add Vec2",
	[FlowNodeType.vec2_factors]: "Vec2 Factors",
	[FlowNodeType.vec2_input]: "Vec2 Input",
	[FlowNodeType.vec2_lerp]: "Vec2 interpolation",
};

export const getFlowNodeLabel = (type: FlowNodeType): string => {
	return flowNodeTypeToLabel[type];
};

export const flowEditorGlobalToNormal = (
	globalPosition: Vec2,
	viewport: Rect,
	scale: number,
	pan: Vec2,
): Vec2 => {
	let { x, y } = globalPosition;
	x -= viewport.left;
	y -= viewport.top;
	x /= scale;
	y /= scale;
	x -= pan.x / scale;
	y -= pan.y / scale;
	x -= viewport.width / 2 / scale;
	y -= viewport.height / 2 / scale;
	return Vec2.new(x, y);
};

export const flowEditorGlobalToNormalRect = (
	globalRect: Rect,
	viewport: Rect,
	scale: number,
	pan: Vec2,
): Rect => {
	let { left, top, width, height } = globalRect;
	left -= viewport.left;
	top -= viewport.top;
	left /= scale;
	top /= scale;
	left -= pan.x / scale;
	top -= pan.y / scale;
	left -= viewport.width / 2 / scale;
	top -= viewport.height / 2 / scale;
	width *= scale;
	height *= scale;
	return { left, top, width, height };
};

export const flowEditorPositionToViewport = (
	vec2: Vec2,
	options: { viewport: Rect; scale: number; pan: Vec2 },
): Vec2 => {
	return vec2
		.scale(options.scale)
		.add(options.pan)
		.add(Vec2.new(options.viewport.width / 2, options.viewport.height / 2));
};

export const findInputsThatReferenceFlowNodeOutputs = (
	graphId: string,
	nodeId: string,
	flowState: FlowState,
) => {
	const results: Array<{ nodeId: string; inputIndex: number }> = [];

	const graph = flowState.graphs[graphId];

	for (const key of graph.nodes) {
		const node = flowState.nodes[key];

		for (let i = 0; i < node.inputs.length; i += 1) {
			const input = node.inputs[i];

			if (!input.pointer) {
				continue;
			}

			if (input.pointer.nodeId === nodeId) {
				results.push({ inputIndex: i, nodeId: key });
			}
		}
	}

	return results;
};

export const removeReferencesToFlowNode = (nodeId: string, flowState: FlowState): FlowState => {
	const node = flowState.nodes[nodeId];
	const { graphId } = node;
	const refs = findInputsThatReferenceFlowNodeOutputs(graphId, nodeId, flowState);

	const newState: FlowState = {
		...flowState,
		graphs: { ...flowState.graphs },
		nodes: { ...flowState.nodes },
	};

	for (let i = 0; i < refs.length; i += 1) {
		const { inputIndex, nodeId } = refs[i];

		const node = newState.nodes[nodeId];

		newState.nodes[nodeId] = {
			...node,
			inputs: node.inputs.map((input, i) =>
				i === inputIndex
					? {
							...input,
							pointer: null,
					  }
					: input,
			),
		};
	}

	return newState;
};

export const removeFlowNodeAndReferencesToIt = (
	nodeId: string,
	flowState: FlowState,
): FlowState => {
	const node = flowState.nodes[nodeId];
	const { graphId } = node;

	const newState = removeReferencesToFlowNode(nodeId, flowState);

	newState.graphs = mergeItemInMap(newState.graphs, graphId, (graph) => ({
		nodes: graph.nodes.filter((id) => id !== nodeId),
	}));
	newState.nodes = removeKeysFromMap(newState.nodes, [nodeId]);
	return newState;
};

export const flowSelectionFromState = (
	graphId: string,
	flowState: FlowSelectionState,
): FlowGraphSelection => {
	return flowState[graphId] || { nodes: {} };
};

export const didFlowSelectionChange: (
	graphId: string,
) => (prevState: ActionState, nextState: ActionState) => boolean = (graphId) => (
	prevState,
	nextState,
) => {
	const a = flowSelectionFromState(graphId, prevState.flowSelectionState);
	const b = flowSelectionFromState(graphId, nextState.flowSelectionState);

	if (!isMapShallowEqual(a.nodes, b.nodes)) {
		return true;
	}

	return false;
};

export function getFlowPropertyNodeReferencedPropertyIds(
	compositionState: CompositionState,
	propertyId: string,
) {
	if (!propertyId) {
		// The property_* node has not selected a property.
		return [];
	}

	const property = compositionState.properties[propertyId];

	switch (property.type) {
		case "property":
			return [property.id];
		case "compound":
			return [...property.properties];
		case "group": {
			const propertyIds: string[] = [];
			for (const propertyId of property.properties) {
				const p = compositionState.properties[propertyId];
				switch (p.type) {
					case "property": {
						propertyIds.push(p.id);
						break;
					}
					case "compound": {
						propertyIds.push(...p.properties);
						break;
					}
				}
			}
			return propertyIds;
		}
		default:
			throw new Error("Unexpected property type");
	}
}

/**
 * Returns undefined if the graph is not a layer graph (e.g. Array Modifier Graph).
 */
export const getFlowNodeAssociatedCompositionId = (
	nodeId: string,
	actionState: ActionState,
): string | undefined => {
	const { flowState, compositionState } = actionState;

	const node = flowState.nodes[nodeId];
	const graph = flowState.graphs[node.graphId];

	if (!graph.layerId) {
		return undefined;
	}

	const layer = compositionState.layers[graph.layerId];
	return layer.compositionId;
};
