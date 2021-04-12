import { CompositionManager } from "~/composition/manager/compositionManager";
import { interactionManagerDiffHandler } from "~/composition/manager/interaction/interactionManagerDiffHandler";
import { layerManagerDiffHandler } from "~/composition/manager/layer/layerManagerDiffHandler";
import { propertyManagerDiffHandler } from "~/composition/manager/property/propertyManagerDiffHandler";
import { Diff } from "~/diff/diffs";
import { getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";

export const passDiffsToManagers = (
	ctx: CompositionManager,
	actionState: ActionState,
	diffs: Diff[],
	direction: "forward" | "backward",
) => {
	const { compositionId } = ctx;

	propertyManagerDiffHandler(
		compositionId,
		ctx.properties,
		actionState,
		diffs,
		direction,
		ctx.prevState,
	);

	interactionManagerDiffHandler(
		compositionId,
		ctx.interactions,
		actionState,
		diffs,
		direction,
		ctx.prevState,
	);

	layerManagerDiffHandler(
		compositionId,
		ctx.layers,
		ctx.properties,
		actionState,
		diffs,
		direction,
		ctx.prevState,
	);

	ctx.layers.sendDiffs(actionState, diffs, direction);
	ctx.prevState = getActionStateFromApplicationState(store.getState());

	ctx.setErrors(ctx.properties.getErrors());
};
