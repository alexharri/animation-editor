import { NodeEditorNode, NodeEditorNodeState } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType, ValueType } from "~/types";
import { DEG_TO_RAD_FAC, RAD_TO_DEG_FAC } from "~/constants";
import { Composition, CompositionLayer, CompositionProperty } from "~/composition/compositionTypes";
import { TimelineState } from "~/timeline/timelineReducer";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";
import { interpolate } from "~/util/math";
import { getExpressionIO } from "~/util/math/expressions";
import * as mathjs from "mathjs";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";

const Type = NodeEditorNodeType;

export type ComputeNodeArg = {
	type: ValueType;
	value: any;
};

export interface ComputeNodeContext {
	computed: { [nodeId: string]: ComputeNodeArg[] };
	composition: Composition;
	layer: CompositionLayer;
	properties: CompositionProperty[];
	timelines: TimelineState;
	timelineSelection: TimelineSelectionState;
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

const toArg = {
	number: (value: number) => ({
		type: ValueType.Number,
		value,
	}),
	vec2: (value: Vec2) => ({
		type: ValueType.Vec2,
		value,
	}),
	rect: (value: Rect) => ({
		type: ValueType.Rect,
		value,
	}),
	any: (value: any) => ({
		type: ValueType.Any,
		value,
	}),
};

const compute: {
	[key in NodeEditorNodeType]: (
		args: ComputeNodeArg[],
		context: ComputeNodeContext,
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

	[Type.layer_transform_output]: (args) => {
		return args;
	},

	[Type.layer_transform_input]: (_, ctx) => {
		return ctx.properties.map((p) => {
			const value = p.timelineId
				? getTimelineValueAtIndex(
						ctx.composition.frameIndex,
						ctx.timelines[p.timelineId],
						ctx.timelineSelection[p.timelineId],
				  )
				: p.value;
			return toArg.number(value);
		});
	},

	[Type.num_input]: (_args, _ctx, state: NodeEditorNodeState<NodeEditorNodeType.num_input>) => {
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

	[Type.expr]: (args, _ctx, state: NodeEditorNodeState<NodeEditorNodeType.expr>) => {
		const expression = state.expression;
		const io = getExpressionIO(expression);

		const scope = io.inputs.reduce<{ [key: string]: number }>((obj, input, i) => {
			obj[input] = parseNum(args[i]);
			return obj;
		}, {});

		const res = mathjs.evaluate(expression, scope);

		(window as any).mathjs = mathjs;

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

		if (mathjs.typeOf(res) === "ResultSet") {
			return res.entries.map((item: any) => resolve(item));
		}

		return [resolve(res)];
	},

	[Type.empty]: () => {
		return [];
	},
};

export const computeNodeOutputArgs = (
	node: NodeEditorNode<NodeEditorNodeType>,
	ctx: ComputeNodeContext,
	mostRecentNode?: NodeEditorNode<NodeEditorNodeType>,
): ComputeNodeArg[] => {
	const inputs = node.inputs.map(({ pointer, type, value: _value }, i) => {
		const value = mostRecentNode?.inputs[i].value ?? _value;
		let defaultValue = { type, value };

		if (node.type === Type.layer_transform_output) {
			const p = ctx.properties[i];

			if (p.timelineId && !ctx.timelines[p.timelineId]) {
				// console.log(ctx, p);
			}

			defaultValue = {
				type,
				value: p.timelineId
					? getTimelineValueAtIndex(
							ctx.composition.frameIndex,
							ctx.timelines[p.timelineId],
							ctx.timelineSelection[p.timelineId],
					  )
					: p.value,
			};
		}

		if (!pointer || !ctx.computed[pointer.nodeId]) {
			return defaultValue;
		}

		return pointer ? ctx.computed[pointer.nodeId][pointer.outputIndex] : defaultValue;
	});
	return compute[node.type](inputs, ctx, mostRecentNode?.state || node.state);
};
