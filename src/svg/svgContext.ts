import { CompositionState } from "~/composition/compositionReducer";
import { createOperation } from "~/state/operation";
import { createSvgAttrGetter } from "~/svg/svgAttributes";
import { SvgStylesheet } from "~/svg/svgTypes";
import { Operation } from "~/types";
import { createGenMapIdFn } from "~/util/mapUtils";

export interface SvgContext {
	op: Operation;
	compositionState: CompositionState;
	compositionId: string;
	createLayerId: () => string;
	createId: () => string;
	createPathId: () => string;
	createShapeId: () => string;
	createEdgeId: () => string;
	createNodeId: () => string;
	createControlPointId: () => string;
	boundingBox: [width: number, height: number];
	stylesheet: SvgStylesheet;
	attr: ReturnType<typeof createSvgAttrGetter>;
}

export const createSvgContext = (
	compositionId: string,
	actionState: ActionState,
	stylesheet: SvgStylesheet,
	boundingBox: [width: number, height: number],
): SvgContext => {
	const { compositionState, shapeState } = actionState;

	const ctx: SvgContext = {
		compositionId,
		compositionState,
		createId: createGenMapIdFn(compositionState.properties),
		createLayerId: createGenMapIdFn(compositionState.layers),
		createControlPointId: createGenMapIdFn(shapeState.controlPoints),
		createEdgeId: createGenMapIdFn(shapeState.edges),
		createNodeId: createGenMapIdFn(shapeState.nodes),
		createPathId: createGenMapIdFn(shapeState.paths),
		createShapeId: createGenMapIdFn(shapeState.shapes),
		op: createOperation(),
		boundingBox,
		stylesheet,
		attr: null as any,
	};

	ctx.attr = createSvgAttrGetter(ctx);

	return ctx;
};
