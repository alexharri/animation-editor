import { NodeEditorNodeType, NodeEditorValueType } from "~/types";

export const getNodeEditorNodeDefaultInputs = (type: NodeEditorNodeType): NodeEditorNodeInput[] => {
	switch (type) {
		case NodeEditorNodeType.add_vec2:
			return [
				{
					type: NodeEditorValueType.Vec2,
					name: "Input Vector A",
					value: Vec2.new(0, 0),
					pointer: null,
				},
				{
					type: NodeEditorValueType.Vec2,
					name: "Input Vector B",
					value: Vec2.new(0, 0),
					pointer: null,
				},
			];

		case NodeEditorNodeType.translate_rect:
			return [
				{
					type: NodeEditorValueType.Rect,
					name: "Input Rect",
					value: {
						height: 0,
						left: 0,
						top: 0,
						width: 0,
					},
					pointer: null,
				},
				{
					type: NodeEditorValueType.Vec2,
					name: "Translation Vector",
					value: Vec2.new(0, 0),
					pointer: null,
				},
			];

		case NodeEditorNodeType.expression:
			return [];

		case NodeEditorNodeType.empty:
			return [];
	}
};

export const getNodeEditorNodeDefaultOutputs = (
	type: NodeEditorNodeType,
): NodeEditorNodeOutput[] => {
	switch (type) {
		case NodeEditorNodeType.add_vec2:
			return [
				{
					name: "Vector",
					type: NodeEditorValueType.Vec2,
				},
			];

		case NodeEditorNodeType.translate_rect:
			return [
				{
					name: "Rect",
					type: NodeEditorValueType.Rect,
				},
			];

		case NodeEditorNodeType.expression:
			return [];

		case NodeEditorNodeType.empty:
			return [];
	}
};

export const getNodeEditorNodeDefaultState = <T extends NodeEditorNodeType>(type: T): any => {
	switch (type) {
		case NodeEditorNodeType.add_vec2:
			return {} as NodeEditorNodeStateMap[T];

		case NodeEditorNodeType.translate_rect:
			return {} as NodeEditorNodeStateMap[T];

		case NodeEditorNodeType.expression:
			return { expression: "", textareaHeight: 80 } as NodeEditorNodeStateMap["expression"];

		case NodeEditorNodeType.empty:
			return {} as NodeEditorNodeStateMap[T];

		default:
			return null as any;
	}
};

export interface NodeEditorNodeInput<T = any> {
	type: NodeEditorValueType;
	name: string;
	value: T;
	pointer: {
		nodeId: string;
		outputIndex: number;
	} | null;
}

export interface NodeEditorNodeOutput {
	name: string;
	type: NodeEditorValueType;
}

type NodeEditorNodeStateMap = {
	[NodeEditorNodeType.add_vec2]: {};
	[NodeEditorNodeType.empty]: {};
	[NodeEditorNodeType.translate_rect]: {};
	[NodeEditorNodeType.expression]: {
		expression: string;
		textareaHeight: number;
	};
};
export type NodeEditorNodeState<T extends NodeEditorNodeType> = NodeEditorNodeStateMap[T];

export interface NodeEditorNode<T extends NodeEditorNodeType> {
	id: string;
	type: T;
	position: Vec2;
	width: number;
	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
	state: NodeEditorNodeState<T>;
}
