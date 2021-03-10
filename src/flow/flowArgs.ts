import { FlowComputeNodeArg } from "~/flow/flowTypes";
import { RGBAColor, ValueType } from "~/types";

const createArgFn = (
	fn: (value: any) => FlowComputeNodeArg,
	valueTest: (value: any) => void,
): ((value: any) => FlowComputeNodeArg) => {
	return (value: any) => {
		valueTest(value);
		return fn(value);
	};
};

export const flowNodeArg = {
	number: createArgFn(
		(value: number) => ({
			type: ValueType.Number,
			value,
		}),
		(value) => {
			if (typeof value !== "number" || isNaN(value)) {
				throw new Error(`Value '${value}' is not a number.`);
			}
		},
	),
	vec2: createArgFn(
		(value: Vec2) => ({
			type: ValueType.Vec2,
			value,
		}),
		(value) => {
			if (!(value instanceof Vec2)) {
				throw new Error(`Value '${value}' is not a Vec2`);
			}
		},
	),
	rect: createArgFn(
		(value: Rect) => ({
			type: ValueType.Rect,
			value,
		}),
		(_) => {},
	),
	color: createArgFn(
		(value: RGBAColor) => ({
			type: ValueType.RGBAColor,
			value,
		}),
		(_) => {},
	),
	any: createArgFn(
		(value: any) => ({
			type: ValueType.Any,
			value,
		}),
		(value) => {
			if (typeof value === "undefined" || typeof value === null) {
				throw new Error(
					`Value of type 'any' may not be null or undefined. Got '${typeof value}'`,
				);
			}
		},
	),
};
