import { PropertyName, ValueFormat, ValueType } from "~/types";

const propertyNameToMinValue: Partial<Record<string, number>> = {
	[PropertyName.Width]: 0,
	[PropertyName.Height]: 0,
	[PropertyName.InnerRadius]: 0,
	[PropertyName.OuterRadius]: 0,
	[PropertyName.StrokeWidth]: 0,
	[PropertyName.BorderRadius]: 0,
	[PropertyName.Opacity]: 0,
	[PropertyName.MiterLimit]: 1,
};

const propertyNameToMaxValue: Partial<Record<string, number>> = {
	[PropertyName.Opacity]: 1,
};

export function getPropertyMinValue(propertyName: PropertyName): number | undefined {
	return propertyNameToMinValue[propertyName];
}

export function getPropertyMaxValue(propertyName: PropertyName): number | undefined {
	return propertyNameToMaxValue[propertyName];
}

const propertyNameToValueFormat: Partial<Record<string, ValueFormat>> = {
	[PropertyName.Opacity]: ValueFormat.Percentage,
	[PropertyName.Rotation]: ValueFormat.Rotation,
};

export function getPropertyValueFormat(propertyName: PropertyName): number | undefined {
	return propertyNameToValueFormat[propertyName];
}

const propertyNameToTimelineColor: Partial<Record<string, string>> = {
	[PropertyName.PositionX]: "#FF3434",
	[PropertyName.PositionY]: "#5BE719",
	[PropertyName.Width]: "#32E8E8",
	[PropertyName.Height]: "#EE30F2",
};

export function getPropertyTimelineColor(propertyName: PropertyName): string {
	return propertyNameToTimelineColor[propertyName] || "#ffffff";
}

const propertyNameToValueType: Partial<Record<string, ValueType>> = {
	[PropertyName.AnchorX]: ValueType.Number,
	[PropertyName.AnchorY]: ValueType.Number,
	[PropertyName.ArrayModifier_Count]: ValueType.Number,
	[PropertyName.ArrayModifier_OriginBehavior]: ValueType.OriginBehavior,
	[PropertyName.ArrayModifier_OriginX]: ValueType.Number,
	[PropertyName.ArrayModifier_OriginY]: ValueType.Number,
	[PropertyName.ArrayModifier_RotationCorrection]: ValueType.Number,
	[PropertyName.ArrayModifier_TransformBehavior]: ValueType.TransformBehavior,
	[PropertyName.BorderRadius]: ValueType.Number,
	[PropertyName.Fill]: ValueType.RGBAColor,
	[PropertyName.FillRule]: ValueType.FillRule,
	[PropertyName.Height]: ValueType.Number,
	[PropertyName.InnerRadius]: ValueType.Number,
	[PropertyName.LineCap]: ValueType.LineCap,
	[PropertyName.LineJoin]: ValueType.LineJoin,
	[PropertyName.MiterLimit]: ValueType.Number,
	[PropertyName.Opacity]: ValueType.Number,
	[PropertyName.OuterRadius]: ValueType.Number,
	[PropertyName.PositionX]: ValueType.Number,
	[PropertyName.PositionY]: ValueType.Number,
	[PropertyName.RGBAColor]: ValueType.RGBAColor,
	[PropertyName.RGBColor]: ValueType.RGBColor,
	[PropertyName.Rotation]: ValueType.Number,
	[PropertyName.Scale]: ValueType.Number,
	[PropertyName.ScaleX]: ValueType.Number,
	[PropertyName.ScaleY]: ValueType.Number,
	[PropertyName.ShapeLayer_Path]: ValueType.Path,
	[PropertyName.StrokeColor]: ValueType.RGBAColor,
	[PropertyName.StrokeWidth]: ValueType.Number,
	[PropertyName.Width]: ValueType.Number,
};

export function getPropertyValueType(propertyName: PropertyName): ValueType {
	return propertyNameToValueType[propertyName] || ValueType.Any;
}
