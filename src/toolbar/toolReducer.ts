import { ActionType, getType } from "typesafe-actions";

import { Tool, toolGroups } from "~/constants";
import { toolActions } from "~/toolbar/toolActions";

type ToolAction = ActionType<typeof toolActions>;

export interface ToolState {
	selected: Tool;
	selectedInGroup: Array<Tool>;
	openGroupIndex: number;
}

export const initialToolState: ToolState = {
	selected: Tool.selection,
	selectedInGroup: toolGroups.map(group => group[0].tool),
	openGroupIndex: -1,
};

export const toolReducer = (state = initialToolState, action: ToolAction): ToolState => {
	switch (action.type) {
		case getType(toolActions.setTool): {
			const { tool } = action.payload;

			let toolGroupIndex = -1;

			for (let i = 0; i < toolGroups.length; i += 1) {
				if (toolGroups[i].map(item => item.tool).indexOf(tool) !== -1) {
					toolGroupIndex = i;
					break;
				}
			}

			return {
				...state,
				selected: tool,
				selectedInGroup: state.selectedInGroup.map((item, i) =>
					i !== toolGroupIndex ? item : tool,
				),
				openGroupIndex: -1,
			};
		}

		case getType(toolActions.setOpenGroupIndex): {
			const { index } = action.payload;

			return {
				...state,
				openGroupIndex: index,
			};
		}

		default:
			return state;
	}
};
