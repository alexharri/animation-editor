import { ActionType } from "typesafe-actions";
import { historyActions } from "~/state/history/historyActions";

type HistoryAction = ActionType<typeof historyActions>;

export interface HistoryState<S> {
	list: Array<{ state: S; name: string }>;
	index: number;
	action: null | {
		id: string;
		state: S;
	};
}

export function createReducerWithHistory<S>(
	initialState: S,
	reducer: (state: S, action: any) => S,
) {
	const initState: HistoryState<S> = {
		list: [{ state: initialState, name: "Initial state" }],
		index: 0,
		action: null,
	};

	return (state: HistoryState<S> = initState, action: HistoryAction): HistoryState<S> => {
		switch (action.type) {
			case "history/MOVE_INDEX": {
				if (state.action) {
					console.warn("Attempted to move history list index with an action in process.");
					return state;
				}

				const { index } = action.payload;
				return { ...state, index };
			}

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
						state: state.list[state.index].state,
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
				const { actionId, name } = action.payload;

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
					list: [
						...state.list.slice(0, state.index + 1),
						{
							state: state.action.state,
							name,
						},
					],
					index: state.index + 1,
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
