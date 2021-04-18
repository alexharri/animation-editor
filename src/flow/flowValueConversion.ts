import {
	FillRule,
	LineCap,
	LineJoin,
	OriginBehavior,
	RGBAColor,
	RGBColor,
	TransformBehavior,
	ValueType,
} from "~/types";
import { capToRange } from "~/util/math";

const toNumber: Partial<Record<ValueType, (value: unknown) => number | undefined>> = {
	[ValueType.Any]: (value) => {
		if (typeof value === "number") {
			return value;
		}
		const val = Number(value);
		if (!isNaN(val)) {
			return val;
		}
		return undefined;
	},
};

const isObjectWithXY = (value: object): value is { x: any; y: any } => {
	if ("x" in value && "y" in value) {
		return true;
	}
	return false;
};

const toVec2: Partial<Record<ValueType, (value: unknown) => Vec2 | undefined>> = {
	[ValueType.Any]: (value) => {
		const v = value;
		if (v instanceof Vec2) {
			return v;
		}
		if (typeof v === "number") {
			return Vec2.new(v, v);
		}
		if (typeof v !== "object" || !v) {
			return undefined;
		}

		let x: number | undefined;
		let y: number | undefined;

		if (Array.isArray(v)) {
			x = typeof v[0] === "number" ? v[0] : parseFloat(v[0]);
			y = typeof v[1] === "number" ? v[1] : parseFloat(v[1]);
		} else if (isObjectWithXY(v)) {
			x = typeof v.x === "number" ? v.x : parseFloat(v.x);
			y = typeof v.y === "number" ? v.y : parseFloat(v.y);
		}

		if (typeof x === "undefined" || typeof y === "undefined" || isNaN(x) || isNaN(y)) {
			return undefined;
		}

		return Vec2.new(x, y);
	},
	[ValueType.Number]: (value) => Vec2.new(value as number, value as number),
};

const isObjectWithRectProperties = (
	value: object,
): value is { left: any; top: any; width: any; height: any } => {
	if ("left" in value && "top" in value && "width" in value && "height" in value) {
		return true;
	}
	return false;
};

const toRect: Partial<Record<ValueType, (value: unknown) => Rect | undefined>> = {
	[ValueType.Any]: (value) => {
		const v = value;

		if (typeof v !== "object" || !v || !isObjectWithRectProperties(v)) {
			return undefined;
		}

		let left: number;
		let top: number;
		let width: number;
		let height: number;

		left = typeof v.left === "number" ? v.left : parseFloat(v.left);
		top = typeof v.top === "number" ? v.top : parseFloat(v.top);
		width = typeof v.width === "number" ? v.width : parseFloat(v.width);
		height = typeof v.height === "number" ? v.height : parseFloat(v.height);

		if (isNaN(left) || isNaN(top) || isNaN(width) || isNaN(height)) {
			return undefined;
		}

		return { left, top, width, height };
	},
};

const toRgbaColor: Partial<Record<ValueType, (value: unknown) => RGBAColor | undefined>> = {
	[ValueType.Any]: (value) => {
		if (Array.isArray(value)) {
			const [r, g, b, a] = value.map((n) => capToRange(0, 255, parseInt(n)));
			const color: RGBAColor = [r, g, b, a];

			for (let i = 0; i < color.length; i += 1) {
				if (isNaN(color[i])) {
					return undefined;
				}
			}

			return color;
		}

		return undefined;
	},
};

type ValueTypeToValue = {
	[ValueType.Any]: any;
	[ValueType.Number]: number;
	[ValueType.Vec2]: Vec2;
	[ValueType.Rect]: Rect;
	[ValueType.RGBAColor]: RGBAColor;
	[ValueType.FillRule]: FillRule;
	[ValueType.LineCap]: LineCap;
	[ValueType.LineJoin]: LineJoin;
	[ValueType.OriginBehavior]: OriginBehavior;
	[ValueType.Path]: string;
	[ValueType.TransformBehavior]: TransformBehavior;
	[ValueType.RGBColor]: RGBColor;
};

const valueTypeToConverter: {
	[T in ValueType]?: Partial<Record<ValueType, (value: unknown) => unknown | undefined>>;
} = {
	[ValueType.Number]: toNumber,
	[ValueType.Vec2]: toVec2,
	[ValueType.Rect]: toRect,
	[ValueType.RGBAColor]: toRgbaColor,
};

export const parseTypedValue = <
	To extends ValueType,
	T extends ValueTypeToValue[To] = ValueTypeToValue[To]
>(
	from: ValueType,
	to: To,
	value: unknown,
): T | undefined => {
	if (from === to) {
		return value as T;
	}

	if (to === ValueType.Any) {
		return value as T;
	}

	const converter = valueTypeToConverter[to]?.[from];
	if (converter) {
		return converter(value) as T;
	}
	return undefined;
};

const valueTypes = Object.values(ValueType);

const valueTypesThatCanConvertToMap = valueTypes.reduce<Record<ValueType, Set<ValueType>>>(
	(obj, valueType) => {
		const set = new Set<ValueType>([valueType, ValueType.Any]);
		const converters = valueTypeToConverter[valueType] || {};
		const keys = Object.keys(converters) as ValueType[];
		keys.forEach((key) => set.add(key));
		obj[valueType] = set;
		return obj;
	},
	{} as any,
);

const canConvertToValueTypesMap = valueTypes.reduce<Record<ValueType, Set<ValueType>>>(
	(obj, valueType) => {
		const set = new Set<ValueType>([valueType, ValueType.Any]);

		for (const vt of valueTypes) {
			const canConvertTo = valueTypesThatCanConvertToMap[vt];
			if (canConvertTo.has(valueType)) {
				set.add(vt);
			}
		}

		obj[valueType] = set;
		return obj;
	},
	{} as any,
);

export const getValueTypeCanConvertToValueTypes = (valueType: ValueType): Set<ValueType> => {
	return canConvertToValueTypesMap[valueType];
};

export const getValueTypesThatCanConvertToValueType = (valueType: ValueType): Set<ValueType> => {
	return valueTypesThatCanConvertToMap[valueType];
};
