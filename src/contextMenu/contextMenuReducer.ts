import { getType, ActionType } from "typesafe-actions";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";

type ContextMenuAction = ActionType<typeof contextMenuActions>;

export interface ContextMenuActionOption {
	label: string;
	onSelect: () => void;
	default?: boolean;
	icon?: React.ComponentType;
}

export interface ContextMenuListOption {
	label: string;
	options: ContextMenuOption[];
	default?: boolean;
	icon?: React.ComponentType;
}

export type ContextMenuOption = ContextMenuActionOption | ContextMenuListOption;

export interface ContextMenuState {
	name: string;
	isOpen: boolean;
	options: ContextMenuOption[];
	position: Vec2;
	close: (() => void) | null;
}

export const initialContextMenuState: ContextMenuState = {
	isOpen: false,
	name: "",
	options: [],
	position: Vec2.new(0, 0),
	close: null,
};

export const contextMenuReducer = (
	state: ContextMenuState,
	action: ContextMenuAction,
): ContextMenuState => {
	switch (action.type) {
		case getType(contextMenuActions.openContextMenu): {
			const { name, options, position, close } = action.payload;
			return {
				...state,
				isOpen: true,
				name,
				options,
				position,
				close,
			};
		}

		case getType(contextMenuActions.closeContextMenu): {
			return {
				...state,
				isOpen: false,
				name: "",
				options: [],
				position: Vec2.new(0, 0),
				close: null,
			};
		}

		default:
			return state;
	}
};
