import { createStore, Store } from "redux";
import reducers from "~/state/reducers";

const storeInstance: Store<ApplicationState> = createStore(reducers);

export const store = storeInstance;
