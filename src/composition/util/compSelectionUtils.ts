import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { getTimelineIdsReferencedByComposition } from "~/composition/compositionUtils";
import { isMapShallowEqual, mapKeysEqual } from "~/util/mapUtils";

const _emptySelection = {
	layers: {},
	properties: {},
};
export const getCompSelectionFromState = (
	compositionId: string,
	compositionSelectionState: CompositionSelectionState,
) => {
	// We reuse the same empty selection instead of creating a new one each time so
	// that different object references do not cause unnecessary rerenders.
	const selection = compositionSelectionState[compositionId] ?? _emptySelection;
	return selection;
};

export const didCompSelectionChange: (
	compositionId: string,
) => (prevState: ActionState, nextState: ActionState) => boolean = (compositionId) => (
	prevState,
	nextState,
) => {
	const a = getCompSelectionFromState(compositionId, prevState.compositionSelectionState);
	const b = getCompSelectionFromState(compositionId, nextState.compositionSelectionState);

	if (!isMapShallowEqual(a.layers, b.layers)) {
		return true;
	}

	if (!isMapShallowEqual(a.properties, b.properties)) {
		return true;
	}

	// Check whether any timeline selections referenced by the composition changed
	if (!mapKeysEqual(prevState.timelineSelection, nextState.timelineSelection)) {
		return true;
	}

	const timelineIds = getTimelineIdsReferencedByComposition(
		compositionId,
		prevState.compositionState,
	);
	for (let i = 0; i < timelineIds.length; i += 1) {
		const a = prevState.timelineSelection[timelineIds[i]];
		const b = nextState.timelineSelection[timelineIds[i]];

		// We checked for map key equality earlier, so if one does not exist
		// the other shouldn't exist either
		if (!a && !b) {
			continue;
		}

		if (!isMapShallowEqual(a!.keyframes, b!.keyframes)) {
			return true;
		}
	}

	return false;
};
