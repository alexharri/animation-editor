import { Point2D } from "kld-affine";
import { CubicBezier2D } from "kld-contours";
import { Tool } from "~/constants";
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
import { LayerType } from "~/types";
import { rgbToBinary } from "~/util/color/convertColor";
import { completeCubicBezier, isVecInRect, reflectVectorAngle } from "~/util/math";
import { pathBoundingRect, pathControlPointsBoundingRect } from "~/util/math/boundingRect";

export interface RenderGuidesContext {
	actionState: ActionState;
	layerId: string;
	scale: number;
	// hasHovered: boolean;
	// tool: Tool;
	// mousePosition?: Vec2;
	// isPerformingAction: boolean;
	// keyDown: {
	// 	Shift: boolean;
	// 	Command: boolean;
	// };
	// nSelectedShapeLayers: number;
}

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

const traceStroke = (graphic: PIXI.Graphics, curves: Curve[]) => {
	const firstCurve = curves[0];
	if (firstCurve) {
		const { x, y } = firstCurve[0];
		graphic.moveTo(x, y);
	}
	for (const curve of curves) {
		if (curve.length === 2) {
			const { x, y } = curve[1];
			graphic.lineTo(x, y);
			continue;
		}

		const points = new CubicBezier2D(...curve.map((p) => new Point2D(p.x, p.y))).toPolygon2D()
			.points as Array<{ x: number; y: number }>;

		for (const { x, y } of points) {
			graphic.lineTo(x, y);
		}
	}
};

const renderCurves = (graphic: PIXI.Graphics, curves: Curve[]) => {
	graphic.lineStyle(1, rgbToBinary([255, 255, 255]));
	traceStroke(graphic, curves);
	graphic.moveTo(0, 0);
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
	graphic: PIXI.Graphics,
	opts: RenderGuidesContext,
	pathCtx: RenderPathContext,
	continueFrom: ShapeContinueFrom,
) => {
	// const { shapeState, viewport, mousePosition } = opts;
	// const { toViewport } = pathCtx;
	// const { direction, pathId } = continueFrom;
	// const path = shapeState.paths[pathId];
	// const item = path.items[direction === "left" ? 0 : path.items.length - 1];
	// const nodeId = item.nodeId;
	// const part = direction === "left" ? item.left : item.right;
	// const node = shapeState.nodes[nodeId];
	// const p0 = toViewport(node.position);
	// const p3 = mousePosition!.sub(Vec2.new(viewport.left, viewport.top));
	// ctx.beginPath();
	// if (!part || !part.controlPointId) {
	// 	traceLine(ctx, [p0, p3], { move: true });
	// } else {
	// 	const cp = shapeState.controlPoints[part.controlPointId]!;
	// 	const p1 = toViewport(node.position.add(cp.position));
	// 	const bezier = completeCubicBezier(p0, p1, null, p3);
	// 	traceCubicBezier(ctx, bezier, { move: true });
	// }
	// ctx.strokeStyle = cssVariables.primary500;
	// ctx.lineWidth = 1;
	// ctx.stroke();
	// ctx.closePath();
	// ctx.beginPath();
	// traceCircle(ctx, p3, 3.5);
	// ctx.lineWidth = 2.5;
	// ctx.fillStyle = "white";
	// ctx.strokeStyle = cssVariables.primary600;
	// ctx.stroke();
	// ctx.fill();
	// ctx.closePath();
};

const renderContinueClosePath = (
	graphic: PIXI.Graphics,
	pathId: string,
	shapeState: ShapeState,
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
		curve = completeCubicBezier(p0, p1, p2, p3);
	} else {
		curve = [p0, p3];
	}

	graphic.lineStyle(1, rgbToBinary([0, 0, 255]));
	traceStroke(graphic, [curve]);
	graphic.moveTo(0, 0);
};

const renderPointOnEdge = (graphic: PIXI.Graphics, point: Vec2) => {
	// ctx.beginPath();
	// traceCircle(ctx, point, 3.5);
	// ctx.lineWidth = 2.5;
	// ctx.fillStyle = "white";
	// ctx.strokeStyle = cssVariables.primary600;
	// ctx.stroke();
	// ctx.fill();
	graphic.beginFill(rgbToBinary([255, 255, 255]));
	graphic.drawCircle(point.x, point.y, 3.5);
	graphic.endFill();
};

const renderPathEdges = (
	graphic: PIXI.Graphics,
	opts: RenderGuidesContext,
	pathCtx: RenderPathContext,
	pathId: string,
) => {
	const { shapeState, shapeSelectionState } = opts;

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
			graphic.lineStyle(1, rgbToBinary([255, 255, 255]));
			graphic.moveTo(p0.x, p0.y);
			graphic.lineTo(p1.x, p1.y);
			// ctx.beginPath();
			// traceLine(ctx, [toViewport(p0), toViewport(p1)], { move: true });
			// ctx.lineWidth = 1;
			// ctx.strokeStyle = cssVariables.light300;
			// ctx.stroke();
			// ctx.closePath();

			// Render handle diamond
			// renderDiamond(
			// 	ctx,
			// 	toViewport(p1),
			// 	shapeSelection.controlPoints[cp.id]
			// 		? {
			// 				fillColor: cssVariables.primary600,
			// 				strokeColor: "white",
			// 				strokeWidth: 1,
			// 				width: 7,
			// 				height: 7,
			// 		  }
			// 		: {
			// 				fillColor: "white",
			// 				strokeColor: cssVariables.primary600,
			// 				strokeWidth: 1,
			// 				width: 7,
			// 				height: 7,
			// 		  },
			// );
			graphic.beginFill(rgbToBinary([255, 255, 255]));
			graphic.drawCircle(p1.x, p1.y, 2);
			graphic.endFill();
		}
	}
};

const renderPathNodes = (
	graphic: PIXI.Graphics,
	opts: RenderGuidesContext,
	pathCtx: RenderPathContext,
	pathId: string,
) => {
	const { shapeState, shapeSelectionState } = opts;
	const { directlySelectedPaths } = pathCtx;

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

		graphic.beginFill(rgbToBinary([255, 255, 255]));
		graphic.drawCircle(position.x, position.y, 4.5);
		graphic.endFill();
		// ctx.beginPath();
		// if (selected) {
		// 	if (isPathDirectlySelected) {
		// 		traceCircle(ctx, toViewport(position), 4.5);
		// 		ctx.lineWidth = 2.5;
		// 		ctx.fillStyle = cssVariables.primary600;
		// 		ctx.strokeStyle = "white";
		// 		ctx.stroke();
		// 		ctx.fill();
		// 	} else {
		// 		traceCircle(ctx, toViewport(position), 5);
		// 		ctx.lineWidth = 1.5;
		// 		ctx.strokeStyle = "white";
		// 		ctx.stroke();

		// 		traceCircle(ctx, toViewport(position), 3);
		// 		ctx.fillStyle = cssVariables.primary600;
		// 		ctx.fill("evenodd");
		// 	}
		// } else {
		// 	if (isPathDirectlySelected) {
		// 		traceCircle(ctx, toViewport(position), 3.5);
		// 		ctx.lineWidth = 2.5;
		// 		ctx.fillStyle = "white";
		// 		ctx.strokeStyle = cssVariables.primary600;
		// 		ctx.stroke();
		// 		ctx.fill();
		// 	} else {
		// 		traceCircle(ctx, toViewport(position), 4.5);
		// 		traceCircle(ctx, toViewport(position), 2.5);
		// 		ctx.fillStyle = cssVariables.primary600;
		// 		ctx.fill("evenodd");
		// 	}
		// }
		// ctx.closePath();
	}
};

const getTargetObject = (opts: RenderGuidesContext, pathCtx: RenderPathContext, pathId: string) => {
	const { mousePosition, viewport, shapeState, shapeSelectionState } = opts;

	if (opts.tool !== Tool.pen || !mousePosition) {
		return null;
	}

	const viewportMousePosition = mousePosition.sub(Vec2.new(viewport.left, viewport.top));
	return getPathTargetObject(
		pathId,
		viewportMousePosition,
		(vec2) => vec2,
		shapeState,
		shapeSelectionState,
	);
};

const renderTargetObject = (
	opts: RenderGuidesContext,
	graphic: PIXI.Graphics,
	pathCtx: RenderPathContext,
	pathId: string,
	targetObject: ReturnType<typeof getPathTargetObject>,
) => {
	const { shapeState } = opts;

	switch (targetObject.type) {
		case "node": {
			if (pathCtx.closePathNodeId === targetObject.id) {
				renderContinueClosePath(graphic, pathId, shapeState);
			}
			break;
		}
		case "point_on_edge": {
			renderPointOnEdge(graphic, targetObject.point);
			break;
		}
	}
};

interface RenderPathContext {
	selectedPathIds: Set<string>;
	directlySelectedPaths: Set<string>;
	hasTargetObject: boolean;
	hasHoveredShape: boolean;
	closePathNodeId: string | null;
	pathIdToShapeGroupId: {
		[pathId: string]: string;
	};
}

const renderPathBoundingRect = (
	graphic: PIXI.Graphics,
	boundingRect: Rect,
	type: "selected" | "hovered",
) => {
	const { left, top, width, height } = boundingRect;
	graphic.lineStyle(1, rgbToBinary([255, 0, 0]));
	graphic.drawRect(left, top, width, height);
	graphic.moveTo(0, 0);
	// ctx.beginPath();
	// traceRect(ctx, boundingRect);
	// ctx.lineWidth = 1;
	// ctx.strokeStyle = cssVariables.primary700;
	// ctx.setLineDash(type === "selected" ? [] : [4, 4]);
	// ctx.stroke();
	// ctx.closePath();
	// ctx.setLineDash([]);
};

const renderPath = (
	opts: RenderGuidesContext,
	graphic: PIXI.Graphics,
	pathCtx: RenderPathContext,
	pathId: string,
) => {
	const { shapeState, shapeSelectionState, viewport, mousePosition } = opts;
	const { selectedPathIds, directlySelectedPaths } = pathCtx;

	const isPathDirectlySelected = directlySelectedPaths.has(pathId);

	const shapeMoveVector = getShapeMoveVector(opts, pathCtx, pathId);
	const curves = pathIdToCurves(pathId, shapeState, shapeSelectionState, shapeMoveVector);
	if (curves) {
		renderCurves(graphic, curves);
	}

	if (!pathCtx.hasTargetObject && selectedPathIds.has(pathId)) {
		const targetObject = getTargetObject(opts, pathCtx, pathId);

		if (targetObject && targetObject.type) {
			pathCtx.hasTargetObject = true;
			renderTargetObject(opts, graphic, pathCtx, pathId, targetObject);
		}
	}

	let boundingRect: Rect | null = null;

	const selected = selectedPathIds.has(pathId);
	const noDirectlySelectedPaths = !directlySelectedPaths.size;

	if (noDirectlySelectedPaths && curves && !pathCtx.hasHoveredShape && mousePosition) {
		const viewportMousePosition = mousePosition.sub(Vec2.new(viewport.left, viewport.top));
		const rect = pathControlPointsBoundingRect(curves);

		if (isVecInRect(viewportMousePosition, rect)) {
			boundingRect = pathBoundingRect(curves);

			if (boundingRect && isVecInRect(viewportMousePosition, boundingRect)) {
				pathCtx.hasHoveredShape = true;
				const canClickToSelect = opts.keyDown.Command || selectedPathIds.size;
				if (
					opts.nSelectedShapeLayers === 1 &&
					!selected &&
					opts.tool === Tool.move &&
					canClickToSelect
				) {
					renderPathBoundingRect(graphic, boundingRect, "hovered");
				}
			}
		}
	}

	if (!selected) {
		return;
	}

	if (isPathDirectlySelected) {
		renderPathEdges(graphic, opts, pathCtx, pathId);
	} else if (curves) {
		if (!boundingRect) {
			boundingRect = pathBoundingRect(curves);
		}
		if (boundingRect) {
			renderPathBoundingRect(graphic, boundingRect, "selected");
		}
	}

	renderPathNodes(graphic, opts, pathCtx, pathId);
};

export function renderShapeLayerGuides(
	opts: RenderGuidesContext,
	graphic: PIXI.Graphics,
	layerId: string,
) {
	const pathIds = getPathIds(opts, layerId);
	const selectedPathIds = getSelectedPathIds(opts, layerId);

	const directlySelectedPaths = getDirectlySelectedPaths(opts, layerId);
	const { continueFrom, closePathNodeId } = getContinue(opts, layerId);

	const pathIdToShapeGroupId = getPathIdToShapeGroupId(layerId, opts.compositionState);

	const pathCtx: RenderPathContext = {
		closePathNodeId,
		selectedPathIds: new Set(selectedPathIds),
		directlySelectedPaths,
		hasTargetObject: false,
		hasHoveredShape: false,
		pathIdToShapeGroupId,
	};

	for (const pathId of pathIds) {
		renderPath(opts, graphic, pathCtx, pathId);
	}

	// if (!pathCtx.hasTargetObject && continueFrom && opts.tool === Tool.pen) {
	// 	renderContinueFrom(graphic, opts, pathCtx, continueFrom);
	// }
}
