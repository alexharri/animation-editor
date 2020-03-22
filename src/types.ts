export type CardinalDirection = "n" | "w" | "s" | "e";
export type IntercardinalDirection = "ne" | "nw" | "se" | "sw";

export type GraphEditorNodeTypeVec2 = "add" | "multiply";

export type GraphEditorNodeType = GraphEditorNodeTypeVec2;

export type GraphEditorInput =
	| {
			type: "vec2";
			defaultValue?: Vec2;
	  }
	| {
			type: "rect";
			defaultValue?: Rect;
	  };

export interface GraphEditorNode {
	id: string;
	type: GraphEditorNodeType;
	position: Vec2;
}
