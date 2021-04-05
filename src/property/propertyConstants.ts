import { PropertyName, ValueFormat } from "~/types";

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
