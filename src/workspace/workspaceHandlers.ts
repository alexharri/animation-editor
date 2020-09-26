import { AreaType } from "~/constants";
import { createViewportWheelHandlers } from "~/shared/viewport/viewportWheelHandlers";
import { workspaceAreaActions } from "~/workspace/workspaceAreaReducer";

export const workspaceHandlers = {
	...createViewportWheelHandlers(AreaType.FlowEditor, {
		setPan: (pan) => workspaceAreaActions.setFields({ pan }),
		setScale: (scale) => workspaceAreaActions.setFields({ scale }),
	}),
};
