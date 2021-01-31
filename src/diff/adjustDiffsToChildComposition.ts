import { Diff, DiffType } from "~/diff/diffs";

export const adjustDiffsToChildComposition = (
	actionState: ActionState,
	_diffs: Diff[],
	compositionLayerId: string,
): Diff[] => {
	const { compositionState } = actionState;
	const layer = compositionState.layers[compositionLayerId];
	const layerIndex = layer.index;
	const compositionId = compositionState.compositionLayerIdToComposition[compositionLayerId];

	const diffs = [..._diffs];

	for (let i = 0; i < diffs.length; i++) {
		const diff = diffs[i];

		if (diff.type === DiffType.FrameIndex) {
			diffs[i] = {
				...diff,
				compositionId,
				frameIndex: diff.frameIndex + layerIndex,
			};
		}
	}

	return diffs;
};
