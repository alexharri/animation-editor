import { Diff, DiffType } from "~/diff/diffs";

export type DiffFactoryFn = (factory: typeof diffFactory) => Diff;

export const diffFactory = {
	moveLayer: (layerIds: string[]): Diff => {
		return { type: DiffType.MoveLayer, layerIds };
	},
	layer: (...layerIds: string[]): Diff => {
		return { type: DiffType.ModifyLayer, layerIds };
	},
	compositionView: (compositionId: string): Diff => {
		return { type: DiffType.ModifyCompositionView, compositionId };
	},
	addLayer: (layerId: string): Diff => {
		return { type: DiffType.AddLayer, layerIds: [layerId] };
	},
	removeLayer: (layerId: string): Diff => {
		return { type: DiffType.RemoveLayer, layerIds: [layerId] };
	},
	modifyLayer: (layerId: string): Diff => {
		return { type: DiffType.ModifyLayer, layerIds: [layerId] };
	},
	layerTransform: (layerId: string): Diff => {
		return { type: DiffType.LayerTransform, layerIds: [layerId] };
	},
};
