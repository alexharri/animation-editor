import { NodeEditorNodeType, ValueType } from "~/types";

export const getNodeEditorNodeDefaultInputs = (type: NodeEditorNodeType): NodeEditorNodeInput[] => {
	switch (type) {
		case NodeEditorNodeType.num_input:
			return [];

		case NodeEditorNodeType.num_cap:
			return [
				{
					type: ValueType.Number,
					name: "Value",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "Min",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "Max",
					value: 1,
					pointer: null,
				},
			];

		case NodeEditorNodeType.num_lerp:
			return [
				{
					type: ValueType.Number,
					name: "Number A",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "Number B",
					value: 1,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "t",
					value: 0.5,
					pointer: null,
				},
			];

		case NodeEditorNodeType.rad_to_deg:
			return [
				{
					type: ValueType.Number,
					name: "Radians",
					value: 0,
					pointer: null,
				},
			];

		case NodeEditorNodeType.deg_to_rad:
			return [
				{
					type: ValueType.Number,
					name: "Degrees",
					value: 0,
					pointer: null,
				},
			];

		case NodeEditorNodeType.vec2_factors:
			return [
				{
					type: ValueType.Vec2,
					name: "Vec2",
					value: Vec2.new(0, 0),
					pointer: null,
				},
			];

		case NodeEditorNodeType.vec2_lerp:
			return [
				{
					type: ValueType.Vec2,
					name: "Vec2 A",
					value: Vec2.new(0, 0),
					pointer: null,
				},
				{
					type: ValueType.Vec2,
					name: "Vec2 B",
					value: Vec2.new(0, 0),
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "t",
					value: 0.5,
					pointer: null,
				},
			];

		case NodeEditorNodeType.vec2_add:
			return [
				{
					type: ValueType.Vec2,
					name: "Input Vector A",
					value: Vec2.new(0, 0),
					pointer: null,
				},
				{
					type: ValueType.Vec2,
					name: "Input Vector B",
					value: Vec2.new(0, 0),
					pointer: null,
				},
			];

		case NodeEditorNodeType.vec2_input:
			return [
				{
					type: ValueType.Number,
					name: "X",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "Y",
					value: 0,
					pointer: null,
				},
			];

		case NodeEditorNodeType.rect_translate:
			return [
				{
					type: ValueType.Rect,
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
					type: ValueType.Vec2,
					name: "Translation Vector",
					value: Vec2.new(0, 0),
					pointer: null,
				},
			];

		case NodeEditorNodeType.layer_input:
			return [];

		case NodeEditorNodeType.layer_output:
			return [];

		case NodeEditorNodeType.expr:
			return [];

		case NodeEditorNodeType.empty:
			return [];
	}
};

export const getNodeEditorNodeDefaultOutputs = (
	type: NodeEditorNodeType,
): NodeEditorNodeOutput[] => {
	switch (type) {
		case NodeEditorNodeType.deg_to_rad:
			return [
				{
					name: "Radians",
					type: ValueType.Number,
				},
			];

		case NodeEditorNodeType.rad_to_deg:
			return [
				{
					name: "Degrees",
					type: ValueType.Number,
				},
			];

		case NodeEditorNodeType.num_cap:
			return [
				{
					name: "Number",
					type: ValueType.Number,
				},
			];

		case NodeEditorNodeType.num_input:
			return [
				{
					name: "Number",
					type: ValueType.Number,
				},
			];

		case NodeEditorNodeType.num_lerp:
			return [
				{
					name: "Number",
					type: ValueType.Number,
				},
			];

		case NodeEditorNodeType.vec2_factors:
			return [
				{
					name: "X",
					type: ValueType.Number,
				},
				{
					name: "Y",
					type: ValueType.Number,
				},
			];

		case NodeEditorNodeType.vec2_lerp:
			return [
				{
					name: "Vec2",
					type: ValueType.Vec2,
				},
			];

		case NodeEditorNodeType.vec2_add:
			return [
				{
					name: "Vector",
					type: ValueType.Vec2,
				},
			];

		case NodeEditorNodeType.vec2_input:
			return [
				{
					name: "Vec2",
					type: ValueType.Vec2,
				},
			];

		case NodeEditorNodeType.rect_translate:
			return [
				{
					name: "Rect",
					type: ValueType.Rect,
				},
			];

		case NodeEditorNodeType.layer_input:
			return [];

		case NodeEditorNodeType.layer_output:
			return [];

		case NodeEditorNodeType.expr:
			return [];

		case NodeEditorNodeType.empty:
			return [];
	}
};

export const getNodeEditorNodeDefaultState = <T extends NodeEditorNodeType>(type: T): any => {
	switch (type) {
		case NodeEditorNodeType.expr:
			return { expression: "", textareaHeight: 80 } as NodeEditorNodeStateMap["expr"];

		default:
			return {} as any;
	}
};

export interface NodeEditorNodeInput<T = any> {
	type: ValueType;
	name: string;
	value: T;
	pointer: {
		nodeId: string;
		outputIndex: number;
	} | null;
}

export interface NodeEditorNodeOutput {
	name: string;
	type: ValueType;
}

export interface NodeEditorNodeIO {
	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
}

type NodeEditorNodeStateMap = {
	[NodeEditorNodeType.deg_to_rad]: {};
	[NodeEditorNodeType.rad_to_deg]: {};
	[NodeEditorNodeType.num_cap]: {};
	[NodeEditorNodeType.num_lerp]: {};
	[NodeEditorNodeType.num_input]: { value: number; type: "value" | "t_value" };
	[NodeEditorNodeType.vec2_factors]: {};
	[NodeEditorNodeType.vec2_lerp]: {};
	[NodeEditorNodeType.vec2_add]: {};
	[NodeEditorNodeType.vec2_input]: {};
	[NodeEditorNodeType.empty]: {};
	[NodeEditorNodeType.rect_translate]: {};
	[NodeEditorNodeType.layer_input]: {};
	[NodeEditorNodeType.layer_output]: {};
	[NodeEditorNodeType.expr]: {
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

export const nodeValidInputToOutputsMap: { [key in ValueType]: ValueType[] } = {
	[ValueType.Any]: [ValueType.Any, ValueType.Number, ValueType.Rect, ValueType.Vec2],
	[ValueType.Number]: [ValueType.Any, ValueType.Number],
	[ValueType.Rect]: [ValueType.Any, ValueType.Rect],
	[ValueType.Vec2]: [ValueType.Any, ValueType.Vec2],
};
