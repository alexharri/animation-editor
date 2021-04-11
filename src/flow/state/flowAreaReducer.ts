import { ActionType, getType } from "typesafe-actions";
import { flowAreaActions } from "~/flow/flowAreaActions";

type Action = ActionType<typeof flowAreaActions>;

export interface FlowAreaState {
	pan: Vec2;
	scale: number;
	graphId: string;
	dragPreview: [Vec2, Vec2] | null;
}

export const initialFlowAreaState: FlowAreaState = {
	pan: Vec2.new(0, 0),
	scale: 1,
	graphId: "",
	dragPreview: null,
};

export const flowAreaReducer = (state = initialFlowAreaState, action: Action): FlowAreaState => {
	switch (action.type) {
		case getType(flowAreaActions.setFields): {
			const { fields } = action.payload;
			return { ...state, ...fields };
		}

		case getType(flowAreaActions.setGraphId): {
			const { graphId } = action.payload;
			return { ...state, graphId };
		}

		case getType(flowAreaActions.setPan): {
			const { pan } = action.payload;
			return { ...state, pan };
		}

		case getType(flowAreaActions.setScale): {
			const { scale } = action.payload;
			return { ...state, scale };
		}

		default:
			return state;
	}
};
