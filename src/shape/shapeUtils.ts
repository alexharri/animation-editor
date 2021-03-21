import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { Property, PropertyGroup } from "~/composition/compositionTypes";
import {
	reduceLayerProperties,
	reduceLayerPropertiesAndGroups,
} from "~/composition/compositionUtils";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";
import { ShapePath, ShapePathItem, ShapeSelection } from "~/shape/shapeTypes";
import {
	FillRule,
	LayerType,
	LineCap,
	LineJoin,
	PropertyGroupName,
	PropertyName,
	RGBAColor,
} from "~/types";
import { completeCubicBezier, expandRect, getDistance, isVecInRect, rectOfVecs } from "~/util/math";
import { closestPointOnPath } from "~/util/math/closestPoint";
import { PenToolContext } from "~/workspace/penTool/penToolContext";

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

const getItemControlPointPositions = (
	item: ShapePathItem,
	shapeState: ShapeState,
): [Vec2 | null, Vec2 | null] => {
	const { left, right } = item;

	return [left, right].map<Vec2 | null>((_, i, parts) => {
		const part0 = parts[i];

		if (!part0) {
			return null;
		}

		const cp = shapeState.controlPoints[part0.controlPointId];

		if (!cp) {
			return null;
		}

		return cp.position;
	}) as [Vec2 | null, Vec2 | null];
};

export const pathIdToCurves = (
	pathId: string,
	shapeState: ShapeState,
	transformFn?: (vec: Vec2) => Vec2,
): Curve[] | null => {
	const curves: Array<Line | CubicBezier> = [];

	const { items } = shapeState.paths[pathId];

	const itemCpPositions = items.map((item) => getItemControlPointPositions(item, shapeState));

	for (let i = 0; i < items.length; i++) {
		const inext = i !== items.length - 1 ? i + 1 : 0;

		const item0 = items[i];
		const item1 = items[inext];

		if (!item1) {
			continue;
		}

		if (!item0.right || !item1.left || item0.right.edgeId !== item1.left.edgeId) {
			continue;
		}

		let curve: Curve;

		const [, cp0] = itemCpPositions[i];
		const [cp1] = itemCpPositions[inext];

		let p0 = shapeState.nodes[item0.nodeId].position;
		let p3 = shapeState.nodes[item1.nodeId].position;

		let p1 = cp0 ? p0.add(cp0) : null;
		let p2 = cp1 ? p3.add(cp1) : null;

		if (p1 && p2) {
			curve = [p0, p1, p2, p3];
		} else if (p1 || p2) {
			curve = completeCubicBezier(p0, p1, p2, p3);
		} else {
			curve = [p0, p3];
		}

		if (transformFn) {
			for (let j = 0; j < curve.length; j += 1) {
				curve[j] = transformFn(curve[j]);
			}
		}

		curves.push(curve);
	}

	return curves;
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
	const contentsGroup = compositionState.properties[contentsGroupId] as PropertyGroup;

	// Find all shape groups within contents group
	const shapeGroupIds = contentsGroup.properties.filter((propertyId) => {
		const property = compositionState.properties[propertyId] as PropertyGroup;
		return property.name === PropertyGroupName.Shape;
	});

	const shapeIds: string[] = [];

	// Find all shapes within all the shapes
	for (const shapeGroupId of shapeGroupIds) {
		const shapeGroup = compositionState.properties[shapeGroupId] as PropertyGroup;

		for (const propertyId of shapeGroup.properties) {
			const property = compositionState.properties[propertyId] as Property;

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
	const selection = compSelectionFromState(compositionId, compositionSelectionState);

	const selectedLayers = Object.keys(selection.layers);

	const selectedShapeLayers = selectedLayers.filter((layerId) => {
		const layer = compositionState.layers[layerId];

		if (!layer) {
			return false;
		}

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
	const selection = compSelectionFromState(compositionId, compositionSelectionState);
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
			type: "point_on_edge";
			point: Vec2;
			t: number;
			id: string;
	  }
	| {
			type: undefined;
			id: string;
	  };

export const getPathTargetObject = (
	pathId: string,
	viewportMousePosition: Vec2,
	normalToViewport: (vec: Vec2) => Vec2,
	shapeState: ShapeState,
): PathTargetObject => {
	const DIST = 7;

	const path = shapeState.paths[pathId];

	for (const item of path.items) {
		const { nodeId, left, right } = item;

		const node = shapeState.nodes[nodeId];
		const position = node.position;

		for (const part of [left, right]) {
			if (!part || !part.controlPointId) {
				continue;
			}

			const { controlPointId } = part;
			const cp = shapeState.controlPoints[controlPointId]!;

			if (!cp) {
				console.log({ part, item, path });
			}

			let cpPos = position.add(cp.position);

			if (getDistance(viewportMousePosition, normalToViewport(cpPos)) < DIST) {
				return {
					type: "control_point",
					id: controlPointId,
				};
			}
		}

		if (getDistance(viewportMousePosition, normalToViewport(position)) < DIST) {
			return {
				type: "node",
				id: nodeId,
			};
		}
	}

	const pathList = pathIdToCurves(pathId, shapeState, normalToViewport);
	if (pathList) {
		for (let i = 0; i < pathList.length; i += 1) {
			const p = pathList[i];
			const rect = expandRect(rectOfVecs(p), 5);
			if (!isVecInRect(viewportMousePosition, rect)) {
				continue;
			}

			const { point, t } = closestPointOnPath(p, viewportMousePosition);
			if (getDistance(point, viewportMousePosition) < 5) {
				return {
					type: "point_on_edge",
					point,
					t,
					id: path.items[i].right!.edgeId,
				};
			}
		}
	}

	return { type: undefined, id: "" };
};

export const getPathTargetObjectFromContext = (
	pathId: string,
	ctx: PenToolContext,
): PathTargetObject => {
	const { normalToViewport, shapeState, mousePosition } = ctx;

	return getPathTargetObject(pathId, mousePosition.viewport, normalToViewport, shapeState);
};

export const getShapeLayerDirectlySelectedPaths = (
	layerId: string,
	compositionState: CompositionState,
	compositionSelectionState: CompositionSelectionState,
): Set<string> => {
	const layer = compositionState.layers[layerId];
	const selection = compSelectionFromState(layer.compositionId, compositionSelectionState);

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
	const selection = compSelectionFromState(layer.compositionId, compositionSelectionState);

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

export const getCompositionSelectedPathsSet = (
	compositionId: string,
	compositionState: CompositionState,
	compositionSelectionState: CompositionSelectionState,
): Set<string> => {
	let set = new Set<string>();

	const composition = compositionState.compositions[compositionId];
	const selection = compSelectionFromState(compositionId, compositionSelectionState);

	for (const layerId of composition.layers) {
		const layer = compositionState.layers[layerId];

		if (layer.type !== LayerType.Shape) {
			continue;
		}

		set = reduceLayerPropertiesAndGroups<Set<string>>(
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
						if (
							selection.properties[shapeGroup.id] ||
							selection.properties[propertyId]
						) {
							set.add(property.value);
						}
						break;
					}
				}
				return set;
			},
			set,
		);
	}

	return set;
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

export const getShapeStrokeGroupValues = (
	group: PropertyGroup,
	compositionState: CompositionState,
) => {
	let lineWidth!: number;
	let color!: RGBAColor;
	let opacity!: number;
	let lineJoin!: LineJoin;
	let lineCap!: LineCap;
	let miterLimit!: number;

	for (const propertyId of group.properties) {
		const property = compositionState.properties[propertyId];
		switch (property.name) {
			case PropertyName.StrokeWidth: {
				lineWidth = property.value;
				break;
			}
			case PropertyName.RGBAColor: {
				color = property.value;
				break;
			}
			case PropertyName.Opacity: {
				opacity = property.value;
				break;
			}
			case PropertyName.LineJoin: {
				lineJoin = property.value;
				break;
			}
			case PropertyName.LineCap: {
				lineCap = property.value;
				break;
			}
			case PropertyName.MiterLimit: {
				miterLimit = property.value;
				break;
			}
		}
	}

	return { lineWidth, color, opacity, lineJoin, lineCap, miterLimit };
};

export const getShapeFillGroupValues = (
	group: PropertyGroup,
	compositionState: CompositionState,
) => {
	let color!: RGBAColor;
	let opacity!: number;
	let fillRule!: FillRule;

	for (const propertyId of group.properties) {
		const property = compositionState.properties[propertyId];
		switch (property.name) {
			case PropertyName.RGBAColor: {
				color = property.value;
				break;
			}
			case PropertyName.Opacity: {
				opacity = property.value;
				break;
			}
			case PropertyName.FillRule: {
				fillRule = property.value;
				break;
			}
		}
	}

	return { color, opacity, fillRule };
};

export const getPathIdToShapeGroupId = (layerId: string, compositionState: CompositionState) => {
	return reduceLayerPropertiesAndGroups<{ [pathId: string]: string }>(
		layerId,
		compositionState,
		(obj, group) => {
			if (group.name !== PropertyGroupName.Shape) {
				return obj;
			}
			let pathIndex = -1;
			for (let i = 0; i < group.properties.length; i++) {
				if (
					compositionState.properties[group.properties[i]].name ===
					PropertyName.ShapeLayer_Path
				) {
					pathIndex = i;
					break;
				}
			}
			if (pathIndex === -1) {
				return obj;
			}
			const pathPropertyId = group.properties[pathIndex];
			const property = compositionState.properties[pathPropertyId] as Property;
			const pathId = property.value;
			obj[pathId] = group.id;
			return obj;
		},
		{},
	);
};

export const isShapePathClosed = (path: ShapePath): boolean => {
	if (path.items.length === 1) {
		return false;
	}

	const item0 = path.items[0];
	const item1 = path.items[path.items.length - 1];

	if (!item0.left || !item0.left.edgeId || !item1.right || !item1.right.edgeId) {
		return false;
	}

	return item0.left.edgeId === item1.right.edgeId;
};
