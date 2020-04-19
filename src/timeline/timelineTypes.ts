export interface Timeline {
	id: string;
	keyframes: TimelineKeyframe[];
	selection: {
		keyframes: {
			[keyframeId: string]: true;
		};
	};
	_yBounds: [number, number] | null;
	_yPan: number;
	_indexShift: number | null;
	_valueShift: number | null;
}

export interface TimelineKeyframeControlPoint {
	tx: number; // 0 - 1
	value: number; // Value relative to keyframe value
	relativeToDistance: number; // The distance at which the value is defined
}

export interface TimelineKeyframe {
	id: string;
	index: number;
	value: number;
	reflectControlPoints: boolean;
	controlPointLeft: TimelineKeyframeControlPoint | null;
	controlPointRight: TimelineKeyframeControlPoint | null;
}
