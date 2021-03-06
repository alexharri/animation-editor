import * as PIXI from "pixi.js";
import { getAreaViewport } from "~/area/util/getAreaViewport";
import { Layer } from "~/composition/compositionTypes";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { AreaType, Tool } from "~/constants";
import { getPathIdToShapeGroupId, getShapeLayerPathIds, pathIdToCurves } from "~/shape/shapeUtils";
import { getActionState } from "~/state/stateUtils";
import { LayerType } from "~/types";
import { rgbToBinary } from "~/util/color/convertColor";
import { getMousePosition } from "~/util/mouse";
import { penToolHandlers } from "~/workspace/penTool/penTool";
import { constructPenToolContext } from "~/workspace/penTool/penToolContext";

type TransformVec2 = (vec2: Vec2) => Vec2;

interface Ctx {
	actionState: ActionState;
	layer: Layer;
	areaId: string;
	transform: TransformVec2;
	addGraphic: (graphic: PIXI.Container) => void;
}

const renderCurves = (ctx: Ctx, curves: Curve[]) => {
	if (curves.length === 0) {
		return;
	}

	const graphic = new PIXI.Graphics();
	const start = curves[0][0];

	graphic.lineStyle(1, rgbToBinary([0, 255, 0]));
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

	ctx.addGraphic(graphic);
};

const getShapeMoveVector = (ctx: Ctx, pathId: string) => {
	const { layer, actionState } = ctx;
	const { compositionState, compositionSelectionState } = actionState;
	const composition = compositionState.compositions[layer.compositionId];
	const compositionSelection = compSelectionFromState(
		layer.compositionId,
		compositionSelectionState,
	);
	const pathIdToShapeGroupId = getPathIdToShapeGroupId(layer.id, compositionState);
	const shapeGroupId = pathIdToShapeGroupId[pathId];
	const shapeSelected = compositionSelection.properties[shapeGroupId];
	const shapeMoveVector = shapeSelected ? composition.shapeMoveVector : Vec2.ORIGIN;
	return shapeMoveVector;
};

const renderPath = (ctx: Ctx, pathId: string) => {
	const { actionState } = ctx;
	const { shapeState, shapeSelectionState } = actionState;
	const shapeMoveVector = getShapeMoveVector(ctx, pathId);

	const curves = pathIdToCurves(
		pathId,
		shapeState,
		shapeSelectionState,
		shapeMoveVector,
		ctx.transform,
	);
	if (curves) {
		renderCurves(ctx, curves);
	}

	const path = shapeState.paths[pathId];

	for (const item of path.items) {
		const node = shapeState.nodes[item.nodeId];

		const nodePos = ctx.transform(node.position);
		{
			// Add node
			const container = new PIXI.Container();
			ctx.addGraphic(container);
			container.interactive = true;
			container.on("mousedown", () => {
				const mousePosition = getMousePosition();
				const viewport = getAreaViewport(ctx.areaId, AreaType.Workspace);
				penToolHandlers.nodeMouseDown(
					constructPenToolContext(mousePosition, ctx.layer.id, ctx.areaId, viewport),
					pathId,
					node.id,
					{ fromMoveTool: getActionState().tool.selected === Tool.move },
				);
			});

			{
				// Visible graphic
				const graphic = new PIXI.Graphics();
				graphic.beginFill(rgbToBinary([0, 255, 0]));
				graphic.drawCircle(nodePos.x, nodePos.y, 4);
				graphic.endFill();
				container.addChild(graphic);
			}
			{
				// Interaction area
				const graphic = new PIXI.Graphics();
				graphic.beginFill(rgbToBinary([0, 255, 0]));
				graphic.drawCircle(nodePos.x, nodePos.y, 7);
				graphic.endFill();
				graphic.alpha = 0;
				container.addChild(graphic);
			}
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
				ctx.addGraphic(container);
				container.interactive = true;
				container.on("mousedown", () => {
					console.log("cp mousedown");
					const mousePosition = getMousePosition();
					const viewport = getAreaViewport(ctx.areaId, AreaType.Workspace);
					penToolHandlers.controlPointMouseDown(
						constructPenToolContext(mousePosition, ctx.layer.id, ctx.areaId, viewport),
						cp.id,
					);
				});

				{
					// Visible graphic
					const graphic = new PIXI.Graphics();
					graphic.beginFill(rgbToBinary([0, 255, 0]));
					graphic.drawCircle(pos.x, pos.y, 2);
					graphic.endFill();
					container.addChild(graphic);
				}
				{
					// Interaction area
					const graphic = new PIXI.Graphics();
					graphic.beginFill(rgbToBinary([0, 255, 0]));
					graphic.drawCircle(pos.x, pos.y, 5);
					graphic.endFill();
					graphic.alpha = 0;
					container.addChild(graphic);
				}
			}

			{
				// Line
				const graphic = new PIXI.Graphics();
				graphic.lineStyle(1, rgbToBinary([0, 255, 0]));
				graphic.moveTo(nodePos.x, nodePos.y);
				graphic.lineTo(pos.x, pos.y);
				graphic.moveTo(0, 0);
				ctx.addGraphic(graphic);
			}
		}
	}
};

export const shapeLayerInteractions = (
	actionState: ActionState,
	areaId: string,
	addGraphic: (graphic: PIXI.Container) => void,
	layer: Layer,
	transform: TransformVec2,
) => {
	const { compositionState } = actionState;

	if (layer.type !== LayerType.Shape) {
		return;
	}

	const pathIds = getShapeLayerPathIds(layer.id, compositionState);

	const ctx: Ctx = {
		actionState,
		areaId,
		addGraphic,
		layer,
		transform,
	};

	for (const pathId of pathIds) {
		renderPath(ctx, pathId);
	}
};
