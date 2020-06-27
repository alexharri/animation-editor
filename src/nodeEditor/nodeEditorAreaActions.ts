import { createAction } from "typesafe-actions";

export const nodeEditorAreaActions = {
	setGraphId: createAction("nodeEditorArea/SET_GRAPH_ID", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	setPan: createAction("nodeEditorArea/SET_PAN", (action) => {
		return (pan: Vec2) => action({ pan });
	}),

	setScale: createAction("nodeEditorArea/SET_SCALE", (action) => {
		return (scale: number) => action({ scale });
	}),
};
