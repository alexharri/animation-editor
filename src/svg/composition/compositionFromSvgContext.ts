import { CompositionState } from "~/composition/compositionReducer";
import { RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { Operation } from "~/types";
import { createGenMapIdFn } from "~/util/mapUtils";

export interface CompositionFromSvgContext {
	params: RequestActionParams;
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

export const createCompositionFromSvgContext = (
	params: RequestActionParams,
	compositionId: string,
	actionState: ActionState,
	boundingBox: [width: number, height: number],
): CompositionFromSvgContext => {
	const { compositionState, shapeState } = actionState;

	const ctx: CompositionFromSvgContext = {
		params,
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
