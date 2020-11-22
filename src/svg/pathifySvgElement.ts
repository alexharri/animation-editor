import { ElementNode } from "svg-parser";
import { compositionActions } from "~/composition/compositionReducer";
import { createLayer } from "~/composition/layer/createLayer";
import { DEFAULT_LAYER_TRANSFORM } from "~/constants";
import { shapeActions } from "~/shape/shapeReducer";
import { shapeLayerFromPoints } from "~/svg/shapeLayerFromPoints";
import { SvgContext } from "~/svg/svgContext";
import { svgPathElementLayerProps } from "~/svg/svgElementLayerProps";
import { getPathNodesBoundingBoxCenter } from "~/svg/svgUtils";
import { LayerType } from "~/types";
import { Mat2 } from "~/util/math/mat";

function fromRect(ctx: SvgContext, node: ElementNode, matrix: Mat2) {
	const width = ctx.attr.width(node)!;
	const height = ctx.attr.height(node)!;

	const p0 = Vec2.ORIGIN;
	const p1 = Vec2.new(width, 0);
	const p2 = Vec2.new(width, height);
	const p3 = Vec2.new(0, height);

	return shapeLayerFromPoints(
		ctx,
		[p0, p1, p2, p3].map((p) => matrix.multiplyVec2(p)),
	);
}

export function pathifySvgElement(ctx: SvgContext, node: ElementNode) {
	const { matrix, translate } = ctx.attr.matrixAndPosition(node, LayerType.Rect);

	const shapeLayerObjects = fromRect(ctx, node, matrix);

	const { nodes } = shapeLayerObjects.shapeState;
	const [cx, cy] = getPathNodesBoundingBoxCenter(nodes);

	for (const nodeId in nodes) {
		const node = nodes[nodeId];
		node.position = node.position.sub(Vec2.new(cx, cy));
	}

	ctx.op.add(
		shapeActions.addObjects(shapeLayerObjects.shapeState),
		compositionActions.createNonCompositionLayer(
			createLayer({
				compositionId: ctx.compositionId,
				compositionState: ctx.compositionState,
				type: LayerType.Shape,
				transform: {
					...DEFAULT_LAYER_TRANSFORM,
					translate: translate.add(Vec2.new(cx, cy)),
				},
				props: svgPathElementLayerProps(ctx, node, shapeLayerObjects.pathIds),
			}),
		),
	);
}
