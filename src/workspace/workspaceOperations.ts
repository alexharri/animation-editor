import { Tool } from "~/constants";
import { toolActions } from "~/toolbar/toolActions";
import { Operation } from "~/types";

const selectTool = (op: Operation, tool: Tool): void => {
	op.add(toolActions.setTool(tool));
	op.performDiff((diff) => diff.tool());
};

export const workspaceOperations = {
	selectTool,
};
