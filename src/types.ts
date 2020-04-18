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

export type Json = string | number | boolean | null | JsonObject | JsonArray | undefined;
export interface JsonArray extends Array<Json> {}
export interface JsonObject {
	[property: string]: Json;
}
