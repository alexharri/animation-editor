import { ActionType } from "typesafe-actions";
import { historyActions } from "~/state/history/historyActions";

type HistoryAction = ActionType<typeof historyActions>;

export interface ActionBasedState<S> {
	state: S;
	action: null | {
		id: string;
		state: S;
	};
}

export function createActionBasedReducer<S>(
	initialState: S,
	reducer: (state: S, action: any) => S,
) {
	const initState: ActionBasedState<S> = {
		state: initialState,
		action: null,
	};

	return (state: ActionBasedState<S> = initState, action: HistoryAction): ActionBasedState<S> => {
		switch (action.type) {
			case "history/START_ACTION": {
				if (state.action) {
					console.warn("Attempted to start an action with another action in process.");
					return state;
				}

				const { actionId } = action.payload;

				return {
					...state,
					action: {
						id: actionId,
						state: state.state,
					},
				};
			}

			case "history/DISPATCH_BATCH_TO_ACTION": {
				const { actionId, actionBatch } = action.payload;

				if (!state.action) {
					console.warn("Attempted to dispatch to an action that does not exist.");
					return state;
				}

				if (state.action.id !== actionId) {
					console.warn("Attempted to dispatch with the wrong action id.");
					return state;
				}

				let newState = state.action.state;

				for (let i = 0; i < actionBatch.length; i += 1) {
					newState = reducer(newState, actionBatch[i]);
				}

				if (newState === state.action.state) {
					// State was not modified
					return state;
				}

				return {
					...state,
					action: {
						...state.action,
						state: newState,
					},
				};
			}

			case "history/DISPATCH_TO_ACTION": {
				const { actionId, actionToDispatch } = action.payload;

				if (!state.action) {
					console.warn("Attempted to dispatch to an action that does not exist.");
					return state;
				}

				if (state.action.id !== actionId) {
					console.warn("Attempted to dispatch with the wrong action id.");
					return state;
				}

				const newState = reducer(state.action.state, actionToDispatch);

				if (newState === state.action.state) {
					// State was not modified
					return state;
				}

				return {
					...state,
					action: {
						...state.action,
						state: newState,
					},
				};
			}

			case "history/SUBMIT_ACTION": {
				const { actionId } = action.payload;

				if (!state.action) {
					console.warn("Attempted to submit an action that does not exist.");
					return state;
				}

				if (state.action.id !== actionId) {
					console.warn("Attempted to submit with the wrong action id.");
					return state;
				}

				return {
					...state,
					state: state.action.state,
					action: null,
				};
			}

			case "history/CANCEL_ACTION": {
				const { actionId } = action.payload;

				if (!state.action) {
					console.warn("Attempted to cancel an action that does not exist.");
					return state;
				}

				if (state.action.id !== actionId) {
					console.warn("Attempted to cancel with the wrong action id.");
					return state;
				}

				return {
					...state,
					action: null,
				};
			}

			default: {
				return state;
			}
		}
	};
}
