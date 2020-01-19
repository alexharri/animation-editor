import { createAction } from "typesafe-actions";
import { Tool } from "~/constants";

export const toolActions = {
	setTool: createAction("tool/SET", action => {
		return (tool: Tool) => action({ tool });
	}),

	setOpenGroupIndex: createAction("tool/SET_OPEN_GROUP_INDEX", action => {
		return (index: number) => action({ index });
	}),
};
