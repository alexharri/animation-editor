import * as mathjs from "mathjs";
import { CompositionState } from "~/composition/compositionReducer";
import { DEG_TO_RAD_FAC, RAD_TO_DEG_FAC } from "~/constants";
import { NodeEditorNode, NodeEditorNodeState } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType, PropertyValueMap, RGBAColor, ValueType } from "~/types";
import { capToRange, interpolate } from "~/util/math";

const Type = NodeEditorNodeType;

export type ComputeNodeArg = {
	type: ValueType;
	value: any;
};

export interface ComputeNodeContext {
	computed: { [nodeId: string]: ComputeNodeArg[] };
	compositionState: CompositionState;
	compositionId: string;
	layerId: string;
	arrayModifierIndex: number;
	container: {
		width: number;
		height: number;
	};
	propertyToValue: PropertyValueMap;
	frameIndex: number;
	expressionCache: { [nodeId: string]: mathjs.EvalFunction };
}

const parseNum = (arg: ComputeNodeArg): number => {
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

const parseColor = (arg: ComputeNodeArg): RGBAColor => {
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

const parseVec2 = (arg: ComputeNodeArg): Vec2 => {
	switch (arg.type) {
		case ValueType.Vec2:
			return arg.value;
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

const parseRect = (arg: ComputeNodeArg): Rect => {
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

const createArgFn = (
	fn: (value: any) => ComputeNodeArg,
	valueTest: (value: any) => void,
): ((value: any) => ComputeNodeArg) => {
	return (value: any) => {
		valueTest(value);
		return fn(value);
	};
};

const toArg = {
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

const compute: {
	[key in NodeEditorNodeType]: (
		args: ComputeNodeArg[],
		context: ComputeNodeContext,
		node: NodeEditorNode<any>,
		state?: any,
	) => ComputeNodeArg[];
} = {
	[Type.deg_to_rad]: (args) => {
		const deg = parseNum(args[0]);
		return [toArg.number(deg * DEG_TO_RAD_FAC)];
	},

	[Type.rad_to_deg]: (args) => {
		const deg = parseNum(args[0]);
		return [toArg.number(deg * RAD_TO_DEG_FAC)];
	},

	[Type.num_input]: (
		_args,
		_ctx,
		_node,
		state: NodeEditorNodeState<NodeEditorNodeType.num_input>,
	) => {
		return [toArg.number(state.value)];
	},

	[Type.num_cap]: (args) => {
		const value = parseNum(args[0]);
		const min = parseNum(args[1]);
		const max = parseNum(args[2]);
		return [toArg.number(Math.max(min, Math.min(max, value)))];
	},

	[Type.num_lerp]: (args) => {
		const a = parseNum(args[0]);
		const b = parseNum(args[1]);
		const t = parseNum(args[2]);
		return [toArg.number(interpolate(a, b, t))];
	},

	[Type.rect_translate]: (args) => {
		const rect = parseRect(args[0]);
		const vec2 = parseVec2(args[1]);
		return [
			toArg.rect({
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
		return [toArg.vec2(a.add(b))];
	},

	[Type.vec2_factors]: (args) => {
		const vec = parseVec2(args[0]);
		return [toArg.number(vec.x), toArg.number(vec.y)];
	},

	[Type.vec2_lerp]: (args) => {
		const a = parseVec2(args[0]);
		const b = parseVec2(args[1]);
		const t = parseNum(args[2]);
		return [toArg.vec2(a.lerp(b, t))];
	},

	[Type.vec2_input]: (args) => {
		const x = parseNum(args[0]);
		const y = parseNum(args[1]);
		return [toArg.vec2(Vec2.new(x, y))];
	},

	[Type.color_input]: (
		_args,
		_ctx,
		_node,
		state: NodeEditorNodeState<NodeEditorNodeType.color_input>,
	) => {
		return [toArg.color(state.color)];
	},

	[Type.color_from_rgba_factors]: (args) => {
		const [r, g, b, a] = args.map((x) => parseNum(x));
		return [toArg.color([r, g, b, a])];
	},

	[Type.color_to_rgba_factors]: (args) => {
		const color = parseColor(args[0]);
		return color.map((x) => toArg.number(x));
	},

	[Type.expr]: (args, ctx, node, state: NodeEditorNodeState<NodeEditorNodeType.expr>) => {
		if (!ctx.expressionCache[node.id]) {
			ctx.expressionCache[node.id] = mathjs.compile(state.expression);
		}

		const expression = ctx.expressionCache[node.id];

		const scope = {
			...node.outputs.reduce<{ [key: string]: any }>((obj, output) => {
				obj[output.name] = null;
				return obj;
			}, {}),
			...node.inputs.reduce<{ [key: string]: any }>((obj, input, i) => {
				obj[input.name] = args[i].value;
				return obj;
			}, {}),
		};

		expression.evaluate(scope);

		const resolve = (res: any): ComputeNodeArg => {
			switch (mathjs.typeOf(res)) {
				case "Matrix": {
					const data = res._data as any[];
					for (let i = 0; i < data.length; i++) {
						if (mathjs.typeOf(data[i]) !== "number") {
							throw new Error("Matrices may only contain numbers.");
						}
					}
					return toArg.any(data);
				}

				case "number": {
					return toArg.number(res);
				}

				case "boolean": {
					return toArg.any(res);
				}

				case "string": {
					return toArg.any(res);
				}

				case "Object": {
					return toArg.any(res);
				}

				default:
					throw new Error(`Unknown type '${mathjs.typeOf(res)}'`);
			}
		};

		const outputs = node.outputs.map((output) => {
			return resolve(scope[output.name]);
		});

		return outputs;
	},

	/**
	 * Width, Height, Frame
	 */
	[Type.composition]: (_args, ctx) => {
		const { container, frameIndex } = ctx;

		return [
			toArg.number(container?.width ?? 150),
			toArg.number(container?.height ?? 150),
			toArg.number(frameIndex),
		];
	},

	[Type.array_modifier_index]: (_args, ctx) => {
		return [toArg.number(ctx.arrayModifierIndex)];
	},

	[Type.property_input]: (
		_args,
		ctx,
		_node,
		state: NodeEditorNodeState<NodeEditorNodeType.property_input>,
	) => {
		const { compositionState } = ctx;

		const selectedProperty = compositionState.properties[state.propertyId];

		if (!selectedProperty) {
			return [];
		}

		return (selectedProperty.type === "group"
			? selectedProperty.properties
					.filter(
						(propertyId) => compositionState.properties[propertyId].type === "property",
					)
					.map((propertyId) => ctx.propertyToValue[propertyId].computedValue)
			: [ctx.propertyToValue[selectedProperty.id].computedValue]
		).map((value) => toArg.number(value));
	},

	[Type.property_output]: (args) => {
		return args;
	},

	[Type.empty]: () => {
		return [];
	},
};

/**
 *
 * @returns an array representing the computed values of the node's
 * 			outputs according to the context
 */
export const computeNodeOutputArgs = (
	node: NodeEditorNode<NodeEditorNodeType>,
	ctx: ComputeNodeContext,
	mostRecentNode?: NodeEditorNode<NodeEditorNodeType>,
): ComputeNodeArg[] => {
	let nodeToUse = mostRecentNode;

	// Check whether or not we can make use of mostRecentNode
	nodeToUse: {
		if (!nodeToUse) {
			nodeToUse = node;
			break nodeToUse;
		}

		for (let i = 0; i < node.inputs.length; i += 1) {
			const a = node.inputs[i];
			const b = nodeToUse.inputs[i];

			if (!b || a.type !== b.type) {
				nodeToUse = node;
				break nodeToUse;
			}
		}

		for (let i = 0; i < node.outputs.length; i += 1) {
			const a = node.outputs[i];
			const b = nodeToUse.outputs[i];

			if (!b || a.type !== b.type) {
				nodeToUse = node;
				break nodeToUse;
			}
		}
	}

	const inputs = node.inputs.map(({ pointer, type, value: _value }, i) => {
		const value = nodeToUse?.inputs[i].value ?? _value;
		let defaultValue = { type, value };

		if (!pointer || !ctx.computed[pointer.nodeId]) {
			return defaultValue;
		}

		if (pointer) {
			const value = ctx.computed[pointer.nodeId][pointer.outputIndex];

			if (!value) {
				const msg =
					`Node '${pointer.nodeId}' did not produce the expected number of outputs.\n` +
					`\tPointer to index ${pointer.outputIndex} did not resolve to value.\n` +
					`\tNode produced ${ctx.computed[pointer.nodeId].length} outputs.\n`;
				console.log({ ctx });
				throw new Error(msg);
			}

			return value;
		}

		return defaultValue;
	});

	const result = compute[node.type](inputs, ctx, node, nodeToUse?.state || node.state);

	// Validate result
	if (!Array.isArray(result)) {
		console.log({ node, context: ctx, mostRecentNode, result });
		throw new Error(`Did not receive array of results from computing node.`);
	}

	for (let i = 0; i < result.length; i += 1) {
		if (!result[i]) {
			console.log({ node, context: ctx, mostRecentNode, result, i });
			throw new Error(`Falsy result item from computing node`);
		}

		const { type, value } = result[i];
		if (!type || typeof value === "undefined") {
			console.log({ node, context: ctx, mostRecentNode, result, i });
			throw new Error(`Invalid result item`);
		}
	}

	return result;
};
