import { VectorEditor } from "~/vectorEditor/VectorEditor";
import { AreaType } from "~/constants";
import { NodeEditor } from "~/nodeEditor/NodeEditor";
import { nodeEditorAreaReducer } from "~/nodeEditor/nodeEditorAreaReducer";
import HistoryEditor from "~/historyEditor/HistoryEditor";

export const areaComponentRegistry = {
	[AreaType.VectorEditor]: VectorEditor,
	[AreaType.NodeEditor]: NodeEditor,
	[AreaType.History]: HistoryEditor,
	[AreaType.Temp]: () => <p>Test</p>,
};

export const areaStateReducerRegistry = {
	[AreaType.VectorEditor]: () => ({} as any),
	[AreaType.NodeEditor]: nodeEditorAreaReducer,
	[AreaType.History]: () => ({}),
	[AreaType.Temp]: () => ({} as any),
};
