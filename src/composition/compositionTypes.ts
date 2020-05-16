export interface Composition {
	id: string;
	layers: string[];
	width: number;
	height: number;
	length: number;
	frameIndex: number; // Current time
}

export interface CompositionLayer {
	id: string;
	type: "rect";
	name: string;
	index: number; // Index of first frame
	length: number; // Number of frames
	properties: string[];
}

export interface CompositionLayerProperty {
	id: string;
	label: string;
	name: string;
	type: "number";
	value: number;
	timelineId: string;
	min?: number;
	max?: number;
}
