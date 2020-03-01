import { createAction } from "typesafe-actions";

export const nodeEditorAreaActions = {
	setPan: createAction("nodeEditorArea/SET_PAN", action => {
		return (pan: Vec2) => action({ pan });
	}),

	setScale: createAction("nodeEditorArea/SET_SCALE", action => {
		return (scale: number) => action({ scale });
	}),
};
