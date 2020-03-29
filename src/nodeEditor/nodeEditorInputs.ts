import { NodeEditorNodeType as NodeType, NodeEditorNodeOutputPointer } from "~/types";
import { extractTupleValue } from "~/util/tuple";

export const nodeEditorNodeInputsMap = {
	[NodeType.empty]: [
		{
			type: "void",
			name: "Void",
			value: undefined,
		},
	] as const,

	[NodeType.add_vec2]: [
		{
			type: "vec2",
			name: "Input Vector A",
			value: Vec2.new(0, 0),
			pointer: null,
		},
		{
			type: "vec2",
			name: "Input Vector B",
			value: Vec2.new(0, 0),
		},
	] as const,

	[NodeType.translate_rect]: [
		{
			type: "rect",
			name: "Input Rect",
			value: {
				height: 0,
				left: 0,
				top: 0,
				width: 0,
			} as Rect,
		},
		{
			type: "vec2",
			name: "Translation Vector",
			value: Vec2.new(0, 0),
		},
	] as const,
};

interface NodeEditorNodeOutputMap {
	[NodeType.empty]: void;
	[NodeType.add_vec2]: Vec2;
	[NodeType.translate_rect]: Rect;
}

export type NodeEditorNodeInputs = {
	[K in NodeType]: typeof nodeEditorNodeInputsMap[K];
};
export type NodeEditorComputeFn<T extends NodeType> = (
	...args: typeof nodeEditorNodeInputsMap[T]
) => NodeEditorNodeOutputMap[T];

export const nodeEditorOutputsMap: {
	[K in NodeType]: Array<{
		name: string;
		compute: NodeEditorComputeFn<K>;
	}>;
} = {
	[NodeType.empty]: [{ name: "", compute: (..._args) => undefined }],

	[NodeType.add_vec2]: [
		{
			name: "Output Vector",
			compute: (...args) => {
				const [a, b] = extractTupleValue(args);
				return a.add(b);
			},
		},
	],

	[NodeType.translate_rect]: [
		{
			name: "Output Rect",
			compute: (...args) => {
				const [rect, vec2] = extractTupleValue(args);
				return {
					...rect,
					left: rect.left + vec2.x,
					top: rect.top + vec2.y,
				};
			},
		},
	],
};

export interface NodeEditorNode<T extends NodeType> {
	id: string;
	type: T;
	position: Vec2;
	width: number;
	inputs: NodeEditorNodeInputs[T];
	inputPointers: Array<NodeEditorNodeOutputPointer | null>;
}
