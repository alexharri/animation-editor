import { AreaType } from "~/constants";
import { createViewportWheelHandlers } from "~/shared/viewport/viewportWheelHandlers";
import { compositionWorkspaceAreaActions } from "~/workspace/workspaceAreaReducer";

export const workspaceHandlers = {
	...createViewportWheelHandlers(AreaType.NodeEditor, {
		setPan: compositionWorkspaceAreaActions.setPan,
		setScale: compositionWorkspaceAreaActions.setScale,
	}),
};
