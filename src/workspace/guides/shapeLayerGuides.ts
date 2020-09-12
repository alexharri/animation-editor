import { CompositionLayer } from "~/composition/compositionTypes";
import { transformMat2 } from "~/composition/transformUtils";
import { Tool } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeContinueFrom } from "~/shape/shapeTypes";
import {
	getPathIdToShapeGroupId,
	getPathTargetObject,
	getShapeContinuePathFrom,
	getShapeLayerDirectlySelectedPaths,
	getShapeLayerPathIds,
	getShapeLayerSelectedPathIds,
	getShapePathClosePathNodeId,
	getShapeSelectionFromState,
	pathIdToCurves,
} from "~/shape/shapeUtils";
import { CompositionRenderValues, LayerType } from "~/types";
import {
	renderDiamond,
	traceCircle,
	traceCubicBezier,
	traceCurve,
	traceLine,
	traceRect,
} from "~/util/canvas/renderPrimitives";
import { isVecInRect, quadraticToCubicBezier, reflectVectorAngle } from "~/util/math";
import { pathBoundingRect, pathControlPointsBoundingRect } from "~/util/math/boundingRect";
import { RenderGuidesContext } from "~/workspace/renderTypes";

const getDirectlySelectedPaths = (opts: RenderGuidesContext, layerId: string) => {
	return getShapeLayerDirectlySelectedPaths(
		layerId,
		opts.compositionState,
		opts.compositionSelectionState,
	);
};

const getSelectedPathIds = (opts: RenderGuidesContext, layerId: string) => {
	return getShapeLayerSelectedPathIds(
		layerId,
		opts.compositionState,
		opts.compositionSelectionState,
	);
};

const getPathIds = (opts: RenderGuidesContext, layerId: string) => {
	return getShapeLayerPathIds(layerId, opts.compositionState);
};

const getContinue = (
	opts: RenderGuidesContext,
	layerId: string,
): { continueFrom: ShapeContinueFrom | null; closePathNodeId: string | null } => {
	let continueFrom: null | ShapeContinueFrom = null;
	let closePathNodeId: string | null = null;

	const {
		compositionState,
		compositionSelection,
		shapeState,
		shapeSelectionState,
		mousePosition,
		isPerformingAction,
	} = opts;

	if (!mousePosition || isPerformingAction) {
		return { continueFrom, closePathNodeId };
	}

	const selectedShapeLayers = Object.keys(compositionSelection.layers).filter((layerId) => {
		const layer = compositionState.layers[layerId];
		return layer.type === LayerType.Shape;
	});

	if (selectedShapeLayers.length !== 1 || selectedShapeLayers[0] !== layerId) {
		return { continueFrom, closePathNodeId };
	}

	const pathIds = getShapeLayerPathIds(layerId, compositionState);
	continueFrom = getShapeContinuePathFrom(pathIds, shapeState, shapeSelectionState);

	if (continueFrom) {
		closePathNodeId = getShapePathClosePathNodeId(continueFrom, shapeState);
	}

	return { continueFrom, closePathNodeId };
};

const renderCurves = (ctx: Ctx, curves: Curve[]) => {
	ctx.beginPath();
	for (let i = 0; i < curves.length; i++) {
		traceCurve(ctx, curves[i], { move: i === 0 });
	}
	ctx.strokeStyle = cssVariables.light300;
	ctx.lineWidth = 0.75;
	ctx.stroke();
	ctx.closePath();
};

const getShapeMoveVector = (
	opts: RenderGuidesContext,
	pathCtx: RenderPathContext,
	pathId: string,
) => {
	const { composition, compositionSelection } = opts;
	const { pathIdToShapeGroupId } = pathCtx;
	const shapeGroupId = pathIdToShapeGroupId[pathId];
	const shapeSelected = compositionSelection.properties[shapeGroupId];
	const shapeMoveVector = shapeSelected ? composition.shapeMoveVector : Vec2.ORIGIN;
	return shapeMoveVector;
};

const renderContinueFrom = (
	ctx: Ctx,
	opts: RenderGuidesContext,
	pathCtx: RenderPathContext,
	continueFrom: ShapeContinueFrom,
) => {
	const { shapeState, viewport, mousePosition } = opts;
	const { toViewport } = pathCtx;
	const { direction, pathId } = continueFrom;

	const path = shapeState.paths[pathId];
	const item = path.items[direction === "left" ? 0 : path.items.length - 1];
	const nodeId = item.nodeId;
	const part = direction === "left" ? item.left : item.right;

	const node = shapeState.nodes[nodeId];
	const p0 = toViewport(node.position);
	const p3 = mousePosition!.sub(Vec2.new(viewport.left, viewport.top));

	ctx.beginPath();

	if (!part || !part.controlPointId) {
		traceLine(ctx, [p0, p3], { move: true });
	} else {
		const cp = shapeState.controlPoints[part.controlPointId]!;
		const p1 = toViewport(node.position.add(cp.position));
		const bezier = quadraticToCubicBezier(p0, p1, null, p3);
		traceCubicBezier(ctx, bezier, { move: true });
	}

	ctx.strokeStyle = cssVariables.primary500;
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.closePath();

	ctx.beginPath();
	traceCircle(ctx, p3, 3.5);
	ctx.lineWidth = 2.5;
	ctx.fillStyle = "white";
	ctx.strokeStyle = cssVariables.primary600;
	ctx.stroke();
	ctx.fill();
	ctx.closePath();
};

const renderContinueClosePath = (
	ctx: Ctx,
	pathId: string,
	shapeState: ShapeState,
	toViewport: (vec: Vec2) => Vec2,
) => {
	const path = shapeState.paths[pathId];

	const item0 = path.items[0];
	const item1 = path.items[path.items.length - 1];

	const n0Id = item1.nodeId;
	const n1Id = item0.nodeId;
	const cp0Id = item1.right?.controlPointId;
	const cp1Id = item0.left?.controlPointId;

	const p0 = shapeState.nodes[n0Id].position;
	const p3 = shapeState.nodes[n1Id].position;

	const p1 = cp0Id ? p0.add(shapeState.controlPoints[cp0Id]!.position) : null;
	const p2 = cp1Id ? p3.add(shapeState.controlPoints[cp1Id]!.position) : null;

	let curve: Curve;

	if (p1 && p2) {
		curve = [p0, p1, p2, p3];
	} else if (p1 || p2) {
		curve = quadraticToCubicBezier(p0, p1, p2, p3);
	} else {
		curve = [p0, p3];
	}

	for (let i = 0; i < curve.length; i += 1) {
		curve[i] = toViewport(curve[i]);
	}

	ctx.beginPath();
	traceCurve(ctx, curve);
	ctx.strokeStyle = cssVariables.primary500;
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.closePath();
};

const renderPointOnEdge = (ctx: Ctx, point: Vec2) => {
	ctx.beginPath();
	traceCircle(ctx, point, 3.5);
	ctx.lineWidth = 2.5;
	ctx.fillStyle = "white";
	ctx.strokeStyle = cssVariables.primary600;
	ctx.stroke();
	ctx.fill();
};

const renderPathEdges = (
	ctx: Ctx,
	opts: RenderGuidesContext,
	pathCtx: RenderPathContext,
	pathId: string,
) => {
	const { shapeState, shapeSelectionState } = opts;
	const { toViewport } = pathCtx;

	const path = shapeState.paths[pathId];
	const shape = shapeState.shapes[path.shapeId];
	const shapeSelection = getShapeSelectionFromState(shape.id, shapeSelectionState);

	const shapeMoveVector = getShapeMoveVector(opts, pathCtx, pathId);

	for (let i = 0; i < path.items.length; i += 1) {
		const { nodeId, left, right, reflectControlPoints } = path.items[i];

		const parts = [left, right];

		for (let i = 0; i < 2; i += 1) {
			const part0 = parts[i];
			if (!part0) {
				continue;
			}

			const cp = shapeState.controlPoints[part0.controlPointId];
			if (!cp) {
				continue;
			}

			const part1 = parts[(i + 1) % 2];
			const otherCpId = part1?.controlPointId;

			const node = shapeState.nodes[nodeId];
			const nodeSelected = shapeSelection.nodes[nodeId];
			const cpSelected = shapeSelection.controlPoints[part0.controlPointId];
			const otherCpSelected = !!(otherCpId && shapeSelection.controlPoints[otherCpId]);
			const reflect = reflectControlPoints;

			let p0: Vec2;
			let p1: Vec2;

			if (
				reflect &&
				!nodeSelected &&
				!cpSelected &&
				otherCpSelected &&
				(shape.moveVector.x !== 0 || shape.moveVector.y !== 0)
			) {
				const otherCp = shapeState.controlPoints[otherCpId!]!;
				const otherCpPos = otherCp.position.add(shape.moveVector);

				p0 = node.position.add(shapeMoveVector);
				p1 = p0.add(reflectVectorAngle(otherCpPos, cp.position));
			} else {
				p0 = node.position.add(shapeMoveVector);
				if (shapeSelection.nodes[node.id]) {
					p0 = p0.add(shape.moveVector);
				}

				p1 = p0.add(cp.position);
				if (shapeSelection.controlPoints[cp.id] && !shapeSelection.nodes[node.id]) {
					p1 = p1.add(shape.moveVector);
				}
			}

			// Render handle line
			ctx.beginPath();
			traceLine(ctx, [toViewport(p0), toViewport(p1)], { move: true });
			ctx.lineWidth = 1;
			ctx.strokeStyle = cssVariables.light300;
			ctx.stroke();
			ctx.closePath();

			// Render handle diamond
			renderDiamond(
				ctx,
				toViewport(p1),
				shapeSelection.controlPoints[cp.id]
					? {
							fillColor: cssVariables.primary600,
							strokeColor: "white",
							strokeWidth: 1,
							width: 7,
							height: 7,
					  }
					: {
							fillColor: "white",
							strokeColor: cssVariables.primary600,
							strokeWidth: 1,
							width: 7,
							height: 7,
					  },
			);
		}
	}
};

const renderPathNodes = (
	ctx: Ctx,
	opts: RenderGuidesContext,
	pathCtx: RenderPathContext,
	pathId: string,
) => {
	const { shapeState, shapeSelectionState } = opts;
	const { toViewport, directlySelectedPaths } = pathCtx;

	const path = shapeState.paths[pathId];
	const shape = shapeState.shapes[path.shapeId];
	const shapeSelection = getShapeSelectionFromState(shape.id, shapeSelectionState);
	const shapeMoveVector = getShapeMoveVector(opts, pathCtx, pathId);
	const isPathDirectlySelected = directlySelectedPaths.has(path.id);

	for (const nodeId of shape.nodes) {
		const node = shapeState.nodes[nodeId];
		let position = node.position.add(shapeMoveVector);

		if (shapeSelection.nodes[node.id]) {
			position = position.add(shape.moveVector);
		}

		const selected = shapeSelection.nodes[nodeId];

		ctx.beginPath();
		if (selected) {
			if (isPathDirectlySelected) {
				traceCircle(ctx, toViewport(position), 4.5);
				ctx.lineWidth = 2.5;
				ctx.fillStyle = cssVariables.primary600;
				ctx.strokeStyle = "white";
				ctx.stroke();
				ctx.fill();
			} else {
				traceCircle(ctx, toViewport(position), 5);
				ctx.lineWidth = 1.5;
				ctx.strokeStyle = "white";
				ctx.stroke();

				traceCircle(ctx, toViewport(position), 3);
				ctx.fillStyle = cssVariables.primary600;
				ctx.fill("evenodd");
			}
		} else {
			if (isPathDirectlySelected) {
				traceCircle(ctx, toViewport(position), 3.5);
				ctx.lineWidth = 2.5;
				ctx.fillStyle = "white";
				ctx.strokeStyle = cssVariables.primary600;
				ctx.stroke();
				ctx.fill();
			} else {
				traceCircle(ctx, toViewport(position), 4.5);
				traceCircle(ctx, toViewport(position), 2.5);
				ctx.fillStyle = cssVariables.primary600;
				ctx.fill("evenodd");
			}
		}
		ctx.closePath();
	}
};

const getTargetObject = (opts: RenderGuidesContext, pathCtx: RenderPathContext, pathId: string) => {
	const { mousePosition, viewport, shapeState, shapeSelectionState } = opts;
	const { toViewport } = pathCtx;

	if (opts.tool !== Tool.pen || !mousePosition) {
		return null;
	}

	const viewportMousePosition = mousePosition.sub(Vec2.new(viewport.left, viewport.top));
	return getPathTargetObject(
		pathId,
		viewportMousePosition,
		toViewport,
		shapeState,
		shapeSelectionState,
	);
};

const renderTargetObject = (
	opts: RenderGuidesContext,
	ctx: Ctx,
	pathCtx: RenderPathContext,
	pathId: string,
	targetObject: ReturnType<typeof getPathTargetObject>,
) => {
	const { shapeState } = opts;
	const { toViewport } = pathCtx;

	switch (targetObject.type) {
		case "node": {
			if (pathCtx.closePathNodeId === targetObject.id) {
				renderContinueClosePath(ctx, pathId, shapeState, toViewport);
			}
			break;
		}
		case "point_on_edge": {
			renderPointOnEdge(ctx, targetObject.point);
			break;
		}
	}
};

interface RenderPathContext {
	selectedPathIds: Set<string>;
	directlySelectedPaths: Set<string>;
	hasTargetObject: boolean;
	hasHoveredShape: boolean;
	toViewport: (vec: Vec2) => Vec2;
	closePathNodeId: string | null;
	pathIdToShapeGroupId: {
		[pathId: string]: string;
	};
}

const renderPathBoundingRect = (ctx: Ctx, boundingRect: Rect, type: "selected" | "hovered") => {
	ctx.beginPath();
	traceRect(ctx, boundingRect);
	ctx.lineWidth = 1;
	ctx.strokeStyle = cssVariables.primary700;
	ctx.setLineDash(type === "selected" ? [] : [4, 4]);
	ctx.stroke();
	ctx.closePath();
	ctx.setLineDash([]);
};

const renderPath = (
	opts: RenderGuidesContext,
	ctx: Ctx,
	pathCtx: RenderPathContext,
	pathId: string,
) => {
	const { shapeState, shapeSelectionState, viewport, mousePosition } = opts;
	const { selectedPathIds, directlySelectedPaths, toViewport } = pathCtx;

	const isPathDirectlySelected = directlySelectedPaths.has(pathId);

	const shapeMoveVector = getShapeMoveVector(opts, pathCtx, pathId);
	const curves = pathIdToCurves(
		pathId,
		shapeState,
		shapeSelectionState,
		shapeMoveVector,
		toViewport,
	);
	if (curves) {
		renderCurves(ctx, curves);
	}

	if (!pathCtx.hasTargetObject && selectedPathIds.has(pathId)) {
		const targetObject = getTargetObject(opts, pathCtx, pathId);

		if (targetObject && targetObject.type) {
			pathCtx.hasTargetObject = true;
			renderTargetObject(opts, ctx, pathCtx, pathId, targetObject);
		}
	}

	let boundingRect: Rect | undefined;

	const selected = selectedPathIds.has(pathId);
	const noDirectlySelectedPaths = !directlySelectedPaths.size;

	if (noDirectlySelectedPaths && curves && !pathCtx.hasHoveredShape && mousePosition) {
		const viewportMousePosition = mousePosition.sub(Vec2.new(viewport.left, viewport.top));
		const rect = pathControlPointsBoundingRect(curves);

		if (isVecInRect(viewportMousePosition, rect)) {
			boundingRect = pathBoundingRect(curves);

			if (isVecInRect(viewportMousePosition, boundingRect)) {
				pathCtx.hasHoveredShape = true;
				const canClickToSelect = opts.keyDown.Command || selectedPathIds.size;
				if (
					opts.nSelectedShapeLayers === 1 &&
					!selected &&
					opts.tool === Tool.move &&
					canClickToSelect
				) {
					renderPathBoundingRect(ctx, boundingRect, "hovered");
				}
			}
		}
	}

	if (!selected) {
		return;
	}

	if (isPathDirectlySelected) {
		renderPathEdges(ctx, opts, pathCtx, pathId);
	} else if (curves) {
		if (!boundingRect) {
			boundingRect = pathBoundingRect(curves);
		}
		renderPathBoundingRect(ctx, boundingRect, "selected");
	}

	renderPathNodes(ctx, opts, pathCtx, pathId);
};

export function renderShapeLayerGuides(
	opts: RenderGuidesContext,
	ctx: Ctx,
	map: CompositionRenderValues,
	layer: CompositionLayer,
) {
	const { compositionSelection, scale, pan } = opts;

	const index = 0; // Guides are always based on the layer at i=0
	const isSelected = compositionSelection.layers[layer.id];

	if (!isSelected) {
		return;
	}

	const pathIds = getPathIds(opts, layer.id);
	const selectedPathIds = getSelectedPathIds(opts, layer.id);

	const directlySelectedPaths = getDirectlySelectedPaths(opts, layer.id);
	const { continueFrom, closePathNodeId } = getContinue(opts, layer.id);

	const transform = map.transforms[layer.id].transform[index];
	const mat2 = transformMat2(transform);
	const toViewport = (vec: Vec2): Vec2 => {
		return mat2
			.multiplyVec2(vec.sub(transform.anchor))
			.add(transform.translate)
			.scale(scale)
			.add(pan);
	};

	const pathIdToShapeGroupId = getPathIdToShapeGroupId(layer.id, opts.compositionState);

	const pathCtx: RenderPathContext = {
		closePathNodeId,
		selectedPathIds: new Set(selectedPathIds),
		directlySelectedPaths,
		hasTargetObject: false,
		hasHoveredShape: false,
		pathIdToShapeGroupId,
		toViewport,
	};

	for (const pathId of pathIds) {
		renderPath(opts, ctx, pathCtx, pathId);
	}

	if (!pathCtx.hasTargetObject && continueFrom && opts.tool === Tool.pen) {
		renderContinueFrom(ctx, opts, pathCtx, continueFrom);
	}
}
