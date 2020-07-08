import { createAction } from "typesafe-actions";
import { ContextMenuOption } from "~/contextMenu/contextMenuReducer";
import { OpenCustomContextMenuOptions } from "~/contextMenu/contextMenuTypes";

export const contextMenuActions = {
	openContextMenu: createAction("contextMenu/OPEN", (action) => {
		return (name: string, options: ContextMenuOption[], position: Vec2, close: () => void) =>
			action({ name, options, position, close });
	}),

	openCustomContextMenu: createAction("contextMenu/OPEN_CUSTOM", (action) => {
		return (options: OpenCustomContextMenuOptions) => action({ options });
	}),

	closeContextMenu: createAction("contextMenu/CLOSE", (action) => {
		return () => action({});
	}),
};
