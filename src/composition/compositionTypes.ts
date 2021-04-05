import {
	CompoundPropertyName,
	KeySelectionMap,
	LayerType,
	PropertyGroupName,
	PropertyName,
} from "~/types";

export interface Composition {
	id: string;
	name: string;
	layers: string[];
	width: number;
	height: number;
	length: number;
	frameIndex: number; // Current time
}

export interface Layer {
	id: string;
	compositionId: string;
	graphId: string;
	type: LayerType;
	name: string;

	/**
	 * The frame which the layer is first rendered at.
	 */
	index: number;

	/**
	 * The number of frames that the layer is rendered for.
	 */
	length: number;

	/**
	 * The index of frame 0 of a composition layer. Only applies to composition layers.
	 *
	 * The `index` is not relative to this index, they are both absolute indices.
	 *
	 * ```
	 * playbackStartsAtIndex <= index
	 * ```
	 */
	playbackStartsAtIndex: number;

	/**
	 * The IDs of the top-level properties of the layer.
	 */
	properties: string[];
	collapsed: boolean;
	parentLayerId: string;
	viewProperties: string[];
}

export interface PropertyGroup {
	type: "group";
	name: PropertyGroupName;
	id: string;
	layerId: string;
	compositionId: string;
	properties: string[];
	collapsed: boolean;
	graphId: string; // Currently only ArrayModifier groups may have an associated graph
	viewProperties: string[];
}

export interface CompoundProperty {
	type: "compound";
	name: CompoundPropertyName;
	id: string;
	layerId: string;
	compositionId: string;
	properties: string[];
	separated: boolean;
	allowMaintainProportions: boolean;
	maintainProportions: boolean;
}

export type Property = {
	type: "property";
	id: string;
	layerId: string;
	compositionId: string;
	name: PropertyName;
	timelineId: string;
	compoundPropertyId: string;
	value: any;
};

export interface CreatePropertyOptions {
	createId: () => string;
	compositionId: string;
	layerId: string;
}

export interface CreateLayerPropertyGroup {
	group: PropertyGroup;
	properties: Array<Property | CompoundProperty | PropertyGroup>;
}

export interface CompositionSelection {
	layers: KeySelectionMap;
	properties: KeySelectionMap;
}
