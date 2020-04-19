import { VectorEditor } from "~/vectorEditor/VectorEditor";
import { AreaType } from "~/constants";
import { NodeEditor } from "~/nodeEditor/NodeEditor";
import { nodeEditorAreaReducer } from "~/nodeEditor/nodeEditorAreaReducer";
import HistoryEditor from "~/historyEditor/HistoryEditor";
import { TimelineEditor } from "~/timeline/TimelineEditor";
import { timelineEditorAreaReducer } from "~/timeline/timelineEditorAreaState";
import { compositionTimelineAreaReducer } from "~/composition/timeline/compositionTimelineAreaReducer";
import { CompositionTimeline } from "~/composition/timeline/CompositionTimeline";

export const areaComponentRegistry = {
	[AreaType.VectorEditor]: VectorEditor,
	[AreaType.CompositionTimeline]: CompositionTimeline,
	[AreaType.NodeEditor]: NodeEditor,
	[AreaType.Timeline]: TimelineEditor,
	[AreaType.History]: HistoryEditor,
	[AreaType.Temp]: () => <p>Test</p>,
};

export const areaStateReducerRegistry = {
	[AreaType.VectorEditor]: () => ({} as any),
	[AreaType.CompositionTimeline]: compositionTimelineAreaReducer,
	[AreaType.NodeEditor]: nodeEditorAreaReducer,
	[AreaType.Timeline]: timelineEditorAreaReducer,
	[AreaType.History]: () => ({}),
	[AreaType.Temp]: () => ({} as any),
};
