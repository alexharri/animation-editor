import { CompositionRenderValues } from "~/types";

export interface CompWorkspaceLayerBaseProps {
	compositionId: string;
	layerId: string;
	map: CompositionRenderValues;
	index: number;
}
