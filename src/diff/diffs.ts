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
	ModifyLayer = 4,
	ResizeComposition = 5,
	ModifyCompositionView = 6,
	LayerTransform = 7,
}

/**
 * Composition width or height was modified
 */
export interface ResizeCompositionDiff extends _C {
	type: DiffType.ResizeComposition;
}
/**
 * Pan or Scale of composition was modified
 */
export interface ModifyCompositionViewDiff extends _C {
	type: DiffType.ModifyCompositionView;
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
export interface ModifyLayerDiff extends _L {
	type: DiffType.ModifyLayer;
}

export interface LayerTransformDiff extends _L {
	type: DiffType.LayerTransform;
}

export type Diff =
	| ResizeCompositionDiff
	| ModifyCompositionViewDiff
	| MoveLayerDiff
	| RemoveLayerDiff
	| AddLayerDiff
	| ModifyLayerDiff
	| LayerTransformDiff;
