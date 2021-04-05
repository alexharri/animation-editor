import { compositionActions } from "~/composition/compositionReducer";
import { Composition } from "~/composition/compositionTypes";
import { requestAction } from "~/listener/requestAction";
import { projectActions } from "~/project/projectReducer";
import { getActionState } from "~/state/stateUtils";
import { createCompositionFromSvgContext } from "~/svg/composition/compositionFromSvgContext";
import { svgLayerFactory } from "~/svg/composition/svgLayerFactory";
import { svgTreeFromSvgString } from "~/svg/parse/svgTree";
import { SVGSvgNode } from "~/svg/svgTypes";
import { createMapNumberId } from "~/util/mapUtils";
import { getNonDuplicateName } from "~/util/names";

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
		};

		params.dispatch(compositionActions.setComposition(composition));
		params.dispatch(projectActions.addComposition(composition));

		const ctx = createCompositionFromSvgContext(params, composition.id, getActionState(), [
			width,
			height,
		]);

		for (const child of [...node.children].reverse()) {
			if (typeof child === "string") {
				// I don't know when the children are strings
				continue;
			}

			if (svgLayerFactory[child.tagName]) {
				svgLayerFactory[child.tagName]!(ctx, child);
			}

			ctx.op.submit();
			ctx.compositionState = getActionState().compositionState;
		}

		params.submitAction("Parse SVG");
	});
}

export const compositionFromSvg = (svg: string) => {
	const parsed = svgTreeFromSvgString(svg, {
		toPathify: ["polygon", "polyline", "ellipse"],
	});

	handleSvg(parsed);
};
