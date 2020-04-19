import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import {
	initialTimelineAreaState,
	TimelineEditorAreaState,
} from "~/timeline/timelineEditorAreaState";
import {
	initialCompositionTimelineAreaState,
	CompositionTimelineAreaState,
} from "~/composition/timeline/compositionTimelineAreaReducer";

export const areaInitialStates: { [key in AreaType]: any } = {
	[AreaType.VectorEditor]: {},
	[AreaType.CompositionTimeline]: initialCompositionTimelineAreaState,
	[AreaType.NodeEditor]: initialNodeEditorAreaState,
	[AreaType.Timeline]: initialTimelineAreaState,
	[AreaType.Temp]: {},
	[AreaType.History]: {},
};

export const areaInitialChildAreas: {
	[key in AreaType]: {
		[key: string]: {
			type: AreaType;
			initialState: (state: any) => any;
		};
	};
} = {
	[AreaType.VectorEditor]: {},
	[AreaType.CompositionTimeline]: {
		timeline: {
			type: AreaType.Timeline,
			initialState: (_: CompositionTimelineAreaState): TimelineEditorAreaState => ({
				timelineId: "0",
			}),
		},
	},
	[AreaType.NodeEditor]: {},
	[AreaType.Timeline]: {},
	[AreaType.Temp]: {},
	[AreaType.History]: {},
};
