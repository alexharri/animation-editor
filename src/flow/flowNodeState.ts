import { EXPR_TEXTAREA_HEIGHT_BUFFER, EXPR_TEXTAREA_MIN_HEIGHT } from "~/constants";
import { FlowNodeType } from "~/flow/flowTypes";
import { RGBAColor } from "~/types";

export const getFlowNodeDefaultState = <T extends FlowNodeType>(type: T): any => {
	switch (type) {
		case FlowNodeType.expr:
			return {
				expression: "",
				textareaHeight: EXPR_TEXTAREA_MIN_HEIGHT + EXPR_TEXTAREA_HEIGHT_BUFFER,
			} as FlowNodeStateMap["expr"];

		case FlowNodeType.num_input:
			return { value: 0, type: "value" };

		case FlowNodeType.color_input:
			return { color: [0, 0, 0, 1] } as FlowNodeState<FlowNodeType.color_input>;

		default:
			return {} as any;
	}
};

type FlowNodeStateMap = {
	[FlowNodeType.deg_to_rad]: {};
	[FlowNodeType.rad_to_deg]: {};
	[FlowNodeType.num_cap]: {};
	[FlowNodeType.num_lerp]: {};
	[FlowNodeType.num_input]: { value: number; type: "value" | "t_value" };
	[FlowNodeType.vec2_factors]: {};
	[FlowNodeType.vec2_lerp]: {};
	[FlowNodeType.vec2_add]: {};
	[FlowNodeType.vec2_input]: {};
	[FlowNodeType.empty]: {};
	[FlowNodeType.rect_translate]: {};
	[FlowNodeType.color_input]: { color: RGBAColor };
	[FlowNodeType.color_from_rgba_factors]: {};
	[FlowNodeType.color_to_rgba_factors]: {};
	[FlowNodeType.color_from_hsl_factors]: {};
	[FlowNodeType.color_to_hsl_factors]: {};
	[FlowNodeType.composition]: {};
	[FlowNodeType.array_modifier_index]: {};
	[FlowNodeType.property_input]: { layerId: string; propertyId: string };
	[FlowNodeType.property_output]: { propertyId: string };
	[FlowNodeType.expr]: {
		expression: string;
		textareaHeight: number;
	};
};
export type FlowNodeState<T extends FlowNodeType> = FlowNodeStateMap[T];
