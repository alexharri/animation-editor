import { createStore, Store } from "redux";
import reducers from "~/state/reducers";
import { getSavedActionState } from "~/state/saveState";
import { createApplicationStateFromActionState } from "~/state/stateUtils";

let initialState: ApplicationState | undefined;

const savedActionState = getSavedActionState();
if (savedActionState) {
	initialState = createApplicationStateFromActionState(savedActionState);
}

const storeInstance: Store<ApplicationState> = createStore(reducers, initialState);

export const store = storeInstance;
