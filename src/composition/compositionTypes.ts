import {
	ValueType,
	PropertyName,
	PropertyGroupName,
	ValueFormat,
	RGBColor,
	LayerType,
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

export interface CompositionLayer {
	id: string;
	compositionId: string;
	graphId: string;
	type: LayerType;
	name: string;
	index: number; // Index of first frame
	length: number; // Number of frames
	properties: string[];
}

export interface CompositionPropertyGroup {
	type: "group";
	name: PropertyGroupName;
	id: string;
	properties: string[];
	collapsed: boolean;
}

export type CompositionProperty = {
	type: "property";
	id: string;
	layerId: string;
	compositionId: string;
	name: PropertyName;
	valueFormat?: ValueFormat;
	timelineId: string;
	color?: string;
	min?: number;
	max?: number;
} & (
	| {
			valueType: ValueType.Any;
			value: any;
	  }
	| {
			valueType: ValueType.Color;
			value: RGBColor;
	  }
	| {
			valueType: ValueType.Number;
			value: number;
	  }
	| {
			valueType: ValueType.Rect;
			value: Rect;
	  }
	| {
			valueType: ValueType.Vec2;
			value: Vec2;
	  }
);

export interface PropertyToValueMap {
	[propertyId: string]: {
		rawValue: unknown;
		computedValue: unknown;
	};
}

export interface CreatePropertyOptions {
	createId: () => string;
	compositionId: string;
	layerId: string;
}

export interface CreateLayerPropertyGroup {
	group: CompositionPropertyGroup;
	properties: CompositionProperty[];
}
