import { areaInitialStates } from "~/area/state/areaInitialStates";
import { dragOpenArea } from "~/area/util/dragOpenArea";
import { AreaType } from "~/constants";
import { Area } from "~/types/areaTypes";

interface Options {
	compositionId: string;
}

export const dragProjectTimelineToArea = (e: React.MouseEvent, options: Options) => {
	const { compositionId } = options;

	const area: Area<AreaType.Timeline> = {
		type: AreaType.Timeline,
		state: { ...areaInitialStates[AreaType.Timeline], compositionId },
	};

	dragOpenArea(e, { area });
};
