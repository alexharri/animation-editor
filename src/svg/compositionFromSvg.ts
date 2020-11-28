import { ElementNode } from "svg-parser";
import { compositionActions } from "~/composition/compositionReducer";
import { Composition } from "~/composition/compositionTypes";
import { requestAction } from "~/listener/requestAction";
import { projectActions } from "~/project/projectReducer";
import { getActionState } from "~/state/stateUtils";
import { constructSvgTree } from "~/svg/parse/parseSvgTree";
import { createSvgContext, SvgContext } from "~/svg/svgContext";
import { svgLayerFactory } from "~/svg/svgLayerFactory";
import { SVGSvgNode } from "~/svg/svgTypes";
import { createMapNumberId } from "~/util/mapUtils";
import { getNonDuplicateName } from "~/util/names";

export function canRepresentTransform(ctx: SvgContext, node: ElementNode): boolean {
	const transformString = ctx.attr.transformString(node);

	const tests = ["matrix", "skew", "skewX", "skewY"];
	for (const test of tests) {
		if (transformString.indexOf(test) !== -1) {
			return false;
		}
	}

	return true;
}

function handleSvg(node: SVGSvgNode) {
	const { width = 100, height = 100 } = node.properties;

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

		const ctx = createSvgContext(params, composition.id, getActionState(), [width, height]);

		for (const child of [...node.children].reverse()) {
			if (typeof child === "string") {
				// I don't know when the children are strings
				continue;
			}

			if (svgLayerFactory[child.tagName]) {
				svgLayerFactory[child.tagName]!(ctx, child);
			}

			params.dispatch(ctx.op.actions);
			ctx.op.clear();
			ctx.compositionState = getActionState().compositionState;
		}

		params.submitAction("Parse SVG");
	});
}

export const compositionFromSvg = (svg: string) => {
	const parsed = constructSvgTree(svg, {
		toPathify: ["polygon", "polyline", "rect", "ellipse", "line"],
	});

	handleSvg(parsed);
};
