import { Tool } from "~/constants";
import { RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { KeyboardShortcut } from "~/types";
import { workspaceOperations } from "~/workspace/workspaceOperations";

const workspaceShortcuts = {
	selectTool: (tool: Tool) => (_: string, params: RequestActionParams) => {
		const op = createOperation();
		workspaceOperations.selectTool(op, tool);

		params.dispatch(op.actions);
	},
};

export const workspaceKeyboardShortcuts: KeyboardShortcut[] = [
	{
		name: "Select move tool",
		key: "V",
		fn: workspaceShortcuts.selectTool(Tool.move),
		history: false,
	},
	{
		name: "Select pen tool",
		key: "P",
		fn: workspaceShortcuts.selectTool(Tool.pen),
		history: false,
	},
];
