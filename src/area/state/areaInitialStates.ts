import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { initialTimelineAreaState } from "~/timeline/timelineEditorAreaState";

export const areaInitialStates: { [key in AreaType]: any } = {
	[AreaType.VectorEditor]: {},
	[AreaType.NodeEditor]: initialNodeEditorAreaState,
	[AreaType.Timeline]: initialTimelineAreaState,
	[AreaType.Temp]: {},
	[AreaType.History]: {},
};
