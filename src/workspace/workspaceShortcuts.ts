import { compositionKeyboardShortcuts } from "~/composition/compositionShortcuts";
import { Tool } from "~/constants";
import { RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { KeyboardShortcut } from "~/types";
import { workspaceOperations } from "~/workspace/workspaceOperations";

const workspaceShortcuts = {
	selectTool: (tool: Tool) => (_: string, params: RequestActionParams) => {
		const op = createOperation(params);
		workspaceOperations.selectTool(op, tool);
		op.submit();
	},
};

export const workspaceKeyboardShortcuts: KeyboardShortcut[] = [
	...compositionKeyboardShortcuts,
	{
		name: "Select move tool",
		key: "V",
		fn: workspaceShortcuts.selectTool(Tool.move),
		history: false,
	},
	{
		name: "Select pen tool",
		key: "G",
		fn: workspaceShortcuts.selectTool(Tool.pen),
		history: false,
	},
];
