import { VectorEditor } from "~/vectorEditor/VectorEditor";
import { AreaType } from "~/constants";
import { NodeEditor } from "~/nodeEditor/NodeEditor";
import { nodeEditorAreaReducer } from "~/nodeEditor/nodeEditorAreaReducer";

export const areaComponentRegistry = {
	[AreaType.VectorEditor]: VectorEditor,
	[AreaType.NodeEditor]: NodeEditor,
	[AreaType.Temp]: () => <p>Test</p>,
};

export const areaStateReducerRegistry = {
	[AreaType.VectorEditor]: () => ({} as any),
	[AreaType.NodeEditor]: nodeEditorAreaReducer,
	[AreaType.Temp]: () => ({} as any),
};
