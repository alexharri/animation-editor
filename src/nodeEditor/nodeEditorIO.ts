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

		case NodeEditorNodeType.empty:
			return [];
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

export interface NodeEditorNode<T extends NodeEditorNodeType> {
	id: string;
	type: T;
	position: Vec2;
	width: number;
	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
}
