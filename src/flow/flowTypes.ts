import { EvalFunction } from "mathjs";
import { FlowNodeState } from "~/flow/flowNodeState";
import { CompositionError, ValueType } from "~/types";

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

export type ComputeFlowNodeResult =
	| {
			status: "ok";
			results: unknown[];
	  }
	| {
			status: "error";
			errors: CompositionError[];
	  };

/**
 * Can be the compiled version of a single flow graph, or the composite of
 * multiple flow graphs.
 */
export interface CompiledFlow {
	nodes: Record<string, CompiledFlowNode>;

	/**
	 * All node ids in the graph and the order to compute them in.
	 */
	toCompute: CompiledFlowNode[];

	/**
	 * A map from externals (such as frame index) to the nodes whose output
	 * is affected by their value.
	 */
	externals: FlowGraphExternals;

	/**
	 * A map from expression node ids to a compiled eval function that is used
	 * to perform the expression of the node.
	 */
	expressions: Record<string, EvalFunction>;
}

export interface CompiledFlowNode {
	id: string;
	next: CompiledFlowNode[];
	affectedExternals: FlowNodeAffectedExternals;
	computeIndex: number;
}

/**
 * Currently nodes can only affect the value of certain properties via
 * the `property_output` node.
 */
export interface FlowNodeAffectedExternals {
	propertyIds: string[];

	/**
	 * When connecting/disconnecting nodes, the `propertyIds` may not contain
	 * the recently disconnected node.
	 */
	potentialPropertyIds: string[];
}

export interface FlowGraphExternals {
	arrayModifierIndex: CompiledFlowNode[];
	frameIndex: CompiledFlowNode[];
	propertyValue: {
		[propertyId: string]: CompiledFlowNode[];
	};
}
