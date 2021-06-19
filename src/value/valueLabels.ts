import { ValueType } from "~/types";

const valueTypeToLabel: Record<ValueType, string> = {
	[ValueType.Number]: "Number",
	[ValueType.Vec2]: "Vec2",
	[ValueType.Rect]: "Rect",
	[ValueType.RGBAColor]: "RGBA Color",
	[ValueType.RGBColor]: "RGB Color",
	[ValueType.TransformBehavior]: "Transform Behavior",
	[ValueType.OriginBehavior]: "Origin Behavior",
	[ValueType.Path]: "Path",
	[ValueType.FillRule]: "Fill Rule",
	[ValueType.LineCap]: "Line Cap",
	[ValueType.LineJoin]: "Line Join",
	[ValueType.Any]: "Any",
};

const valueTypeToColor: Partial<Record<ValueType, string>> = {
	[ValueType.Number]: "#5189BD",
	[ValueType.Vec2]: "#56BA45",
	[ValueType.Rect]: "#F8C43E",
	[ValueType.RGBAColor]: "#EA3878",
	[ValueType.RGBColor]: "#EA3878",
	[ValueType.Any]: "#BEBEBE",
};

export const getValueTypeLabel = (valueType: ValueType): string => {
	return valueTypeToLabel[valueType];
};

export const getValueTypeColor = (valueType: ValueType): string => {
	return valueTypeToColor[valueType] ?? "#8780DD";
};
