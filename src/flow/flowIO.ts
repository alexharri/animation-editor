import { FlowNodeInput, FlowNodeOutput, FlowNodeType } from "~/flow/flowTypes";
import { ValueType } from "~/types";

export const getFlowNodeDefaultInputs = (type: FlowNodeType): FlowNodeInput[] => {
	switch (type) {
		case FlowNodeType.num_input:
			return [];

		case FlowNodeType.num_cap:
			return [
				{
					type: ValueType.Number,
					name: "Value",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "Min",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "Max",
					value: 1,
					pointer: null,
				},
			];

		case FlowNodeType.num_lerp:
			return [
				{
					type: ValueType.Number,
					name: "Number A",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "Number B",
					value: 1,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "t",
					value: 0.5,
					pointer: null,
				},
			];

		case FlowNodeType.rad_to_deg:
			return [
				{
					type: ValueType.Number,
					name: "Radians",
					value: 0,
					pointer: null,
				},
			];

		case FlowNodeType.deg_to_rad:
			return [
				{
					type: ValueType.Number,
					name: "Degrees",
					value: 0,
					pointer: null,
				},
			];

		case FlowNodeType.vec2_factors:
			return [
				{
					type: ValueType.Vec2,
					name: "Vec2",
					value: Vec2.new(0, 0),
					pointer: null,
				},
			];

		case FlowNodeType.vec2_lerp:
			return [
				{
					type: ValueType.Vec2,
					name: "Vec2 A",
					value: Vec2.new(0, 0),
					pointer: null,
				},
				{
					type: ValueType.Vec2,
					name: "Vec2 B",
					value: Vec2.new(0, 0),
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "t",
					value: 0.5,
					pointer: null,
				},
			];

		case FlowNodeType.vec2_add:
			return [
				{
					type: ValueType.Vec2,
					name: "Vec2",
					value: Vec2.new(0, 0),
					pointer: null,
				},
				{
					type: ValueType.Vec2,
					name: "Vec2",
					value: Vec2.new(0, 0),
					pointer: null,
				},
			];

		case FlowNodeType.vec2_input:
			return [
				{
					type: ValueType.Number,
					name: "X",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "Y",
					value: 0,
					pointer: null,
				},
			];

		case FlowNodeType.rect_translate:
			return [
				{
					type: ValueType.Rect,
					name: "Input Rect",
					value: {
						height: 0,
						left: 0,
						top: 0,
						width: 0,
					},
					pointer: null,
				},
				{
					type: ValueType.Vec2,
					name: "Translation Vector",
					value: Vec2.new(0, 0),
					pointer: null,
				},
			];

		case FlowNodeType.color_input:
			return [];

		case FlowNodeType.color_from_rgba_factors:
			return [
				{
					type: ValueType.Number,
					name: "R",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "G",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "B",
					value: 0,
					pointer: null,
				},
				{
					type: ValueType.Number,
					name: "A",
					value: 1,
					pointer: null,
				},
			];

		case FlowNodeType.color_to_rgba_factors:
			return [
				{
					type: ValueType.RGBAColor,
					name: "Color",
					value: 0,
					pointer: null,
				},
			];

		case FlowNodeType.composition:
			return [];

		case FlowNodeType.array_modifier_index:
			return [];

		case FlowNodeType.property_input:
			return [];

		case FlowNodeType.property_output:
			return [];

		case FlowNodeType.expr:
			return [];

		case FlowNodeType.empty:
			return [];
	}
};

export const getFlowNodeDefaultOutputs = (type: FlowNodeType): FlowNodeOutput[] => {
	switch (type) {
		case FlowNodeType.deg_to_rad:
			return [
				{
					name: "Radians",
					type: ValueType.Number,
				},
			];

		case FlowNodeType.rad_to_deg:
			return [
				{
					name: "Degrees",
					type: ValueType.Number,
				},
			];

		case FlowNodeType.num_cap:
			return [
				{
					name: "Number",
					type: ValueType.Number,
				},
			];

		case FlowNodeType.num_input:
			return [
				{
					name: "Number",
					type: ValueType.Number,
				},
			];

		case FlowNodeType.num_lerp:
			return [
				{
					name: "Number",
					type: ValueType.Number,
				},
			];

		case FlowNodeType.vec2_factors:
			return [
				{
					name: "X",
					type: ValueType.Number,
				},
				{
					name: "Y",
					type: ValueType.Number,
				},
			];

		case FlowNodeType.vec2_lerp:
			return [
				{
					name: "Vec2",
					type: ValueType.Vec2,
				},
			];

		case FlowNodeType.vec2_add:
			return [
				{
					name: "Vector",
					type: ValueType.Vec2,
				},
			];

		case FlowNodeType.vec2_input:
			return [
				{
					name: "Vec2",
					type: ValueType.Vec2,
				},
			];

		case FlowNodeType.rect_translate:
			return [
				{
					name: "Rect",
					type: ValueType.Rect,
				},
			];

		case FlowNodeType.color_input:
			return [
				{
					type: ValueType.RGBAColor,
					name: "Color",
				},
			];
		case FlowNodeType.color_from_rgba_factors:
			return [
				{
					type: ValueType.RGBAColor,
					name: "Color",
				},
			];

		case FlowNodeType.color_to_rgba_factors:
			return [
				{
					type: ValueType.Number,
					name: "R",
				},
				{
					type: ValueType.Number,
					name: "G",
				},
				{
					type: ValueType.Number,
					name: "B",
				},
				{
					type: ValueType.Number,
					name: "A",
				},
			];

		case FlowNodeType.composition:
			return [
				{
					name: "Width",
					type: ValueType.Number,
				},
				{
					name: "Height",
					type: ValueType.Number,
				},
				{
					name: "Frame",
					type: ValueType.Number,
				},
			];

		case FlowNodeType.array_modifier_index:
			return [
				{
					name: "Index",
					type: ValueType.Number,
				},
			];

		case FlowNodeType.property_input:
			return [];

		case FlowNodeType.property_output:
			return [];

		case FlowNodeType.expr:
			return [];

		case FlowNodeType.empty:
			return [];
	}
};

export const flowValidInputsToOutputsMap: { [key in ValueType]: ValueType[] } = {
	[ValueType.Any]: [ValueType.Any, ValueType.Number, ValueType.Rect, ValueType.Vec2],
	[ValueType.Number]: [ValueType.Any, ValueType.Number],
	[ValueType.Rect]: [ValueType.Any, ValueType.Rect],
	[ValueType.Vec2]: [ValueType.Any, ValueType.Vec2],
	[ValueType.RGBAColor]: [ValueType.Any, ValueType.RGBAColor, ValueType.RGBColor],
	[ValueType.RGBColor]: [ValueType.Any, ValueType.RGBColor, ValueType.RGBAColor],
	[ValueType.TransformBehavior]: [ValueType.TransformBehavior],
	[ValueType.OriginBehavior]: [ValueType.OriginBehavior],
	[ValueType.LineCap]: [ValueType.LineCap],
	[ValueType.LineJoin]: [ValueType.LineJoin],
	[ValueType.FillRule]: [ValueType.FillRule],
	[ValueType.Path]: [ValueType.Path],
};
