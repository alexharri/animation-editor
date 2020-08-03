import { compositionWorkspaceAreaActions } from "~/composition/workspace/compWorkspaceAreaReducer";
import { AreaType } from "~/constants";
import { createViewportWheelHandlers } from "~/shared/viewport/viewportWheelHandlers";

export const compWorkspaceHandlers = createViewportWheelHandlers(AreaType.NodeEditor, {
	setPan: compositionWorkspaceAreaActions.setPan,
	setScale: compositionWorkspaceAreaActions.setScale,
});
