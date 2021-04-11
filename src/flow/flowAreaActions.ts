import { createAction } from "typesafe-actions";
import { FlowAreaState } from "~/flow/state/flowAreaReducer";

export const flowAreaActions = {
	setFields: createAction("flowArea/SET_FIELDS", (action) => {
		return (fields: Partial<FlowAreaState>) => action({ fields });
	}),

	setGraphId: createAction("flowArea/SET_GRAPH_ID", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	setPan: createAction("flowArea/SET_PAN", (action) => {
		return (pan: Vec2) => action({ pan });
	}),

	setScale: createAction("flowArea/SET_SCALE", (action) => {
		return (scale: number) => action({ scale });
	}),
};
