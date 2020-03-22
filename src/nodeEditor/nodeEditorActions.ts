import { createAction } from "typesafe-actions";
import { NodeEditorGraphAction } from "~/nodeEditor/nodeEditorGraphReducer";

export const nodeEditorActions = {
	dispatchToGraph: createAction("nodeEditor/DISPATCH_TO_GRAPH", resolve => {
		return (graphId: string, action: NodeEditorGraphAction) => resolve({ graphId, action });
	}),
};
