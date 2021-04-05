interface _C {
	compositionId: string;
}
interface _L {
	layerIds: string[];
}
interface _P {
	propertyId: string;
}

export enum DiffType {
	RemoveLayer = 2,
	AddLayer = 3,
	Layer = 4,
	ModifyCompositionDimensions = 5,
	ModifyCompositionView = 6,
	ResizeAreas = 8,
	FrameIndex = 9,
	ModifyProperty = 10,
	PropertyStructure = 11,
	TogglePropertyAnimated = 12,
	ModifyMultipleLayerProperties = 13,
	FlowNodeState = 14,
	FlowNodeExpression = 15,
	UpdateNodeConnection = 17,
	AddFlowNode = 18,
	LayerParent = 19,
	LayerIndexOrLength = 20,
	ModifierOrder = 21,
	CompositionSelection = 22,
	MouseMove = 23,
	MouseOut = 24,
	Tool = 25,
}

/**
 * Pan or Scale of composition was modified
 */
export interface ModifyCompositionViewDiff extends _C {
	type: DiffType.ModifyCompositionView;
	scale: number;
}
/**
 * Composition width or height was modified
 */
export interface ModifyCompositionDimensions extends _C {
	type: DiffType.ModifyCompositionDimensions;
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

export interface ResizeAreasDiff {
	type: DiffType.ResizeAreas;
}

export interface FrameIndexDiff extends _C {
	type: DiffType.FrameIndex;
	compositionId: string;
	frameIndex: number;
}

export interface ModifyPropertyDiff extends _P {
	type: DiffType.ModifyProperty;
}

export interface TogglePropertyAnimatedDiff extends _P {
	type: DiffType.TogglePropertyAnimated;
}

export interface ModifyMultipleLayerPropertiesDiff {
	type: DiffType.ModifyMultipleLayerProperties;
	propertyIds: string[];
}

export interface FlowNodeStateDiff {
	type: DiffType.FlowNodeState;
	nodeId: string;
}

export interface FlowNodeExpressionDiff {
	type: DiffType.FlowNodeExpression;
	nodeId: string;
}

export interface AddFlowNodeDiff {
	type: DiffType.AddFlowNode;
	nodeId: string;
}

export interface UpdateNodeConnectionDiff {
	type: DiffType.UpdateNodeConnection;
	nodeIds: string[];
}

export interface LayerParentDiff {
	type: DiffType.LayerParent;
	layerId: string;
}

export interface LayerIndexOrLength {
	type: DiffType.LayerIndexOrLength;
	compositionId: string;
	frameIndex: number;
}

export interface PropertyStructureDiff {
	type: DiffType.PropertyStructure;
	layerId: string;
}

export interface ModifierOrderDiff {
	type: DiffType.ModifierOrder;
	layerId: string;
}

export interface CompositionSelectionDiff {
	type: DiffType.CompositionSelection;
	compositionId: string;
}

export interface MouseMoveDiff {
	type: DiffType.MouseMove;
	mousePosition: Vec2;
}

export interface MouseOutDiff {
	type: DiffType.MouseOut;
}

export interface ToolDiff {
	type: DiffType.Tool;
}

export type Diff =
	| ModifyCompositionDimensions
	| ModifyCompositionViewDiff
	| RemoveLayerDiff
	| AddLayerDiff
	| LayerDiff
	| ResizeAreasDiff
	| FrameIndexDiff
	| ModifyPropertyDiff
	| TogglePropertyAnimatedDiff
	| ModifyMultipleLayerPropertiesDiff
	| FlowNodeStateDiff
	| FlowNodeExpressionDiff
	| AddFlowNodeDiff
	| UpdateNodeConnectionDiff
	| LayerParentDiff
	| LayerIndexOrLength
	| PropertyStructureDiff
	| ModifierOrderDiff
	| CompositionSelectionDiff
	| MouseMoveDiff
	| MouseOutDiff
	| ToolDiff;
