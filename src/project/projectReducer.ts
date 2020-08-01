import { ActionType, createAction, getType } from "typesafe-actions";
import { Composition } from "~/composition/compositionTypes";

export interface ProjectState {
	compositions: string[];
	dragComp: null | {
		compositionId: string;
		position: Vec2;
	};
	playback: null | {
		compositionId: number;
		frameIndex: number;
	};
}

export const initialProjectState: ProjectState = {
	compositions: [],
	dragComp: null,
	playback: null,
};

export const projectActions = {
	addComposition: createAction("project/SET_COMP", (action) => {
		return (composition: Composition) => action({ composition });
	}),

	removeComposition: createAction("project/REMOVE_COMP", (action) => {
		return (compositionId: string) => action({ compositionId });
	}),

	setDragComposition: createAction("project/SET_DRAG_COMP", (action) => {
		return (compositionId: string, position: Vec2) => action({ compositionId, position });
	}),

	clearDragComposition: createAction("project/CLEAR_DRAG_COMP", (action) => {
		return () => action({});
	}),
};

type Action = ActionType<typeof projectActions>;

export const projectReducer = (state = initialProjectState, action: Action): ProjectState => {
	switch (action.type) {
		case getType(projectActions.addComposition): {
			const { composition } = action.payload;
			return {
				...state,
				compositions: [...state.compositions, composition.id],
			};
		}

		case getType(projectActions.setDragComposition): {
			const { compositionId, position } = action.payload;
			return {
				...state,
				dragComp: { compositionId, position },
			};
		}

		case getType(projectActions.removeComposition): {
			const { compositionId } = action.payload;

			return {
				...state,
				compositions: state.compositions.filter((c) => c !== compositionId),
			};
		}

		case getType(projectActions.clearDragComposition): {
			return { ...state, dragComp: null };
		}

		default:
			return state;
	}
};
