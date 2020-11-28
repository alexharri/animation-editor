import { compositionActions } from "~/composition/compositionReducer";
import { createLayer } from "~/composition/layer/createLayer";
import { DEFAULT_LAYER_TRANSFORM, DEG_TO_RAD_FAC } from "~/constants";
import { shapeActions } from "~/shape/shapeReducer";
import { getActionState } from "~/state/stateUtils";
import { shapeLayerFromCurves } from "~/svg/parse/shapeLayerFromCurves";
import { SvgContext } from "~/svg/svgContext";
import { svgPathElementLayerProps } from "~/svg/svgElementLayerProps";
import {
	SVGCircleNode,
	SVGGNode,
	SVGLineNode,
	SVGNode,
	SVGPathNode,
	SVGRectNode,
} from "~/svg/svgTypes";
import { getPathNodesBoundingBoxCenter } from "~/svg/svgUtils";
import { LayerTransform, LayerType } from "~/types";
import { getDistance } from "~/util/math";

const transformFromNode = (node: SVGNode): LayerTransform => {
	const { anchor, position, rotation, scale } = node;
	return {
		...DEFAULT_LAYER_TRANSFORM,
		anchor,
		rotation,
		scaleX: scale.x,
		scaleY: scale.y,
		translate: position,
	};
};

function rect(ctx: SvgContext, _node: SVGNode) {
	const node = _node as SVGRectNode;
	const transform = transformFromNode(node);
	const { width, height, fill, strokeColor, strokeWidth } = node.properties;

	ctx.op.add(
		compositionActions.createNonCompositionLayer(
			createLayer({
				compositionId: ctx.compositionId,
				compositionState: ctx.compositionState,
				type: LayerType.Rect,
				transform,
				props: { width, height, fill, strokeColor, strokeWidth },
			}),
		),
	);
}

function circle(ctx: SvgContext, _node: SVGNode) {
	const node = _node as SVGCircleNode;
	const transform = transformFromNode(node);
	const { radius, fill, strokeColor, strokeWidth } = node.properties;

	ctx.op.add(
		compositionActions.createNonCompositionLayer(
			createLayer({
				compositionId: ctx.compositionId,
				compositionState: ctx.compositionState,
				type: LayerType.Ellipse,
				transform,
				props: { radius, fill, strokeColor, strokeWidth },
			}),
		),
	);
}

function line(ctx: SvgContext, _node: SVGNode) {
	const node = _node as SVGLineNode;
	const transform = transformFromNode(node);
	const { line, lineCap, strokeColor, strokeWidth } = node.properties;
	const width = getDistance(line[0], line[1]);

	ctx.op.add(
		compositionActions.createNonCompositionLayer(
			createLayer({
				compositionId: ctx.compositionId,
				compositionState: ctx.compositionState,
				type: LayerType.Line,
				transform,
				props: { width, strokeColor, strokeWidth, lineCap },
			}),
		),
	);
}

function path(ctx: SvgContext, _node: SVGNode) {
	const node = _node as SVGPathNode;
	const transform = transformFromNode(node);
	const shapeLayerObjects = shapeLayerFromCurves(ctx, node.properties.d);

	const nodes = shapeLayerObjects.shapeState.nodes;

	const [cx, cy] = getPathNodesBoundingBoxCenter(nodes);

	for (const nodeId in nodes) {
		const node = nodes[nodeId];
		node.position = node.position.sub(Vec2.new(cx, cy));
	}

	transform.translate = transform.translate
		.add(Vec2.new(cx, cy))
		.scaleXY(transform.scaleX, transform.scaleY, transform.translate)
		.rotate(transform.rotation * DEG_TO_RAD_FAC, transform.translate);

	ctx.op.add(
		shapeActions.addObjects(shapeLayerObjects.shapeState),
		compositionActions.createNonCompositionLayer(
			createLayer({
				compositionId: ctx.compositionId,
				compositionState: ctx.compositionState,
				type: LayerType.Shape,
				transform,
				props: svgPathElementLayerProps(node, shapeLayerObjects.pathIds),
			}),
		),
	);
}

function g(ctx: SvgContext, _node: SVGNode) {
	const node = _node as SVGGNode;

	for (const child of [...node.children].reverse()) {
		if (svgLayerFactory[child.tagName]) {
			svgLayerFactory[child.tagName]!(ctx, child);
		}

		ctx.params.dispatch(ctx.op.actions);
		ctx.op.clear();
		ctx.compositionState = getActionState().compositionState;
	}
}

export const svgLayerFactory: Partial<Record<
	SVGNode["tagName"],
	(ctx: SvgContext, node: SVGNode) => void
>> = {
	circle,
	line,
	path,
	rect,
	g,
};
