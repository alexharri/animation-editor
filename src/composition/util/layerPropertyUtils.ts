import { CompositionLayerProperty } from "~/composition/compositionTypes";
import { ValueType } from "~/types";
import { TimelineColors } from "~/constants";

interface Options {
	createId: () => string;
	compositionId: string;
	layerId: string;
}

export const getDefaultLayerProperties = (opts: Options): CompositionLayerProperty[] => {
	const { compositionId, createId, layerId } = opts;

	return [
		{
			id: createId(),
			layerId,
			compositionId,
			name: "x",
			timelineId: "",
			label: "X Position",
			type: ValueType.Number,
			value: 0,
			color: TimelineColors.XPosition,
		},
		{
			id: createId(),
			layerId,
			compositionId,
			name: "y",
			timelineId: "",
			label: "Y Position",
			type: ValueType.Number,
			value: 0,
			color: TimelineColors.YPosition,
		},
		{
			id: createId(),
			layerId,
			compositionId,
			name: "width",
			timelineId: "",
			label: "Width",
			type: ValueType.Number,
			color: TimelineColors.Width,
			value: 100,
			min: 0,
		},
		{
			id: createId(),
			layerId,
			compositionId,
			name: "height",
			timelineId: "",
			label: "Height",
			type: ValueType.Number,
			color: TimelineColors.Height,
			value: 100,
			min: 0,
		},
	];
};
