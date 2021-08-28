import { Diff, DiffType } from "~/diff/diffs";

export const adjustDiffsToChildComposition = (
	actionState: ActionState,
	_diffs: Diff[],
	compositionLayerId: string,
): Diff[] => {
	const { compositionState } = actionState;
	const layer = compositionState.layers[compositionLayerId];
	const compositionId = compositionState.compositionLayerIdToComposition[compositionLayerId];

	const diffs = [];

	for (const diff of _diffs) {
		switch (diff.type) {
			case DiffType.FrameIndex: {
				diffs.push({
					...diff,
					compositionId,
					frameIndex: diff.frameIndex - layer.playbackStartsAtIndex,
				});
				break;
			}
			default:
				diffs.push(diff);
				break;
		}
	}

	return diffs;
};
