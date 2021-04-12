import { DEG_TO_RAD_FAC, RAD_TO_DEG_FAC } from "~/constants";
import { FlowNode, FlowNodeType as Type } from "~/flow/flowTypes";
import { RGBAColor } from "~/types";
import { interpolate } from "~/util/math";

const computeFnMap: Record<Type, (args: unknown[]) => unknown[]> = {
	[Type.deg_to_rad]: (args) => {
		const deg = args[0] as number;
		return [deg * DEG_TO_RAD_FAC];
	},
	[Type.rad_to_deg]: (args) => {
		const deg = args[0] as number;
		return [deg * RAD_TO_DEG_FAC];
	},
	[Type.num_input]: (args) => args,

	[Type.num_cap]: (args) => {
		const value = args[0] as number;
		const min = args[1] as number;
		const max = args[2] as number;
		return [Math.max(min, Math.min(max, value))];
	},

	[Type.num_lerp]: (args) => {
		const a = args[0] as number;
		const b = args[1] as number;
		const t = args[2] as number;
		return [interpolate(a, b, t)];
	},

	[Type.rect_translate]: (args) => {
		const rect = args[0] as Rect;
		const vec2 = args[1] as Vec2;
		return [
			{
				left: rect.left + vec2.x,
				top: rect.top + vec2.y,
				width: rect.width,
				height: rect.height,
			},
		];
	},

	[Type.vec2_add]: (args) => {
		const a = args[0] as Vec2;
		const b = args[1] as Vec2;
		return [a.add(b)];
	},

	[Type.vec2_factors]: (args) => {
		const vec = args[0] as Vec2;
		return [vec.x, vec.y];
	},

	[Type.vec2_lerp]: (args) => {
		const a = args[0] as Vec2;
		const b = args[1] as Vec2;
		const t = args[2] as number;
		return [a.lerp(b, t)];
	},

	[Type.vec2_input]: (args) => {
		const x = args[0] as number;
		const y = args[1] as number;
		return [Vec2.new(x, y)];
	},

	[Type.color_input]: (args) => args,

	[Type.color_from_rgba_factors]: (args) => {
		const rgba = args.map((x) => x) as RGBAColor;
		return [rgba];
	},

	[Type.color_to_rgba_factors]: (args) => {
		const rgba = args[0] as RGBAColor;
		return rgba;
	},

	[Type.expr]: () => {
		throw new Error("Should not be invoked");
	},

	[Type.composition]: (args) => args,

	[Type.array_modifier_index]: (args) => args,

	[Type.property_input]: (args) => args,

	[Type.property_output]: (args) => args,

	[Type.empty]: () => [],
};

export const computeNodeOutputsFromInputArgs = (node: FlowNode, args: unknown[]): unknown[] => {
	return computeFnMap[node.type](args);
};
