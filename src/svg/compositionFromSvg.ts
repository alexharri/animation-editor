import { ElementNode, Node, parse } from "svg-parser";
import { compositionActions } from "~/composition/compositionReducer";
import { Composition } from "~/composition/compositionTypes";
import { createLayer } from "~/composition/layer/createLayer";
import { DEG_TO_RAD_FAC, RAD_TO_DEG_FAC } from "~/constants";
import { requestAction } from "~/listener/requestAction";
import { projectActions } from "~/project/projectReducer";
import { shapeActions } from "~/shape/shapeReducer";
import { getActionState } from "~/state/stateUtils";
import { pathifySvgElement } from "~/svg/pathifySvgElement";
import { shapeLayerObjectsFromPathD } from "~/svg/shapeLayerFromPathD";
import { shapeLayerObjectsFromPolygon } from "~/svg/shapeLayerFromPolygon";
import { createSvgContext, SvgContext } from "~/svg/svgContext";
import { svgPathElementLayerProps } from "~/svg/svgElementLayerProps";
import { constructSvgStylesheet } from "~/svg/svgStylesheet";
import { getPathNodesBoundingBoxCenter } from "~/svg/svgUtils";
import { LayerType } from "~/types";
import { createMapNumberId } from "~/util/mapUtils";
import { getAngleRadians, getDistance } from "~/util/math";
import { getNonDuplicateName } from "~/util/names";

export function shouldPathifyNode(ctx: SvgContext, node: ElementNode): boolean {
	const transformString = ctx.attr.transformString(node);

	const tests = ["matrix", "skew", "skewX", "skewY"];
	for (const test of tests) {
		if (transformString.indexOf(test) !== -1) {
			return true;
		}
	}

	return false;
}

function handleSvg(node: ElementNode) {
	const svgStylesheet = constructSvgStylesheet(node);

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

		const ctx = createSvgContext(params, composition.id, getActionState(), svgStylesheet, [
			width,
			height,
		]);

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
	const fill = ctx.attr.fill(node) || [255, 0, 0, 0];
	const strokeColor = ctx.attr.strokeColor(node) || [0, 0, 0, 1];
	const strokeWidth = ctx.attr.strokeWidth(node);
	const width = ctx.attr.width(node);
	const height = ctx.attr.height(node);

	const transform = ctx.attr.transform(node, LayerType.Rect);

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
	const fill = ctx.attr.fill(node) || [0, 0, 0, 0];
	const strokeColor = ctx.attr.strokeColor(node) || [0, 0, 0, 0];
	const strokeWidth = ctx.attr.strokeWidth(node);
	const radius = ctx.attr.radius(node);

	const transform = ctx.attr.transform(node, LayerType.Ellipse);

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

function line(ctx: SvgContext, node: ElementNode) {
	const strokeColor = ctx.attr.strokeColor(node) || [0, 0, 0, 0];
	const strokeWidth = ctx.attr.strokeWidth(node);
	const lineCap = ctx.attr.lineCap(node);
	const p1 = ctx.attr.p1(node);
	const p2 = ctx.attr.p2(node);

	const rotation = getAngleRadians(p1, p2) * RAD_TO_DEG_FAC;
	const width = getDistance(p1, p2);

	const transform = ctx.attr.transform(node, LayerType.Line);
	transform.translate = p1;
	transform.rotation += rotation;

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

function path(ctx: SvgContext, node: ElementNode) {
	const d = ctx.attr.d(node);

	if (!d) {
		// Path does not specify anything to draw. Ignore it.
		return;
	}

	const transform = ctx.attr.transform(node, LayerType.Shape);
	const shapeLayerObjects = shapeLayerObjectsFromPathD(ctx, d, Vec2.new(0, 0));

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
				props: svgPathElementLayerProps(ctx, node, shapeLayerObjects.pathIds),
			}),
		),
	);
}

function polygon(ctx: SvgContext, node: ElementNode) {
	const points = ctx.attr.points(node);

	if (!points) {
		// Path does not specify anything to draw. Ignore it.
		return;
	}

	const transform = ctx.attr.transform(node, LayerType.Shape);
	const shapeLayerObjects = shapeLayerObjectsFromPolygon(ctx, points);

	ctx.op.add(
		shapeActions.addObjects(shapeLayerObjects.shapeState),
		compositionActions.createNonCompositionLayer(
			createLayer({
				compositionId: ctx.compositionId,
				compositionState: ctx.compositionState,
				type: LayerType.Shape,
				transform,
				props: svgPathElementLayerProps(ctx, node, shapeLayerObjects.pathIds),
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
			if (shouldPathifyNode(ctx, node)) {
				pathifySvgElement(ctx, node);
				break;
			}

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
				case "line": {
					line(ctx, node);
					break;
				}
				case "g": {
					for (const child of [...node.children].reverse()) {
						if (typeof child === "string") {
							// I don't know when the children are strings
							continue;
						}

						direct(ctx, child);

						ctx.params.dispatch(ctx.op.actions);
						ctx.op.clear();
						ctx.compositionState = getActionState().compositionState;
					}
					break;
				}
				case "style": {
					// Style elements are parsed in a separate pass.
					break;
				}
				default: {
					console.log(node);
					console.warn(`Unknown SVG element tag name '${node.tagName}'`);
				}
			}

			break;
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
