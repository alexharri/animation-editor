import { KeySelectionMap } from "~/types";

export interface ShapeGraph {
	id: string;
	nodes: string[];
	edges: string[];
	moveVector: Vec2;
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
