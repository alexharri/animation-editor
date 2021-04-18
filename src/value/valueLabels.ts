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

export const getValueTypeLabel = (valueType: ValueType): string => {
	return valueTypeToLabel[valueType];
};
