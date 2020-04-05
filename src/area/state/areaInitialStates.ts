import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";

export const areaInitialStates: { [key in AreaType]: any } = {
	[AreaType.VectorEditor]: {},
	[AreaType.NodeEditor]: initialNodeEditorAreaState,
	[AreaType.Temp]: {},
	[AreaType.History]: {},
};
