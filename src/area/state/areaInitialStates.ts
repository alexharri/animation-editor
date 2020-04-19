import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { initialTimelineAreaState } from "~/timeline/timelineEditorAreaState";
import { initialCompositionTimelineAreaState } from "~/composition/timeline/compositionTimelineAreaReducer";

export const areaInitialStates: { [key in AreaType]: any } = {
	[AreaType.VectorEditor]: {},
	[AreaType.CompositionTimeline]: initialCompositionTimelineAreaState,
	[AreaType.NodeEditor]: initialNodeEditorAreaState,
	[AreaType.Timeline]: initialTimelineAreaState,
	[AreaType.Temp]: {},
	[AreaType.History]: {},
};
