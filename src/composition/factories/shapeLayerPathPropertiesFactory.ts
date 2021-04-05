import {
	CompoundProperty,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { transformPropertiesFactory } from "~/composition/factories/transformPropertiesFactory";
import { FillRule, LineCap, LineJoin, PropertyGroupName, PropertyName, RGBAColor } from "~/types";

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
				value: fill,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.FillRule,
				value: fillRule,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.Opacity,
				value: fillOpacity,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
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
				value: strokeColor,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.StrokeWidth,
				value: strokeWidth,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.Opacity,
				value: 1,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.LineCap,
				value: lineCap,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.LineJoin,
				value: lineJoin,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
				compoundPropertyId: "",
			},
			{
				type: "property",
				name: PropertyName.MiterLimit,
				value: miterLimit,
				id: opts.createId(),
				compositionId,
				layerId,
				timelineId: "",
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
			value: pathId,
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
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
