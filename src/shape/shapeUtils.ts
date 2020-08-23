import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import {
	reduceLayerProperties,
	reduceLayerPropertiesAndGroups,
} from "~/composition/compositionUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";
import { ShapeEdge, ShapeGraph, ShapeSelection } from "~/shape/shapeTypes";
import { LayerType, PropertyGroupName, PropertyName } from "~/types";
import { getDistance, quadraticToCubicBezier } from "~/util/math";
import { PenToolContext } from "~/workspace/penTool/penToolContext";

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

export const pathIdToPathList = (
	pathId: string,
	shapeState: ShapeState,
	shapeSelectionState: ShapeSelectionState,
	transformFn?: (vec: Vec2) => Vec2,
): Array<Line | CubicBezier> | null => {
	const pathList: Array<Line | CubicBezier> = [];

	const { items, shapeId } = shapeState.paths[pathId];

	const shapeSelection = getShapeSelectionFromState(shapeId, shapeSelectionState);

	for (let i = 0; i < items.length; i++) {
		const { nodeId, right } = items[i];

		const nextItem = items[i !== items.length - 1 ? i + 1 : 0];

		if (right && nextItem && nextItem.left?.edgeId === right.edgeId) {
			const edge = shapeState.edges[right.edgeId];
			const path = getShapeEdgeAsPath(nodeId, edge, shapeState, shapeSelection);

			if (transformFn) {
				for (let j = 0; j < path.length; j += 1) {
					path[j] = transformFn(path[j]);
				}
			}

			pathList.push(path);
		}
	}

	return pathList;
};

export const getShapePathClosePathNodeId = (
	continueFrom: { pathId: string; direction: "left" | "right" },
	shapeState: ShapeState,
): string | null => {
	const { pathId, direction } = continueFrom;
	const path = shapeState.paths[pathId];

	if (path.items.length === 1) {
		return null;
	}

	const { nodeId } = path.items[direction === "left" ? path.items.length - 1 : 0];
	return nodeId;
};

/**
 * @returns `nodeId: string, preferredControlPoint: string | undefined`
 */
export const getShapeContinuePathFrom = (
	pathIds: string[],
	shapeState: ShapeState,
	shapeSelectionState: ShapeSelectionState,
): null | { pathId: string; direction: "left" | "right" } => {
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

	let continueFrom: null | { pathId: string; direction: "left" | "right" } = null;

	outer: for (const pathId of pathIds) {
		const path = shapeState.paths[pathId];
		const selection = getShapeSelectionFromState(path.shapeId, shapeSelectionState);

		let firstValid = false;
		let lastValid = false;
		let isCircular = false;

		if (path.items.length === 1) {
			const { nodeId, left, right } = path.items[0];

			if (
				left &&
				right &&
				selection.controlPoints[left.controlPointId] &&
				selection.controlPoints[right.controlPointId]
			) {
				continueFrom = null;
				break outer;
			}

			// Prefer to continue in the right direction
			if (
				selection.nodes[nodeId] ||
				(right && selection.controlPoints[right.controlPointId])
			) {
				if (continueFrom) {
					continueFrom = null;
					break outer;
				}
				continueFrom = { pathId, direction: "right" };
				continue;
			}

			if (left && selection.controlPoints[left.controlPointId]) {
				if (continueFrom) {
					continueFrom = null;
					break outer;
				}
				continueFrom = { pathId, direction: "left" };
				continue;
			}
		} else {
			const firstItem = path.items[0];
			const lastItem = path.items[path.items.length - 1];

			isCircular = !!(
				firstItem.left &&
				lastItem.right &&
				firstItem.left.edgeId === lastItem.right.edgeId
			);

			if (
				selection.nodes[firstItem.nodeId] ||
				(firstItem.left && selection.controlPoints[firstItem.left.controlPointId])
			) {
				if (continueFrom) {
					continueFrom = null;
					break outer;
				}
				continueFrom = { pathId, direction: "left" };
				firstValid = true;
			}

			if (firstItem.right && selection.controlPoints[firstItem.right.controlPointId]) {
				continueFrom = null;
				break outer;
			}

			if (
				selection.nodes[lastItem.nodeId] ||
				(lastItem.right && selection.controlPoints[lastItem.right.controlPointId])
			) {
				if (continueFrom) {
					continueFrom = null;
					break outer;
				}
				continueFrom = { pathId, direction: "right" };
				lastValid = true;
			}

			if (lastItem.left && selection.controlPoints[lastItem.left.controlPointId]) {
				continueFrom = null;
				break outer;
			}
		}

		if ((firstValid && lastValid) || (isCircular && (firstValid || lastValid))) {
			continueFrom = null;
			break outer;
		}

		for (let i = 1; i < path.items.length - 1; i += 1) {
			// If any of these is selected, we break
			const { nodeId, left, right } = path.items[i];

			const leftSelected = left && selection.controlPoints[left.controlPointId];
			const rightSelected = right && selection.controlPoints[right.controlPointId];

			if (selection.nodes[nodeId] || leftSelected || rightSelected) {
				continueFrom = null;
				break outer;
			}
		}
	}

	return continueFrom;
};

export const getShapeLayerPathIds = (
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

/**
 * @returns null if more than one shape layers are selected
 */
export const getSingleSelectedShapeLayerId = (
	compositionId: string,
	compositionState: CompositionState,
	compositionSelectionState: CompositionSelectionState,
): string | null => {
	const selection = getCompSelectionFromState(compositionId, compositionSelectionState);

	const selectedLayers = Object.keys(selection.layers);

	// console.log(selection, compositionId);
	const selectedShapeLayers = selectedLayers.filter((layerId) => {
		const layer = compositionState.layers[layerId];
		return layer.type === LayerType.Shape;
	});

	if (selectedShapeLayers.length === 1) {
		return selectedShapeLayers[0];
	}

	return null;
};

export const getSelectedShapeLayerIds = (
	compositionId: string,
	compositionState: CompositionState,
	compositionSelectionState: CompositionSelectionState,
): string[] => {
	const selection = getCompSelectionFromState(compositionId, compositionSelectionState);
	const composition = compositionState.compositions[compositionId];
	return composition.layers.filter((layerId) => {
		const layer = compositionState.layers[layerId];
		return layer.type === LayerType.Shape && selection.layers[layer.id];
	});
};

type PathTargetObject =
	| {
			type: "node";
			id: string;
	  }
	| {
			type: "control_point";
			id: string;
	  }
	| {
			type: undefined;
			id: string;
	  };

export const getPathTargetObject = (pathId: string, ctx: PenToolContext): PathTargetObject => {
	const DIST = 7;

	const {
		normalToViewport,
		shapeState,
		shapeSelectionState,
		layerTransform,
		mousePosition,
	} = ctx;

	const path = shapeState.paths[pathId];
	const shape = shapeState.shapes[path.shapeId];
	const selection = getShapeSelectionFromState(path.shapeId, shapeSelectionState);

	const { moveVector } = shape;

	for (const item of path.items) {
		const { nodeId, left, right } = item;

		const node = shapeState.nodes[nodeId];
		const nodeSelected = selection.nodes[nodeId];

		const position = nodeSelected ? node.position.add(moveVector) : node.position;

		for (const part of [left, right]) {
			if (!part || !part.controlPointId) {
				continue;
			}

			const { controlPointId } = part;
			const cp = shapeState.controlPoints[controlPointId]!;
			const cpSelected = selection.controlPoints[controlPointId];

			if (!cp) {
				console.log({ part, item, path });
			}

			let cpPos = position.add(cp.position);

			if (!nodeSelected && cpSelected) {
				cpPos = cpPos.add(moveVector);
			}

			if (
				getDistance(
					mousePosition.viewport,
					normalToViewport(cpPos.add(layerTransform.translate)),
				) < DIST
			) {
				return {
					type: "control_point",
					id: controlPointId,
				};
			}
		}

		if (getDistance(mousePosition.viewport, normalToViewport(position)) < DIST) {
			return {
				type: "node",
				id: nodeId,
			};
		}
	}

	return { type: undefined, id: "" };
};

export const getShapeLayerDirectlySelectedPaths = (
	layerId: string,
	compositionState: CompositionState,
	compositionSelectionState: CompositionSelectionState,
): Set<string> => {
	const layer = compositionState.layers[layerId];
	const selection = getCompSelectionFromState(layer.compositionId, compositionSelectionState);

	return reduceLayerPropertiesAndGroups<Set<string>>(
		layer.id,
		compositionState,
		(set, property) => {
			if (
				property.name === PropertyName.ShapeLayer_Path &&
				selection.properties[property.id]
			) {
				set.add(property.value);
			}

			return set;
		},
		new Set(),
	);
};

export const getShapeLayerSelectedPathIds = (
	layerId: string,
	compositionState: CompositionState,
	compositionSelectionState: CompositionSelectionState,
): string[] => {
	const layer = compositionState.layers[layerId];
	const selection = getCompSelectionFromState(layer.compositionId, compositionSelectionState);

	const pathIdSet = reduceLayerPropertiesAndGroups<Set<string>>(
		layer.id,
		compositionState,
		(set, shapeGroup) => {
			if (shapeGroup.name !== PropertyGroupName.Shape) {
				return set;
			}

			for (const propertyId of shapeGroup.properties) {
				const property = compositionState.properties[propertyId];
				if (property.name === PropertyName.ShapeLayer_Path) {
					// If either the shape group or the path property are selected
					// the guides are rendered.
					if (selection.properties[shapeGroup.id] || selection.properties[propertyId]) {
						set.add(property.value);
					}
					break;
				}
			}
			return set;
		},
		new Set(),
	);

	return [...pathIdSet];
};

export const getLayerPathPropertyId = (
	layerId: string,
	pathId: string,
	compositionState: CompositionState,
): string | undefined => {
	let pathPropertyId: string | undefined;
	reduceLayerProperties(
		layerId,
		compositionState,
		(_, property) => {
			if (property.name === PropertyName.ShapeLayer_Path && property.value === pathId) {
				pathPropertyId = property.id;
			}
			return null;
		},
		null,
	);
	return pathPropertyId;
};
