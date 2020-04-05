export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export type CardinalDirection = "n" | "w" | "s" | "e";
export type IntercardinalDirection = "ne" | "nw" | "se" | "sw";

export enum NodeEditorNodeType {
	empty = "empty",
	add_vec2 = "add_vec2",
	translate_rect = "translate_rect",
}

export enum NodeEditorValueType {
	Vec2,
	Rect,
}
