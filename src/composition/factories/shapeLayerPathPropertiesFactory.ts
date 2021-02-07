import {
	CompoundProperty,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { transformPropertiesFactory } from "~/composition/factories/transformPropertiesFactory";
import { TimelineColors } from "~/constants";
import {
	FillRule,
	LineCap,
	LineJoin,
	PropertyGroupName,
	PropertyName,
	RGBAColor,
	ValueFormat,
	ValueType,
} from "~/types";

interface Options {
	fill: RGBAColor;
	fillOpacity: number;
	fillRule: FillRule;
	strokeColor: RGBAColor;
	strokeWidth: number;
	lineCap: LineCap;
	lineJoin: LineJoin;
	miterLimit: number;
}

export const createShapeLayerShapeGroup = (
	pathIdOrPathIds: string | string[],
	opts: CreatePropertyOptions,
	options?: Partial<Options>,
) => {
	const { compositionId, layerId } = opts;

	const {
		fill = [255, 0, 0, 1],
		fillOpacity = 1,
		strokeColor = [0, 0, 0, 1],
		strokeWidth = 1,
		fillRule = "nonzero",
		lineCap = "butt",
		miterLimit = 4,
		lineJoin = "miter",
	} = options || {};

	const shouldIncludeFill = options ? options.fill : true;
	const shouldIncludeStroke = options ? options.strokeColor : true;

	const propertyId = opts.createId();
	const propertiesToAdd: Array<Property | CompoundProperty | PropertyGroup> = [];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Shape,
		id: propertyId,
		layerId,
		compositionId,
		properties: [],
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};
	propertiesToAdd.push(group);

	if (shouldIncludeFill) {
		const fillProperties: Property[] = [
			{
				type: "property",
				name: PropertyName.RGBAColor,
				valueType: ValueType.RGBAColor,
				value: fill,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				color: TimelineColors.Height,
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.FillRule,
				valueType: ValueType.FillRule,
				value: fillRule,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				color: TimelineColors.Height,
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.Opacity,
				valueType: ValueType.Number,
				value: fillOpacity,
				min: 0,
				max: 1,
				valueFormat: ValueFormat.Percentage,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				color: TimelineColors.Height,
				compoundPropertyId: "",
			},
		];

		const fillGroup: PropertyGroup = {
			type: "group",
			name: PropertyGroupName.Fill,
			id: opts.createId(),
			layerId,
			compositionId,
			properties: fillProperties.map((p) => p.id),
			collapsed: true,
			graphId: "",
			viewProperties: [],
		};

		group.properties.push(fillGroup.id);
		propertiesToAdd.push(fillGroup, ...fillProperties);
	}

	if (shouldIncludeStroke) {
		const strokeProperties: Property[] = [
			{
				type: "property",
				name: PropertyName.RGBAColor,
				valueType: ValueType.RGBAColor,
				value: strokeColor,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				color: TimelineColors.Height,
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.StrokeWidth,
				valueType: ValueType.Number,
				value: strokeWidth,
				min: 0,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				color: TimelineColors.Height,
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.Opacity,
				valueType: ValueType.Number,
				value: 1,
				min: 0,
				max: 1,
				valueFormat: ValueFormat.Percentage,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				color: TimelineColors.Height,
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.LineCap,
				valueType: ValueType.LineCap,
				value: lineCap,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				color: TimelineColors.Height,
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.LineJoin,
				valueType: ValueType.LineJoin,
				value: lineJoin,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				color: TimelineColors.Height,
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.MiterLimit,
				valueType: ValueType.Number,
				value: miterLimit,
				min: 1,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				color: TimelineColors.Height,
				compoundPropertyId: "",
			},
		];

		const strokeGroup: PropertyGroup = {
			type: "group",
			name: PropertyGroupName.Stroke,
			id: opts.createId(),
			layerId,
			compositionId,
			properties: strokeProperties.map((p) => p.id),
			collapsed: true,
			graphId: "",
			viewProperties: [],
		};

		group.properties.push(strokeGroup.id);
		propertiesToAdd.push(strokeGroup, ...strokeProperties);
	}

	const pathIds = typeof pathIdOrPathIds === "string" ? [pathIdOrPathIds] : pathIdOrPathIds;

	let pathPropertyId!: string;

	for (let i = 0; i < pathIds.length; i++) {
		const pathId = pathIds[i];
		const path: Property = {
			type: "property",
			name: PropertyName.ShapeLayer_Path,
			valueType: ValueType.Path,
			value: pathId,
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			compoundPropertyId: "",
		};

		group.properties.push(path.id);
		propertiesToAdd.push(path);

		if (i === 0) {
			pathPropertyId = path.id;
		}
	}

	const transform = transformPropertiesFactory(opts);

	group.properties.push(transform.group.id);
	propertiesToAdd.push(transform.group, ...transform.properties);

	return { propertyId, pathPropertyId, propertiesToAdd };
};
