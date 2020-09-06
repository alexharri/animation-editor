import { KeySelectionMap } from "~/types";

export interface ShapeGraph {
	id: string;
	nodes: string[];
	edges: string[];
	moveVector: Vec2;
}

export interface ShapePathItem {
	nodeId: string;
	reflectControlPoints: boolean;
	left: null | {
		edgeId: string;
		controlPointId: string;
	};
	right: null | {
		edgeId: string;
		controlPointId: string;
	};
}

export interface FullShapePathItem {
	nodeId: string;
	reflectControlPoints: boolean;
	left: {
		edgeId: string;
		controlPointId: string;
	};
	right: {
		edgeId: string;
		controlPointId: string;
	};
}

export interface ShapePath {
	id: string;
	shapeId: string;
	items: ShapePathItem[];
}

export interface ShapeNode {
	id: string;
	shapeId: string;
	position: Vec2;
}

export interface ShapeEdge {
	id: string;
	shapeId: string;
	n0: string;
	n1: string;
	cp0: string;
	cp1: string;
}

export interface ShapeControlPoint {
	id: string;
	edgeId: string;
	position: Vec2;
}

export interface ShapeSelection {
	nodes: KeySelectionMap;
	edges: KeySelectionMap;
	controlPoints: KeySelectionMap;
}

export interface ShapeContinueFrom {
	pathId: string;
	direction: "left" | "right";
}
