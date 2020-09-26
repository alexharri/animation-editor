import { EvalFunction } from "mathjs";
import { CompositionState } from "~/composition/compositionReducer";
import { FlowNodeState } from "~/flow/flowNodeState";
import { KeySelectionMap, PropertyValueMap, ValueType } from "~/types";

export enum FlowNodeType {
	empty = "empty",

	num_input = "num_input",
	num_cap = "num_cap",
	num_lerp = "num_lerp",

	vec2_add = "vec2_add",
	vec2_lerp = "vec2_lerp",
	vec2_factors = "vec2_factors",
	vec2_input = "vec2_input",

	deg_to_rad = "deg_to_rad",
	rad_to_deg = "rad_to_deg",

	rect_translate = "rect_translate",

	expr = "expr",

	color_from_rgba_factors = "color_from_rgba_factors",
	color_to_rgba_factors = "color_to_rgba_factors",
	color_input = "color_input",

	property_output = "property_output",
	property_input = "property_input",

	array_modifier_index = "array_modifier_index",

	composition = "composition",
}

export interface FlowNodeProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	zIndex: number;
}

export type FlowComputeNodeArg = {
	type: ValueType;
	value: any;
};

export interface FlowComputeContext {
	computed: { [nodeId: string]: FlowComputeNodeArg[] };
	compositionState: CompositionState;
	compositionId: string;
	layerId: string;
	arrayModifierIndex: number;
	container: {
		width: number;
		height: number;
	};
	propertyToValue: PropertyValueMap;
	frameIndex: number;
	expressionCache: { [nodeId: string]: EvalFunction };
}

export interface FlowGraph {
	type: "layer_graph" | "array_modifier_graph";
	layerId: string;
	propertyId: string;
	id: string;
	moveVector: Vec2;
	nodes: { [nodeId: string]: FlowNode<FlowNodeType> };
	selection: { nodes: KeySelectionMap };
	_addNodeOfTypeOnClick: { type: FlowNodeType; io?: FlowNodeIO } | null;
	_dragSelectRect: Rect | null;
	_dragOutputTo: {
		position: Vec2;
		fromOutput: { nodeId: string; outputIndex: number };
		wouldConnectToInput: {
			nodeId: string;
			inputIndex: number;
		} | null;
	} | null;
	_dragInputTo: {
		position: Vec2;
		fromInput: { nodeId: string; inputIndex: number };
		wouldConnectToOutput: {
			nodeId: string;
			outputIndex: number;
		} | null;
	} | null;
}

export interface FlowNode<T extends FlowNodeType> {
	id: string;
	type: T;
	position: Vec2;
	width: number;
	inputs: FlowNodeInput[];
	outputs: FlowNodeOutput[];
	state: FlowNodeState<T>;
}

export interface FlowNodeInput<T = any> {
	type: ValueType;
	name: string;
	value: T;
	pointer: {
		nodeId: string;
		outputIndex: number;
	} | null;
}

export interface FlowNodeOutput {
	name: string;
	type: ValueType;
}

export interface FlowNodeIO {
	inputs: FlowNodeInput[];
	outputs: FlowNodeOutput[];
}
