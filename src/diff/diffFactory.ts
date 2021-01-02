import { Diff, DiffType } from "~/diff/diffs";
import { FlowNodeReference } from "~/flow/flowTypes";

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
	modifyMultipleLayerProperties: (propertyIds: string[]): Diff => {
		return { type: DiffType.ModifyMultipleLayerProperties, propertyIds };
	},
	togglePropertyAnimated: (propertyId: string): Diff => {
		return { type: DiffType.TogglePropertyAnimated, propertyId };
	},
	flowNodeState: (nodeRef: FlowNodeReference): Diff => {
		return { type: DiffType.FlowNodeState, nodeRef };
	},
	flowNodeExpression: (nodeRef: FlowNodeReference): Diff => {
		return { type: DiffType.FlowNodeExpression, nodeRef };
	},
	removeFlowNode: (nodeRef: FlowNodeReference): Diff => {
		return { type: DiffType.RemoveFlowNode, nodeRef };
	},
};
