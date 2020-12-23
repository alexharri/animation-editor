interface _C {
	compositionId: string;
}
interface _L {
	layerIds: string[];
}

export enum DiffType {
	MoveLayer = 0,
	RemoveLayer = 2,
	AddLayer = 3,
	Layer = 4,
	ModifyCompositionDimensions = 5,
	ModifyCompositionView = 6,
	LayerTransform = 7,
	ResizeAreas = 8,
}

/**
 * Pan or Scale of composition was modified
 */
export interface ModifyCompositionViewDiff extends _C {
	type: DiffType.ModifyCompositionView;
}
/**
 * Composition width or height was modified
 */
export interface ModifyCompositionDimensions extends _C {
	type: DiffType.ModifyCompositionDimensions;
}
/**
 * Layers within a composition were moved
 */
export interface MoveLayerDiff extends _L {
	type: DiffType.MoveLayer;
}
/**
 * Layer within composition was removed
 */
export interface RemoveLayerDiff extends _L {
	type: DiffType.RemoveLayer;
}
/**
 * Layer was added to a composition
 */
export interface AddLayerDiff extends _L {
	type: DiffType.AddLayer;
}
/**
 * A dependency of a layer was modified.
 *
 * This includes:
 *  - Properties
 *  - Shapes
 *  - Flows
 */
export interface LayerDiff extends _L {
	type: DiffType.Layer;
}

export interface LayerTransformDiff extends _L {
	type: DiffType.LayerTransform;
}

export interface ResizeAreasDiff {
	type: DiffType.ResizeAreas;
}

export type Diff =
	| ModifyCompositionDimensions
	| ModifyCompositionViewDiff
	| MoveLayerDiff
	| RemoveLayerDiff
	| AddLayerDiff
	| LayerDiff
	| LayerTransformDiff
	| ResizeAreasDiff;
