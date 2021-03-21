import * as PIXI from "pixi.js";
import { Layer } from "~/composition/compositionTypes";
import { cssVariables } from "~/cssVariables";
import {
	getShapeLayerDirectlySelectedPaths,
	getShapeLayerSelectedPathIds,
	getShapeSelectionFromState,
	pathIdToCurves,
} from "~/shape/shapeUtils";
import { LayerType } from "~/types";
import { hexToRGB, rgbToBinary } from "~/util/color/convertColor";

const pathNotSelectedNodeGraphic = new PIXI.Graphics();

const unselectedNodeGraphic = new PIXI.Graphics();
const selectedNodeGraphic = new PIXI.Graphics();

const unselectedCpGraphic = new PIXI.Graphics();
const selectedCpGraphic = new PIXI.Graphics();

const primaryColor = rgbToBinary(hexToRGB(cssVariables.primary500));
const white = rgbToBinary([255, 255, 255]);
const gray = rgbToBinary([120, 120, 120]);

{
	pathNotSelectedNodeGraphic.beginFill(primaryColor);
	pathNotSelectedNodeGraphic.drawCircle(0, 0, 5);
	pathNotSelectedNodeGraphic.endFill();
}

{
	unselectedNodeGraphic.lineStyle(1.5, primaryColor);
	unselectedNodeGraphic.beginFill(white);
	unselectedNodeGraphic.drawCircle(0, 0, 5);
	unselectedNodeGraphic.endFill();
}

{
	selectedNodeGraphic.lineStyle(1.5, white);
	selectedNodeGraphic.beginFill(primaryColor);
	selectedNodeGraphic.drawCircle(0, 0, 5);
	selectedNodeGraphic.endFill();
}

const traceCp = (graphic: PIXI.Graphics) => {
	const M = 4;
	graphic.moveTo(0, -M);
	graphic.lineTo(M, 0);
	graphic.lineTo(0, M);
	graphic.lineTo(-M, 0);
	graphic.closePath();
};

{
	unselectedCpGraphic.lineStyle(1.5, primaryColor);
	unselectedCpGraphic.beginFill(white);
	traceCp(unselectedCpGraphic);
	unselectedCpGraphic.endFill();
}

{
	selectedCpGraphic.lineStyle(1.5, white);
	selectedCpGraphic.beginFill(primaryColor);
	traceCp(selectedCpGraphic);
	selectedCpGraphic.endFill();
}

type TransformVec2 = (vec2: Vec2) => Vec2;

interface Ctx {
	actionState: ActionState;
	layer: Layer;
	areaId: string;
	transform: TransformVec2;
	addGraphic: (graphic: PIXI.Container, zIndex: number) => void;
}

const renderCurves = (ctx: Ctx, curves: Curve[]) => {
	if (curves.length === 0) {
		return;
	}

	const graphic = new PIXI.Graphics();
	const start = curves[0][0];

	graphic.lineStyle(1, gray);
	graphic.moveTo(start.x, start.y);

	for (const curve of curves) {
		if (curve.length === 2) {
			graphic.lineTo(curve[1].x, curve[1].y);
			continue;
		}

		const [, p1, p2, p3] = curve;
		graphic.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
	}
	graphic.moveTo(0, 0);

	ctx.addGraphic(graphic, 5);
};

const renderPath = (ctx: Ctx, pathId: string, directlySelected: boolean) => {
	const { actionState } = ctx;
	const { shapeState, shapeSelectionState } = actionState;

	const curves = pathIdToCurves(pathId, shapeState, ctx.transform);
	if (curves) {
		renderCurves(ctx, curves);
	}

	const path = shapeState.paths[pathId];

	for (const item of path.items) {
		const node = shapeState.nodes[item.nodeId];
		const selection = getShapeSelectionFromState(path.shapeId, shapeSelectionState);

		const nodePos = ctx.transform(node.position);
		{
			// Add node
			const container = new PIXI.Container();
			ctx.addGraphic(container, 15);

			{
				// Visible graphic
				const toUse = selection.nodes[node.id]
					? selectedNodeGraphic
					: unselectedNodeGraphic;
				const graphic = new PIXI.Graphics(toUse.geometry);
				graphic.position.set(nodePos.x, nodePos.y);
				container.addChild(graphic);
			}
			// {
			// 	// Interaction area
			// 	const graphic = new PIXI.Graphics();
			// 	graphic.beginFill(rgbToBinary([0, 255, 0]));
			// 	graphic.drawCircle(nodePos.x, nodePos.y, 7);
			// 	graphic.endFill();
			// 	graphic.alpha = 0;
			// 	container.addChild(graphic);
			// }
		}

		if (!directlySelected) {
			continue;
		}

		for (const part of [item.left, item.right]) {
			if (!part || !part.controlPointId) {
				continue;
			}

			const { controlPointId } = part;
			const cp = shapeState.controlPoints[controlPointId]!;
			const pos = ctx.transform(node.position.add(cp.position));

			{
				// Point
				const container = new PIXI.Container();
				ctx.addGraphic(container, 10);

				{
					// Visible graphic
					const toUse = selection.controlPoints[cp.id]
						? selectedCpGraphic
						: unselectedCpGraphic;
					const graphic = new PIXI.Graphics(toUse.geometry);
					graphic.position.set(pos.x, pos.y);
					container.addChild(graphic);
				}
				// {
				// 	// Interaction area
				// 	const graphic = new PIXI.Graphics();
				// 	graphic.beginFill(zrgbToBinary([0, 255, 0]));
				// 	graphic.drawCircle(pos.x, pos.y, 5);
				// 	graphic.endFill();
				// 	graphic.alpha = 0;
				// 	container.addChild(graphic);
				// }
			}

			{
				// Line
				const graphic = new PIXI.Graphics();
				graphic.lineStyle(1, gray);
				graphic.moveTo(nodePos.x, nodePos.y);
				graphic.lineTo(pos.x, pos.y);
				graphic.moveTo(0, 0);
				ctx.addGraphic(graphic, 7);
			}
		}
	}
};

export const shapeLayerInteractions = (
	actionState: ActionState,
	areaId: string,
	addGraphic: (graphic: PIXI.Container, zIndex: number) => void,
	layer: Layer,
	transform: TransformVec2,
) => {
	const { compositionState, compositionSelectionState } = actionState;

	if (layer.type !== LayerType.Shape) {
		return;
	}

	// const pathIds = getShapeLayerPathIds(layer.id, compositionState);
	const selectedPathIds = getShapeLayerSelectedPathIds(
		layer.id,
		compositionState,
		compositionSelectionState,
	);

	const directlySelectedPaths = getShapeLayerDirectlySelectedPaths(
		layer.id,
		compositionState,
		compositionSelectionState,
	);

	const ctx: Ctx = {
		actionState,
		areaId,
		addGraphic,
		layer,
		transform,
	};

	for (const pathId of selectedPathIds) {
		const directlySelected = directlySelectedPaths.has(pathId);
		renderPath(ctx, pathId, directlySelected);
	}
};
