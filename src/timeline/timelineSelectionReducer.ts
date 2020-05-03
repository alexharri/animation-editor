import { ActionType, getType } from "typesafe-actions";
import { timelineActions } from "~/timeline/timelineActions";
import { KeySelectionMap } from "~/types";

type Action = ActionType<typeof timelineActions>;

export interface TimelineSelectionState {
	timelineId: string;
	keyframes: KeySelectionMap;
	_dragSelectRect: Rect | null;
}

export const initialTimelineSelectionState: TimelineSelectionState = {
	timelineId: "",
	keyframes: {},
	_dragSelectRect: null,
};

const createNewState = (timelineId: string): TimelineSelectionState => ({
	timelineId,
	keyframes: {},
	_dragSelectRect: null,
});

export function timelineSelectionReducer(
	state: TimelineSelectionState,
	action: Action,
): TimelineSelectionState {
	switch (action.type) {
		case getType(timelineActions.clearSelection): {
			const { timelineId } = action.payload;

			const newState =
				state.timelineId === timelineId ? { ...state } : createNewState(timelineId);

			return {
				...newState,
				keyframes: {},
			};
		}

		case getType(timelineActions.toggleKeyframeSelection): {
			const { timelineId, keyframeId } = action.payload;

			const newState =
				state.timelineId === timelineId ? { ...state } : createNewState(timelineId);

			if (newState.keyframes[keyframeId]) {
				newState.keyframes = Object.keys(newState.keyframes).reduce<KeySelectionMap>(
					(obj, key) => {
						if (keyframeId !== key) {
							obj[key] = true;
						}
						return obj;
					},
					{},
				);
				return newState;
			}

			return {
				...newState,
				keyframes: {
					...newState.keyframes,
					[keyframeId]: true,
				},
			};
		}

		case getType(timelineActions.setDragSelectRect): {
			const { timelineId, rect } = action.payload;
			return {
				...state,
				timelineId,
				_dragSelectRect: rect,
			};
		}

		// case getType(timelineActions.submitDragSelectRect): {
		// 	const { timelineId, additiveSelection } = action.payload;

		// 	return {
		// 		...state,
		// 		keyframes: Object.keys(state.nodes).reduce<{ [key: string]: true }>((obj, key) => {
		// 					const node = state.nodes[key];
		// 					const shouldBeSelected =
		// 						(additiveSelection && state.selection.nodes[key]) ||
		// 						rectsIntersect(state._dragSelectRect!, {
		// 							left: node.position.x,
		// 							top: node.position.y,
		// 							height: calculateNodeHeight(node),
		// 							width: node.width,
		// 						});

		// 					if (shouldBeSelected) {
		// 						obj[key] = true;
		// 					}

		// 					return obj;
		// 				}, {}),
		// 		_dragSelectRect: null,
		// 	};
		// }

		default:
			return state;
	}
}
