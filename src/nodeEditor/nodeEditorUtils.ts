import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { removeKeysFromMap } from "~/util/mapUtils";

export const transformGlobalToNodeEditorPosition = (
	globalPos: Vec2,
	viewport: Rect,
	scale: number,
	pan: Vec2,
): Vec2 => {
	let { x, y } = globalPos;
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

export const transformGlobalToNodeEditorRect = (
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
