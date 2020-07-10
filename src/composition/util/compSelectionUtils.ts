import { isMapShallowEqual } from "~/util/mapUtils";

export const didCompSelectionChange: (prevState: ActionState, nextState: ActionState) => boolean = (
	prevState,
	nextState,
) => {
	const a = prevState.compositionSelection;
	const b = nextState.compositionSelection;

	if (!isMapShallowEqual(a.layers, b.layers)) {
		return true;
	}

	if (!isMapShallowEqual(a.properties, b.properties)) {
		return true;
	}

	return false;
};
