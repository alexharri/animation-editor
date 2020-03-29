export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export type CardinalDirection = "n" | "w" | "s" | "e";
export type IntercardinalDirection = "ne" | "nw" | "se" | "sw";

export enum NodeEditorNodeType {
	empty = "empty",
	add_vec2 = "add_vec2",
	translate_rect = "translate_rect",
}

export type NodeEditorNodeOutputPointer = {
	nodeId: string;
	outputIndex: number;
};

export type GraphEditorInput =
	| {
			type: "vec2";
			defaultValue?: Vec2;
	  }
	| {
			type: "number";
			defaultValue?: number;
	  };

export type NodeEditorValueType = "number" | "vec2";

export interface NodeEditorValueTypeMap {
	number: number;
	vec2: Vec2;
}

export interface NodeEditorNodeInput<T extends NodeEditorValueType = NodeEditorValueType> {
	type: T;
	name: string;
	defaultValue: NodeEditorValueTypeMap[T];
}

export interface NodeEditorNodeOutput<
	I extends any[] = any[],
	T extends NodeEditorValueType = NodeEditorValueType
> {
	type: T;
	name: string;
	compute: (inputs: I) => NodeEditorValueTypeMap[T];
}

export interface NodeEditorNodeIO {
	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
}
