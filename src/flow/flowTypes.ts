import { FlowNodeState } from "~/flow/flowNodeState";
import { ValueType } from "~/types";

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

export interface FlowGraph {
	type: "layer_graph" | "array_modifier_graph";
	layerId: string;
	propertyId: string;
	id: string;
	nodes: string[];
	_addNodeOfTypeOnClick: { type: FlowNodeType; io?: FlowNodeIO } | null;
	_dragSelectRect: Rect | null;
}

export interface FlowNode<T extends FlowNodeType = FlowNodeType> {
	graphId: string;
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
