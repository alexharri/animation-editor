import { CompositionState } from "~/composition/compositionReducer";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";
import { ShapeEdge, ShapeGraph, ShapeSelection } from "~/shape/shapeTypes";
import { PropertyGroupName, PropertyName } from "~/types";
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
	selection: ShapeSelection,
): Line | CubicBezier => {
	const node = shapeState.nodes[fromNodeId];
	const shape = shapeState.shapes[node.shapeId];

	const moveVector = shape.moveVector;

	const x = edge.n0 === fromNodeId;

	const n0Id = x ? edge.n0 : edge.n1;
	const n1Id = x ? edge.n1 : edge.n0;
	const cp0 = shapeState.controlPoints[x ? edge.cp0 : edge.cp1];
	const cp1 = shapeState.controlPoints[x ? edge.cp1 : edge.cp0];

	const n0 = shapeState.nodes[n0Id];
	const n1 = shapeState.nodes[n1Id];

	let p0 = n0.position;
	let p3 = n1.position;

	if (selection.nodes[n0Id]) {
		p0 = p0.add(moveVector);
	}
	if (selection.nodes[n1Id]) {
		p3 = p3.add(moveVector);
	}

	let p1 = cp0 ? p0.add(cp0.position) : null;
	let p2 = cp1 ? p3.add(cp1.position) : null;

	if (p1 && selection.controlPoints[cp0!.id] && !selection.nodes[n0Id]) {
		p1 = p1.add(moveVector);
	}
	if (p2 && selection.controlPoints[cp1!.id] && !selection.nodes[n1Id]) {
		p2 = p2.add(moveVector);
	}

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

export const getShapePathFirstNodeId = (
	shape: ShapeGraph,
	shapeState: ShapeState,
	nodeToEdgeIds: { [nodeId: string]: string[] },
): string => {
	const initialNode = shapeState.nodes[shape.nodes[0]];

	let lastEdgeId: string | undefined;
	let curr = initialNode;

	while (true) {
		const edgeIds = nodeToEdgeIds[curr.id];

		if (edgeIds.length > 2) {
			throw new Error(`Expected a circular path. Node ${curr.id} has more than 2 edges.`);
		}

		let edgeId: string;

		if (!lastEdgeId) {
			edgeId = edgeIds[0];
		} else {
			edgeId = edgeIds[0] !== lastEdgeId ? edgeIds[0] : edgeIds[1];
		}

		if (!edgeId) {
			return curr.id;
		}

		const edge = shapeState.edges[edgeId];
		const nextNodeId = edge.n0 !== curr.id ? edge.n0 : edge.n1;

		if (!nextNodeId) {
			return curr.id;
		}

		if (nextNodeId === initialNode.id) {
			return initialNode.id;
		}

		lastEdgeId = edgeId;
		curr = shapeState.nodes[nextNodeId];
	}
};

export const getShapePath = (
	shapeId: string,
	shapeState: ShapeState,
	shapeSelectionState: ShapeSelectionState,
	transformFn?: (vec: Vec2) => Vec2,
): Array<Line | CubicBezier> | null => {
	const shape = shapeState.shapes[shapeId];
	const shapeSelection = getShapeSelectionFromState(shapeId, shapeSelectionState);

	const nodeToEdgeIds = getShapeNodeToEdges(shapeId, shapeState);

	if (shape.nodes.length < 2) {
		return null;
	}

	const paths: Array<Line | CubicBezier> = [];
	const firstNodeId = getShapePathFirstNodeId(shape, shapeState, nodeToEdgeIds);

	let lastEdgeId: string | undefined;
	let curr = shapeState.nodes[firstNodeId];

	while (true) {
		const edgeIds = nodeToEdgeIds[curr.id];

		if (edgeIds.length > 2) {
			throw new Error(`Expected a circular path. Node ${curr.id} has more than 2 edges.`);
		}

		let edgeId: string;

		if (!lastEdgeId) {
			edgeId = edgeIds[0];
		} else {
			edgeId = edgeIds[0] !== lastEdgeId ? edgeIds[0] : edgeIds[1];
		}

		if (!edgeId) {
			break;
		}

		const edge = shapeState.edges[edgeId];
		const nextNodeId = edge.n0 !== curr.id ? edge.n0 : edge.n1;

		if (!nextNodeId) {
			break;
		}

		// Add node -> next as path
		const path = getShapeEdgeAsPath(curr.id, edge, shapeState, shapeSelection);

		if (transformFn) {
			for (let i = 0; i < path.length; i += 1) {
				path[i] = transformFn(path[i]);
			}
		}

		paths.push(path);

		if (nextNodeId === firstNodeId) {
			break;
		}

		lastEdgeId = edgeId;
		curr = shapeState.nodes[nextNodeId];
	}

	return paths;
};

export const getShapePathClosePathNode = (fromNodeId: string, shapeState: ShapeState) => {
	const node = shapeState.nodes[fromNodeId];
	const shapeId = node.shapeId;
	const nodeToEdgeIds = getShapeNodeToEdges(shapeId, shapeState);

	const initialNode = shapeState.nodes[fromNodeId];

	// Check if initial node has two full edges
	const edges = nodeToEdgeIds[initialNode.id];
	if (edges.length > 1) {
		let hasNonFullEdge = false;

		for (const edgeId of edges) {
			const edge = shapeState.edges[edgeId];
			if (!edge.n0 || !edge.n1) {
				hasNonFullEdge = true;
				break;
			}
		}

		if (!hasNonFullEdge) {
			return null;
		}
	}

	let lastEdgeId: string | undefined;
	let curr = initialNode;

	while (true) {
		const edgeIds = nodeToEdgeIds[curr.id];

		if (edgeIds.length > 2) {
			throw new Error(`Expected a circular path. Node ${curr.id} has more than 2 edges.`);
		}

		let edgeId: string;

		if (!lastEdgeId) {
			edgeId = edgeIds[0];
		} else {
			edgeId = edgeIds[0] !== lastEdgeId ? edgeIds[0] : edgeIds[1];
		}

		if (!edgeId) {
			return curr.id;
		}

		const edge = shapeState.edges[edgeId];
		const nextNodeId = edge.n0 !== curr.id ? edge.n0 : edge.n1;

		if (!nextNodeId) {
			return curr.id;
		}

		if (nextNodeId === initialNode.id) {
			return null;
		}

		lastEdgeId = edgeId;
		curr = shapeState.nodes[nextNodeId];
	}
};

/**
 * @returns `nodeId: string, preferredControlPoint: string | undefined`
 */
export const getShapeContinuePathFrom = (
	shapeIds: string[],
	shapeState: ShapeState,
	shapeSelectionState: ShapeSelectionState,
): [string, string | undefined] | undefined => {
	// Nothing was hit
	//
	// Check if:
	//
	//		a) A single node is selected
	//		b) A single control point is selected
	// 		c) A single node and its associated control point are both selected
	//
	// The 'single' part applies to the combined selection of all paths. If two nodes
	// are selected in different paths then they cancel each other out.
	//
	// If a control point is selected, we treat it as if its associated node is selected.
	//
	// The node must be a filament (only has one full edge). If the node has two full
	// edges than we cannot extend the path it.
	//
	// If all of those conditions apply, we extend the path from the node

	const shapeIdToNodeToEdges = shapeIds.reduce<{
		[shapeId: string]: { [nodeId: string]: string[] };
	}>((obj, shapeId) => {
		obj[shapeId] = getShapeNodeToEdges(shapeId, shapeState);
		return obj;
	}, {});

	let selectedNode: string | undefined;
	let selectedControlPoint: string | undefined;

	for (const shapeId of shapeIds) {
		const shape = shapeState.shapes[shapeId];
		const selection = getShapeSelectionFromState(shapeId, shapeSelectionState);

		for (const edgeId of shape.edges) {
			const edge = shapeState.edges[edgeId];

			for (const cpId of [edge.cp0, edge.cp1]) {
				if (!cpId || !selection.controlPoints[cpId]) {
					continue;
				}

				if (selectedControlPoint) {
					// Two selected control points, break
					return undefined;
				}
				selectedControlPoint = cpId;
			}
		}

		for (const nodeId of shape.nodes) {
			if (!selection.nodes[nodeId]) {
				continue;
			}

			if (selectedNode) {
				// Two selected nodes points, break
				return undefined;
			}

			selectedNode = nodeId;
		}
	}

	if (selectedNode && selectedControlPoint) {
		const node = shapeState.nodes[selectedNode];
		const edgeIds = shapeIdToNodeToEdges[node.shapeId][node.id];

		for (const edgeId of edgeIds) {
			const edge = shapeState.edges[edgeId];

			if (!edge.n0) {
				if (selectedControlPoint === edge.cp1) {
					// partial edge's control point is the selected. Valid.
					return [selectedNode, selectedControlPoint];
				}

				// The node's partial edge control point is not the
				// selected control point. Invalid.
				return undefined;
			}

			if (!edge.n1) {
				if (selectedControlPoint === edge.cp0) {
					return [selectedNode, selectedControlPoint];
				}

				return undefined;
			}

			// Edge is full, continue
		}

		// Node has no partial edges where `selectedControlPoint` can show up. Invalid
		return undefined;
	}

	if (selectedControlPoint) {
		const cp = shapeState.controlPoints[selectedControlPoint]!;
		const edge = shapeState.edges[cp.edgeId];

		const nodeId = edge.cp0 !== cp.id ? edge.n1 : edge.n0;
		const otherNodeId = edge.cp0 !== cp.id ? edge.n0 : edge.n1;

		if (otherNodeId) {
			// Is control point of full edge. Invalid
			return undefined;
		}

		return [nodeId, selectedControlPoint];
	}

	if (selectedNode) {
		const node = shapeState.nodes[selectedNode];
		const edgeIds = shapeIdToNodeToEdges[node.shapeId][node.id];

		if (edgeIds.length < 2) {
			return [selectedNode, undefined];
		}

		// Check if any of those edges are incomplete
		for (const edgeId of edgeIds) {
			const edge = shapeState.edges[edgeId];

			if (!edge.n0) {
				return [selectedNode, edge.cp1];
			}

			if (!edge.n1) {
				return [selectedNode, edge.cp0];
			}
		}
	}

	return undefined;
};

export const getShapeLayerShapeIds = (
	layerId: string,
	compositionState: CompositionState,
): string[] => {
	const layer = compositionState.layers[layerId];

	// Find content group
	const names = layer.properties.map(
		(propertyId) => compositionState.properties[propertyId].name,
	);
	const groupIndex = names.indexOf(PropertyGroupName.Content);
	const contentsGroupId = layer.properties[groupIndex];
	const contentsGroup = compositionState.properties[contentsGroupId] as CompositionPropertyGroup;

	// Find all shape groups within contents group
	const shapeGroupIds = contentsGroup.properties.filter((propertyId) => {
		const property = compositionState.properties[propertyId] as CompositionPropertyGroup;
		return property.name === PropertyGroupName.Shape;
	});

	const shapeIds: string[] = [];

	// Find all shapes within all the shapes
	for (const shapeGroupId of shapeGroupIds) {
		const shapeGroup = compositionState.properties[shapeGroupId] as CompositionPropertyGroup;

		for (const propertyId of shapeGroup.properties) {
			const property = compositionState.properties[propertyId] as CompositionProperty;

			if (property.name === PropertyName.ShapeLayer_Path) {
				shapeIds.push(property.value); // Value is shapeId
			}
		}
	}

	return shapeIds;
};
