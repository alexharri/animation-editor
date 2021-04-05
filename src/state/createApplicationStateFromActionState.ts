import { ActionBasedState } from "~/state/history/actionBasedReducer";
import { HistoryState } from "~/state/history/historyReducer";

export const createApplicationStateFromActionState = (
	actionState: ActionState,
): ApplicationState => {
	const toActionBasedState = <S extends {} = {}>(state: S): ActionBasedState<S> => ({
		action: null,
		state,
	});
	const toHistoryBasedState = <S extends {} = {}>(
		state: S,
		type: "selection" | "normal" = "normal",
	): HistoryState<S> => ({
		action: null,
		index: 0,
		indexDirection: 1,
		list: [
			{
				state,
				modifiedRelated: false,
				name: "Initial state",
				allowIndexShift: false,
				diffs: [],
			},
		],
		type,
	});

	const state: ApplicationState = {
		area: toActionBasedState(actionState.area),
		compositionSelectionState: toHistoryBasedState(
			actionState.compositionSelectionState,
			"selection",
		),
		compositionState: toHistoryBasedState(actionState.compositionState),
		contextMenu: toActionBasedState(actionState.contextMenu),
		flowState: toHistoryBasedState(actionState.flowState),
		flowSelectionState: toHistoryBasedState(actionState.flowSelectionState, "selection"),
		project: toHistoryBasedState(actionState.project),
		shapeState: toHistoryBasedState(actionState.shapeState),
		shapeSelectionState: toHistoryBasedState(actionState.shapeSelectionState, "selection"),
		timelineState: toHistoryBasedState(actionState.timelineState),
		timelineSelectionState: toHistoryBasedState(
			actionState.timelineSelectionState,
			"selection",
		),
		tool: toActionBasedState(actionState.tool),
	};

	return state;
};
