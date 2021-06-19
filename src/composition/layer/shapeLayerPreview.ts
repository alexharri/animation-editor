import * as PIXI from "pixi.js";
import { Layer } from "~/composition/compositionTypes";
import { Tool } from "~/constants";
import { cssVariables } from "~/cssVariables";
import {
	getPathTargetObject,
	getShapeContinuePathFrom,
	getShapeLayerPathIds,
	getShapeLayerSelectedPathIds,
	getShapePathClosePathNodeId,
} from "~/shape/shapeUtils";
import { hexToRGB, rgbToBinary } from "~/util/color/convertColor";
import { completeCubicBezier, quadraticToCubicBezier } from "~/util/math";

const pathNotSelectedNodeGraphic = new PIXI.Graphics();

const unselectedNodeGraphic = new PIXI.Graphics();
const selectedNodeGraphic = new PIXI.Graphics();

const unselectedCpGraphic = new PIXI.Graphics();
const selectedCpGraphic = new PIXI.Graphics();

const primaryColor = rgbToBinary(hexToRGB(cssVariables.primary500));
const white = rgbToBinary([255, 255, 255]);

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

export const shapeLayerPreview = (
	actionState: ActionState,
	_areaId: string,
	addGraphic: (graphic: PIXI.Container, zIndex: number) => void,
	layer: Layer,
	mousePosition: Vec2,
	normalToViewport: TransformVec2,
) => {
	const { compositionState, compositionSelectionState, shapeState, shapeSelectionState, tool } =
		actionState;

	if (tool.selected !== Tool.pen) {
		return;
	}

	// Check if a single node is selected and the hit node is the close path node.
	const pathIds = getShapeLayerPathIds(layer.id, compositionState);
	const continueFrom = getShapeContinuePathFrom(pathIds, shapeState, shapeSelectionState);
	const closePathNodeId = continueFrom && getShapePathClosePathNodeId(continueFrom, shapeState);

	const selectedPathIds = getShapeLayerSelectedPathIds(
		layer.id,
		compositionState,
		compositionSelectionState,
	);

	for (const pathId of selectedPathIds) {
		const target = getPathTargetObject(
			pathId,
			normalToViewport(mousePosition),
			normalToViewport,
			shapeState,
		);
		switch (target.type) {
			case "point_on_edge": {
				const graphic = new PIXI.Graphics(unselectedNodeGraphic.geometry);
				graphic.position.set(target.point.x, target.point.y);
				addGraphic(graphic, 2500);
				return;
			}
			case "node": {
				if (target.id !== closePathNodeId) {
					break;
				}

				const { pathId } = continueFrom!;
				const path = shapeState.paths[pathId];

				const item0 = path.items[0];
				const item1 = path.items[path.items.length - 1];

				const n0 = shapeState.nodes[item0.nodeId];
				const n1 = shapeState.nodes[item1.nodeId];

				const cp0Id = item0.left?.controlPointId;
				const cp1Id = item1.right?.controlPointId;

				const cp0 = cp0Id && shapeState.controlPoints[cp0Id];
				const cp1 = cp1Id && shapeState.controlPoints[cp1Id];

				if (cp0 && cp1) {
					const [p0, p1, p2, p3] = [
						n0.position,
						n0.position.add(cp0.position),
						n1.position.add(cp1.position),
						n1.position,
					].map(normalToViewport);

					const lineGraphic = new PIXI.Graphics();
					addGraphic(lineGraphic, 2000);
					lineGraphic.lineStyle(1, primaryColor);
					lineGraphic.moveTo(p0.x, p0.y);
					lineGraphic.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
				} else if (cp0 || cp1) {
					const [p0, p1, p2, p3] = completeCubicBezier(
						n0.position,
						(cp0 && n0.position.add(cp0.position)) || null,
						(cp1 && n1.position.add(cp1.position)) || null,
						n1.position,
					).map(normalToViewport);

					const lineGraphic = new PIXI.Graphics();
					addGraphic(lineGraphic, 2000);
					lineGraphic.lineStyle(1, primaryColor);
					lineGraphic.moveTo(p0.x, p0.y);
					lineGraphic.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
				} else {
					const p0 = normalToViewport(n0.position);
					const p3 = normalToViewport(n1.position);

					const lineGraphic = new PIXI.Graphics();
					addGraphic(lineGraphic, 2000);
					lineGraphic.lineStyle(1, primaryColor);
					lineGraphic.moveTo(p0.x, p0.y);
					lineGraphic.lineTo(p3.x, p3.y);
				}

				return;
			}
			case "control_point": {
				return;
			}
		}
	}

	if (continueFrom) {
		const { pathId, direction } = continueFrom;
		const path = shapeState.paths[pathId];
		const right = direction === "right";
		const item = path.items[right ? path.items.length - 1 : 0];
		const cpId = (right ? item.right : item.left)?.controlPointId;

		const node = shapeState.nodes[item.nodeId];
		const v_nodePosition = normalToViewport(node.position);
		const v_mousePos = normalToViewport(mousePosition);

		const lineGraphic = new PIXI.Graphics();
		addGraphic(lineGraphic, 2000);
		lineGraphic.lineStyle(1, primaryColor);
		lineGraphic.moveTo(v_nodePosition.x, v_nodePosition.y);

		if (cpId) {
			const cp = shapeState.controlPoints[cpId]!;
			const [_, p1, p2, p3] = quadraticToCubicBezier(
				v_nodePosition,
				normalToViewport(node.position.add(cp.position)),
				v_mousePos,
			);

			lineGraphic.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
		} else {
			lineGraphic.lineTo(v_mousePos.x, v_mousePos.y);
		}

		const nodeGraphic = new PIXI.Graphics(unselectedNodeGraphic.geometry);
		nodeGraphic.position.set(v_mousePos.x, v_mousePos.y);
		addGraphic(nodeGraphic, 2500);

		// const closePathNodeId = getShapePathClosePathNodeId(continueFrom, shapeState);
		// if (nodeId === closePathNodeId) {
		//     penToolHandlers.completePath(ctx, continueFrom);
		//     return;
		// }
	}
};
