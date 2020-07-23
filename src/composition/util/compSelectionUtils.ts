import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";
import { isMapShallowEqual } from "~/util/mapUtils";

const _emptySelection = {
	layers: {},
	properties: {},
};
export const getCompSelectionFromState = (
	compositionId: string,
	compositionSelectionState: CompositionSelectionState,
) => {
	// We reuse the same empty selection
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

	return false;
};
