import { DEG_TO_RAD_FAC, RAD_TO_DEG_FAC } from "~/constants";
import { flowNodeArg } from "~/flow/flowArgs";
import { FlowComputeNodeArg, FlowNodeType, FlowNodeType as Type } from "~/flow/flowTypes";
import { RGBAColor, ValueType } from "~/types";
import { capToRange, interpolate } from "~/util/math";

const parseNum = (arg: FlowComputeNodeArg): number => {
	switch (arg.type) {
		case ValueType.Number:
			return arg.value;
		case ValueType.Any: {
			const n = parseFloat(arg.value);
			if (isNaN(n)) {
				throw new Error("Unsuccessful conversion from Arg of type Any to Number");
			}
			return n;
		}
		default:
			throw new Error(`Unexpected Arg Type '${arg.type}'`);
	}
};

const parseColor = (arg: FlowComputeNodeArg): RGBAColor => {
	switch (arg.type) {
		case ValueType.RGBAColor:
			return arg.value;
		case ValueType.Any: {
			if (Array.isArray(arg.value)) {
				const [r, g, b, a] = arg.value.map((n) => capToRange(0, 255, parseInt(n)));
				const color: RGBAColor = [r, g, b, a];

				for (let i = 0; i < color.length; i += 1) {
					if (isNaN(color[i])) {
						throw new Error("Unsuccessful conversion from Arg of type Any to Number");
					}
				}

				return color;
			}

			throw new Error("Unsuccessful conversion from Arg of type Any to Number");
		}
		default:
			throw new Error(`Unexpected Arg Type '${arg.type}'`);
	}
};

const parseVec2 = (arg: FlowComputeNodeArg): Vec2 => {
	switch (arg.type) {
		case ValueType.Vec2:
			return arg.value;
		case ValueType.Number: {
			// Converting a number N to Vec2(N, N) is useful when, for
			// example, providing a number to the Scale field (which has
			// an X and Y scale).
			return Vec2.new(arg.value, arg.value);
		}
		case ValueType.Any: {
			const v = arg.value;

			if (typeof v !== "object") {
				throw new Error(`Vec2 must be object`);
			}

			let x: number;
			let y: number;

			if (Array.isArray(v)) {
				x = typeof v[0] === "number" ? v[0] : parseFloat(v[0]);
				y = typeof v[1] === "number" ? v[1] : parseFloat(v[1]);
			} else {
				x = typeof v.x === "number" ? v.x : parseFloat(v.x);
				y = typeof v.y === "number" ? v.y : parseFloat(v.y);
			}

			if (isNaN(x)) {
				throw new Error("Vec2 'x' cannot be converted to a number");
			}
			if (isNaN(y)) {
				throw new Error("Vec2 'y' cannot be converted to a number");
			}

			return Vec2.new(x, y);
		}
		default:
			throw new Error(`Unexpected Arg Type '${arg.type}'`);
	}
};

const parseRect = (arg: FlowComputeNodeArg): Rect => {
	switch (arg.type) {
		case ValueType.Rect:
			return arg.value;
		case ValueType.Any: {
			const v = arg.value;

			if (typeof v !== "object") {
				throw new Error("Rect must be object");
			}

			let left: number;
			let top: number;
			let width: number;
			let height: number;

			left = typeof v.left === "number" ? v.left : parseFloat(v.left);
			top = typeof v.top === "number" ? v.top : parseFloat(v.top);
			width = typeof v.width === "number" ? v.width : parseFloat(v.width);
			height = typeof v.height === "number" ? v.height : parseFloat(v.height);

			if (isNaN(left)) {
				throw new Error("Vec2 'left' cannot be converted to a number");
			}
			if (isNaN(top)) {
				throw new Error("Vec2 'top' cannot be converted to a number");
			}
			if (isNaN(width)) {
				throw new Error("Vec2 'width' cannot be converted to a number");
			}
			if (isNaN(height)) {
				throw new Error("Vec2 'height' cannot be converted to a number");
			}

			return { left, top, width, height };
		}
		default:
			throw new Error(`Unexpected Arg Type '${arg.type}'`);
	}
};

const parsers: Partial<Record<ValueType, (arg: FlowComputeNodeArg) => any>> = {
	[ValueType.Vec2]: parseVec2,
	[ValueType.Number]: parseNum,
	[ValueType.RGBAColor]: parseColor,
	[ValueType.Rect]: parseRect,
};

const computeFnMap: Record<Type, (args: FlowComputeNodeArg[]) => FlowComputeNodeArg[]> = {
	[Type.deg_to_rad]: (args) => {
		const deg = parseNum(args[0]);
		return [flowNodeArg.number(deg * DEG_TO_RAD_FAC)];
	},

	[Type.rad_to_deg]: (args) => {
		const deg = parseNum(args[0]);
		return [flowNodeArg.number(deg * RAD_TO_DEG_FAC)];
	},

	[Type.num_input]: (args) => args,

	[Type.num_cap]: (args) => {
		const value = parseNum(args[0]);
		const min = parseNum(args[1]);
		const max = parseNum(args[2]);
		return [flowNodeArg.number(Math.max(min, Math.min(max, value)))];
	},

	[Type.num_lerp]: (args) => {
		const a = parseNum(args[0]);
		const b = parseNum(args[1]);
		const t = parseNum(args[2]);
		return [flowNodeArg.number(interpolate(a, b, t))];
	},

	[Type.rect_translate]: (args) => {
		const rect = parseRect(args[0]);
		const vec2 = parseVec2(args[1]);
		return [
			flowNodeArg.rect({
				left: rect.left + vec2.x,
				top: rect.top + vec2.y,
				width: rect.width,
				height: rect.height,
			}),
		];
	},

	[Type.vec2_add]: (args) => {
		const a = parseVec2(args[0]);
		const b = parseVec2(args[1]);
		return [flowNodeArg.vec2(a.add(b))];
	},

	[Type.vec2_factors]: (args) => {
		const vec = parseVec2(args[0]);
		return [flowNodeArg.number(vec.x), flowNodeArg.number(vec.y)];
	},

	[Type.vec2_lerp]: (args) => {
		const a = parseVec2(args[0]);
		const b = parseVec2(args[1]);
		const t = parseNum(args[2]);
		return [flowNodeArg.vec2(a.lerp(b, t))];
	},

	[Type.vec2_input]: (args) => {
		const x = parseNum(args[0]);
		const y = parseNum(args[1]);
		return [flowNodeArg.vec2(Vec2.new(x, y))];
	},

	[Type.color_input]: (args) => args,

	[Type.color_from_rgba_factors]: (args) => {
		const [r, g, b, a] = args.map((x) => parseNum(x));
		return [flowNodeArg.color([r, g, b, a])];
	},

	[Type.color_to_rgba_factors]: (args) => {
		const color = parseColor(args[0]);
		return color.map((x) => flowNodeArg.number(x));
	},

	[Type.expr]: () => {
		throw new Error("Not implemented");
		// if (!ctx.expressionCache[node.id]) {
		// 	ctx.expressionCache[node.id] = mathjs.compile(state.expression);
		// }

		// const expression = ctx.expressionCache[node.id];

		// const scope = {
		// 	...node.outputs.reduce<{ [key: string]: any }>((obj, output) => {
		// 		obj[output.name] = null;
		// 		return obj;
		// 	}, {}),
		// 	...node.inputs.reduce<{ [key: string]: any }>((obj, input, i) => {
		// 		obj[input.name] = args[i].value;
		// 		return obj;
		// 	}, {}),
		// };

		// expression.evaluate(scope);

		// const resolve = (res: any): FlowComputeNodeArg => {
		// 	switch (mathjs.typeOf(res)) {
		// 		case "Matrix": {
		// 			const data = res._data as any[];
		// 			for (let i = 0; i < data.length; i++) {
		// 				if (mathjs.typeOf(data[i]) !== "number") {
		// 					throw new Error("Matrices may only contain numbers.");
		// 				}
		// 			}
		// 			return flowNodeArg.any(data);
		// 		}

		// 		case "number": {
		// 			return flowNodeArg.number(res);
		// 		}

		// 		case "boolean": {
		// 			return flowNodeArg.any(res);
		// 		}

		// 		case "string": {
		// 			return flowNodeArg.any(res);
		// 		}

		// 		case "Object": {
		// 			return flowNodeArg.any(res);
		// 		}

		// 		default:
		// 			throw new Error(`Unknown type '${mathjs.typeOf(res)}'`);
		// 	}
		// };

		// const outputs = node.outputs.map((output) => {
		// 	return resolve(scope[output.name]);
		// });

		// return outputs;
	},

	[Type.composition]: (args) => args,

	[Type.array_modifier_index]: (args) => args,

	[Type.property_input]: (args) => args,

	[Type.property_output]: (args) => args,

	[Type.empty]: () => [],
};

export const computeNodeOutputsFromInputArgs = (
	nodeType: FlowNodeType,
	args: FlowComputeNodeArg[],
): FlowComputeNodeArg[] => {
	return computeFnMap[nodeType](args);
};
