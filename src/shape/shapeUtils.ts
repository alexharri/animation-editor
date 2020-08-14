import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";
import { ShapeEdge, ShapeSelection } from "~/shape/shapeTypes";
import { quadraticToCubicBezier } from "~/util/math";

export const getShapeNodeToEdges = (
	shapeId: string,
	shapeState: ShapeState,
): { [nodeId: string]: string[] } => {
	const shape = shapeState.shapes[shapeId];

	const obj: { [nodeId: string]: string[] } = {};

	for (const nodeId of shape.nodes) {
		obj[nodeId] = [];
	}

	return shape.edges.reduce((obj, edgeId) => {
		const edge = shapeState.edges[edgeId];

		if (edge.n0) {
			obj[edge.n0].push(edge.id);
		}

		if (edge.n1) {
			obj[edge.n1].push(edge.id);
		}

		return obj;
	}, obj);
};

export const getShapeEdgeAsPath = (
	fromNodeId: string,
	edge: ShapeEdge,
	shapeState: ShapeState,
): Line | CubicBezier => {
	const x = edge.n0 === fromNodeId;

	const n0Id = x ? edge.n0 : edge.n1;
	const n1Id = x ? edge.n1 : edge.n0;
	const cp0 = shapeState.controlPoints[x ? edge.cp0 : edge.cp1];
	const cp1 = shapeState.controlPoints[x ? edge.cp1 : edge.cp0];

	const n0 = shapeState.nodes[n0Id];
	const n1 = shapeState.nodes[n1Id];

	const p0 = n0.position;
	const p3 = n1.position;

	const p1 = cp0 ? p0.add(cp0.position) : null;
	const p2 = cp1 ? p3.add(cp1.position) : null;

	if (p1 && p2) {
		return [p0, p1, p2, p3];
	}
	if (p1 || p2) {
		return quadraticToCubicBezier(p0, p1, p2, p3);
	}
	return [p0, p3];
};

const _emptySelection: ShapeSelection = {
	nodes: {},
	edges: {},
	controlPoints: {},
};
export const getShapeSelectionFromState = (
	shapeId: string,
	shapeSelectionState: ShapeSelectionState,
): ShapeSelection => {
	// We reuse the same empty selection instead of creating a new one each time so
	// that different object references do not cause unnecessary rerenders.
	const selection = shapeSelectionState[shapeId] ?? _emptySelection;
	return selection;
};
