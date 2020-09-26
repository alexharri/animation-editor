import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { NodeEditorNodeType } from "~/types";
import { removeKeysFromMap } from "~/util/mapUtils";

const nodeEditorToNodeLabel: Record<NodeEditorNodeType, string> = {
	[NodeEditorNodeType.array_modifier_index]: "Index",
	[NodeEditorNodeType.color_from_rgba_factors]: "Color from RGBA",
	[NodeEditorNodeType.color_input]: "Color Input",
	[NodeEditorNodeType.color_to_rgba_factors]: "RGBA from Color",
	[NodeEditorNodeType.composition]: "Composition",
	[NodeEditorNodeType.deg_to_rad]: "Degrees to Radians",
	[NodeEditorNodeType.empty]: "Empty",
	[NodeEditorNodeType.expr]: "Expression",
	[NodeEditorNodeType.num_cap]: "Cap number",
	[NodeEditorNodeType.num_input]: "Number input",
	[NodeEditorNodeType.num_lerp]: "Number interpolation",
	[NodeEditorNodeType.property_input]: "Property Input",
	[NodeEditorNodeType.property_output]: "Property Output",
	[NodeEditorNodeType.rad_to_deg]: "Radians to Degrees",
	[NodeEditorNodeType.rect_translate]: "Translate Rect",
	[NodeEditorNodeType.vec2_add]: "Add Vec2",
	[NodeEditorNodeType.vec2_factors]: "Vec2 Factors",
	[NodeEditorNodeType.vec2_input]: "Vec2 Input",
	[NodeEditorNodeType.vec2_lerp]: "Vec2 interpolation",
};

export const getNodeEditorNodeLabel = (type: NodeEditorNodeType): string => {
	return nodeEditorToNodeLabel[type];
};

export const nodeEditorGlobalToNormal = (
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

export const nodeEditorGlobalToNormalRect = (
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

export const nodeEditorPositionToViewport = (
	vec2: Vec2,
	options: { viewport: Rect; scale: number; pan: Vec2 },
): Vec2 => {
	return vec2
		.scale(options.scale)
		.add(options.pan)
		.add(Vec2.new(options.viewport.width / 2, options.viewport.height / 2));
};

export const findInputsThatReferenceNodeOutputs = (nodeId: string, graph: NodeEditorGraphState) => {
	const results: Array<{ nodeId: string; inputIndex: number }> = [];

	for (const key in graph.nodes) {
		const node = graph.nodes[key];

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

export const removeReferencesToNodeInGraph = (
	nodeId: string,
	graph: NodeEditorGraphState,
): NodeEditorGraphState => {
	const refs = findInputsThatReferenceNodeOutputs(nodeId, graph);

	const newGraph: NodeEditorGraphState = {
		...graph,
		nodes: { ...graph.nodes },
	};

	for (let i = 0; i < refs.length; i += 1) {
		const { inputIndex, nodeId } = refs[i];

		const node = newGraph.nodes[nodeId];

		newGraph.nodes[nodeId] = {
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

	return newGraph;
};

export const removeNodeAndReferencesToItInGraph = (
	nodeId: string,
	graph: NodeEditorGraphState,
): NodeEditorGraphState => {
	let newGraph = removeReferencesToNodeInGraph(nodeId, graph);

	newGraph = {
		...graph,
		nodes: removeKeysFromMap(newGraph.nodes, [nodeId]),
	};

	return newGraph;
};
