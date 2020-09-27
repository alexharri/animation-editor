import { ActionType } from "typesafe-actions";
import { historyActions } from "~/state/history/historyActions";

type HistoryAction = ActionType<typeof historyActions>;

export interface HistoryState<S> {
	type: "normal" | "selection";
	list: Array<{ state: S; name: string; modifiedRelated: boolean; allowIndexShift: boolean }>;
	index: number;
	indexDirection: -1 | 1;
	action: null | {
		id: string;
		state: S;
	};
}

interface Options {
	selectionForKey?: string;
}

export function createReducerWithHistory<S>(
	initialState: S,
	reducer: (state: S, action: any) => S,
	options: Options = {},
) {
	const { selectionForKey = "" } = options;

	const initState: HistoryState<S> = {
		type: selectionForKey ? "selection" : "normal",
		list: [
			{
				state: initialState,
				name: "Initial state",
				modifiedRelated: false,
				allowIndexShift: false,
			},
		],
		index: 0,
		indexDirection: 1,
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
				return {
					...state,
					index,
					indexDirection: index > state.index ? 1 : -1,
				};
			}

			case "history/START_ACTION": {
				if (state.action) {
					console.warn("Attempted to start an action with another action in process.");
					return state;
				}

				const { actionId } = action.payload;

				const shiftForward =
					state.type === "selection" &&
					state.indexDirection === -1 &&
					state.list[state.index + 1].modifiedRelated &&
					state.list[state.index + 1].allowIndexShift;

				return {
					...state,
					action: {
						id: actionId,
						state: state.list[state.index + (shiftForward ? 1 : 0)].state,
					},
				};
			}

			case "history/DISPATCH_BATCH_TO_ACTION": {
				const { actionId, actionBatch, modifiesHistory } = action.payload;

				if (!modifiesHistory) {
					return state;
				}

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
				const { actionId, actionToDispatch, modifiesHistory } = action.payload;

				if (!modifiesHistory) {
					return state;
				}

				if (!state.action) {
					console.log(actionToDispatch);
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
				const {
					actionId,
					name,
					modifiesHistory,
					modifiedKeys,
					allowIndexShift,
				} = action.payload;

				if (!modifiesHistory) {
					return {
						...state,
						action: null,
					};
				}

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
							modifiedRelated: modifiedKeys.indexOf(selectionForKey) !== -1,
							allowIndexShift,
						},
					],
					index: state.index + 1,
					indexDirection: 1,
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
