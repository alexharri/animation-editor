import { createAction } from "typesafe-actions";
import { ContextMenuOption } from "~/contextMenu/contextMenuReducer";

export const contextMenuActions = {
	openContextMenu: createAction("contextMenu/OPEN", action => {
		return (name: string, options: ContextMenuOption[], position: Vec2, close: () => void) =>
			action({ name, options, position, close });
	}),

	closeContextMenu: createAction("contextMenu/CLOSE", action => {
		return () => action({});
	}),
};
