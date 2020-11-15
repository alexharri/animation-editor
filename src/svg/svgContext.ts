import { CompositionState } from "~/composition/compositionReducer";
import { createOperation } from "~/state/operation";
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
}

export const createSvgContext = (
	compositionId: string,
	actionState: ActionState,
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
	};
	return ctx;
};
