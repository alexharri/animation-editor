import { areaInitialStates } from "~/area/state/areaInitialStates";
import { dragOpenArea } from "~/area/util/dragOpenArea";
import { AreaType } from "~/constants";
import { Area } from "~/types/areaTypes";

interface Options {
	compositionId: string;
}

export const dragProjectWorkspaceToArea = (e: React.MouseEvent, options: Options) => {
	const { compositionId } = options;

	const area: Area<AreaType.Workspace> = {
		type: AreaType.Workspace,
		state: { ...areaInitialStates[AreaType.Workspace], compositionId },
	};
	dragOpenArea(e, { area });
};
