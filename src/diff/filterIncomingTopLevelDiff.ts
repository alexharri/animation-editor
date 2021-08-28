import { Diff, DiffType } from "~/diff/diffs";

export const filterIncomingTopLevelDiff = (diff: Diff, compositionId: string) => {
	switch (diff.type) {
		case DiffType.FrameIndex: {
			if (diff.compositionId !== compositionId) {
				return false;
			}
		}
	}

	return true;
};
