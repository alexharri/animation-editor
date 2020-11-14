import { ElementNode, Node, parse } from "svg-parser";
import { compositionActions } from "~/composition/compositionReducer";
import { Composition } from "~/composition/compositionTypes";
import { createLayer } from "~/composition/layer/createLayer";
import { requestAction } from "~/listener/requestAction";
import { projectActions } from "~/project/projectReducer";
import { shapeActions } from "~/shape/shapeReducer";
import { getActionState } from "~/state/stateUtils";
import { shapeLayerObjectsFromPathD } from "~/svg/shapeLayerFromPathD";
import { shapeLayerObjectsFromPolygon } from "~/svg/shapeLayerFromPolygon";
import { getSvgAttr } from "~/svg/svgAttributes";
import { createSvgContext, SvgContext } from "~/svg/svgContext";
import { svgPathElementLayerProps } from "~/svg/svgElementLayerProps";
import { LayerType } from "~/types";
import { createMapNumberId } from "~/util/mapUtils";
import { getNonDuplicateName } from "~/util/names";

function handleSvg(node: ElementNode) {
	const { width = 100, height = 100 } = (node.properties || {}) as Partial<{
		width: number;
		height: number;
	}>;

	requestAction({ history: true }, (params) => {
		let { compositionState } = getActionState();

		const existingNames = Object.values(compositionState.compositions).map((comp) => comp.name);
		const composition: Composition = {
			id: createMapNumberId(compositionState.compositions),
			frameIndex: 0,
			width,
			height,
			layers: [],
			length: 120,
			name: getNonDuplicateName("Composition", existingNames),
			shapeMoveVector: Vec2.ORIGIN,
		};

		params.dispatch(compositionActions.setComposition(composition));
		params.dispatch(projectActions.addComposition(composition));

		const ctx = createSvgContext(composition.id, getActionState());

		for (const child of [...node.children].reverse()) {
			if (typeof child === "string") {
				// I don't know when the children are strings
				continue;
			}

			direct(ctx, child);

			params.dispatch(ctx.op.actions);
			ctx.op.clear();
			ctx.compositionState = getActionState().compositionState;
		}

		params.submitAction("Parse SVG");
	});
}

function rect(ctx: SvgContext, node: ElementNode) {
	const fill = getSvgAttr.fill(node);
	const strokeColor = getSvgAttr.strokeColor(node);
	const strokeWidth = getSvgAttr.strokeWidth(node);
	const width = getSvgAttr.width(node);
	const height = getSvgAttr.height(node);

	const transform = getSvgAttr.transform(node, LayerType.Rect);

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

function circle(ctx: SvgContext, node: ElementNode) {
	const fill = getSvgAttr.fill(node);
	const strokeColor = getSvgAttr.strokeColor(node);
	const strokeWidth = getSvgAttr.strokeWidth(node);
	const radius = getSvgAttr.radius(node);

	const transform = getSvgAttr.transform(node, LayerType.Ellipse);

	console.log({ radius });

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

function path(ctx: SvgContext, node: ElementNode) {
	const d = getSvgAttr.d(node);

	if (!d) {
		// Path does not specify anything to draw. Ignore it.
		return;
	}

	const transform = getSvgAttr.transform(node, LayerType.Shape);

	const shapeLayerObjects = shapeLayerObjectsFromPathD(ctx, d, Vec2.new(0, 0));

	transform.translate = transform.translate;

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

function polygon(ctx: SvgContext, node: ElementNode) {
	const points = getSvgAttr.points(node);

	if (!points) {
		// Path does not specify anything to draw. Ignore it.
		return;
	}

	const transform = getSvgAttr.transform(node, LayerType.Shape);
	const shapeLayerObjects = shapeLayerObjectsFromPolygon(ctx, points);

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

function direct(ctx: SvgContext, node: Node) {
	switch (node.type) {
		case "text": {
			throw new Error("Text nodes have not been implemented");
		}

		case "element": {
			switch (node.tagName) {
				case "rect": {
					rect(ctx, node);
					break;
				}
				case "path": {
					path(ctx, node);
					break;
				}
				case "polygon": {
					polygon(ctx, node);
					break;
				}
				case "circle": {
					circle(ctx, node);
					break;
				}
				default: {
					console.log(node);
					console.warn(`Unknown SVG element tag name '${node.tagName}'`);
				}
			}
		}
	}
}

export const compositionFromSvg = (svg: string) => {
	const parsed = parse(svg);

	const el = parsed.children[0];

	if (!el || el.type !== "element" || el.tagName !== "svg") {
		throw new Error("Expected root to have an svg child.");
	}

	handleSvg(el);
};
