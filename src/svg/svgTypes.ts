import { FillRule, LineCap, LineJoin, RGBAColor } from "~/types";

export interface SVGNodeBase {
	transform: string;
	transformOrigin: string;
	position: Vec2;
	anchor: Vec2;
	rotation: number;
	scale: Vec2;
}

export interface SVGSvgNode extends SVGNodeBase {
	tagName: "svg";
	properties: {
		width?: number;
		height?: number;
	};
	children: SVGNode[];
}

export interface SVGRectNode extends SVGNodeBase {
	tagName: "rect";
	properties: {
		width: number;
		height: number;
		fill?: RGBAColor;
		strokeColor?: RGBAColor;
		strokeWidth?: number;
		lineJoin?: LineJoin;
	};
}

export interface SVGLineNode extends SVGNodeBase {
	tagName: "line";
	properties: {
		line: [Vec2, Vec2];
		length: number;
		strokeColor?: RGBAColor;
		strokeWidth?: number;
		lineCap?: LineCap;
	};
}

export interface SVGEllipseNode extends SVGNodeBase {
	tagName: "ellipse";
	properties: {
		fill?: RGBAColor;
		strokeColor?: RGBAColor;
		strokeWidth?: number;
		radius: Vec2;
	};
}

export interface SVGCircleNode extends SVGNodeBase {
	tagName: "circle";
	properties: {
		fill?: RGBAColor;
		strokeColor?: RGBAColor;
		strokeWidth?: number;
		radius: number;
	};
}

export interface SVGPathNode extends SVGNodeBase {
	tagName: "path";
	properties: {
		d: Array<{ curves: Curve[]; closed: boolean }>;
		fill?: RGBAColor;
		strokeColor?: RGBAColor;
		strokeWidth?: number;
		fillRule?: FillRule;
		lineCap?: LineCap;
		lineJoin?: LineJoin;
		miterLimit?: number;
	};
}

export interface SVGPolygonNode extends SVGNodeBase {
	tagName: "polygon";
	properties: {
		points: Vec2[];
		fill?: RGBAColor;
		strokeColor?: RGBAColor;
		strokeWidth?: number;
		fillRule?: FillRule;
		lineCap?: LineCap;
		lineJoin?: LineJoin;
		miterLimit?: number;
	};
}

export interface SVGPolylineNode extends SVGNodeBase {
	tagName: "polyline";
	properties: {
		points: Vec2[];
		fill?: RGBAColor;
		strokeColor?: RGBAColor;
		strokeWidth?: number;
		fillRule?: FillRule;
		lineCap?: LineCap;
		lineJoin?: LineJoin;
		miterLimit?: number;
	};
}

export interface SVGGNode extends SVGNodeBase {
	tagName: "g";
	properties: {};
	children: SVGNode[];
}

export type SVGNode =
	| SVGLineNode
	| SVGSvgNode
	| SVGRectNode
	| SVGCircleNode
	| SVGEllipseNode
	| SVGPathNode
	| SVGPolygonNode
	| SVGPolylineNode
	| SVGGNode;

export interface SvgStyles {
	[property: string]: string;
}
export interface SvgStylesheet {
	[selector: string]: SvgStyles;
}
