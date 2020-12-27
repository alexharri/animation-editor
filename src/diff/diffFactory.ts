import { Diff, DiffType, ModifyMultipleLayerPropertiesDiff } from "~/diff/diffs";

export type DiffFactoryFn = (factory: typeof diffFactory) => Diff;

export const diffFactory = {
	moveLayer: (layerIds: string[]): Diff => {
		return { type: DiffType.MoveLayer, layerIds };
	},
	layer: (...layerIds: string[]): Diff => {
		return { type: DiffType.Layer, layerIds };
	},
	compositionView: (compositionId: string): Diff => {
		return { type: DiffType.ModifyCompositionView, compositionId };
	},
	compositionDimensions: (compositionId: string): Diff => {
		return { type: DiffType.ModifyCompositionDimensions, compositionId };
	},
	addLayer: (layerId: string): Diff => {
		return { type: DiffType.AddLayer, layerIds: [layerId] };
	},
	removeLayer: (layerId: string): Diff => {
		return { type: DiffType.RemoveLayer, layerIds: [layerId] };
	},
	modifyLayer: (layerId: string): Diff => {
		return { type: DiffType.Layer, layerIds: [layerId] };
	},
	resizeAreas: (): Diff => {
		return { type: DiffType.ResizeAreas };
	},
	frameIndex: (compositionId: string): Diff => {
		return { type: DiffType.FrameIndex, compositionId };
	},
	modifyProperty: (propertyId: string): Diff => {
		return { type: DiffType.ModifyProperty, propertyId };
	},
	modifyMultipleLayerProperties: (
		modified: ModifyMultipleLayerPropertiesDiff["modified"],
	): Diff => {
		return { type: DiffType.ModifyMultipleLayerProperties, modified };
	},
	togglePropertyAnimated: (propertyId: string): Diff => {
		return { type: DiffType.TogglePropertyAnimated, propertyId };
	},
};
