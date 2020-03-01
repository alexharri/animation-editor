import { VectorEditor } from "~/vectorEditor/VectorEditor";
import { AreaWindow } from "~/constants";
import { NodeEditor } from "~/nodeEditor/NodeEditor";
import { nodeEditorAreaReducer } from "~/nodeEditor/nodeEditorAreaReducer";

export const areaComponentRegistry = {
	[AreaWindow.VectorEditor]: VectorEditor,
	[AreaWindow.NodeEditor]: NodeEditor,
	[AreaWindow.Temp]: () => <p>Test</p>,
};

export const areaStateReducerRegistry = {
	[AreaWindow.VectorEditor]: () => ({} as any),
	[AreaWindow.NodeEditor]: nodeEditorAreaReducer,
	[AreaWindow.Temp]: () => ({} as any),
};
