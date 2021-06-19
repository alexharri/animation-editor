import React from "react";
import { FlowNodeType } from "~/flow/flowTypes";
import { CapNumberNode } from "~/flow/nodes/CapNumberNode";
import { ColorFromHSLNode } from "~/flow/nodes/color/ColorFromHSLNode";
import { ColorInputNode } from "~/flow/nodes/color/ColorInputNode";
import { DegToRadNode } from "~/flow/nodes/DegToRadNode";
import { ExpressionNode } from "~/flow/nodes/expression/ExpressionNode";
import { Node } from "~/flow/nodes/Node";
import { NumberInputNode } from "~/flow/nodes/NumberInputNode";
import { NumberLerpNode } from "~/flow/nodes/NumberLerpNode";
import { PropertyInputNode } from "~/flow/nodes/property/PropertyInputNode";
import { PropertyOutputNode } from "~/flow/nodes/property/PropertyOutputNode";
import { RadToDegNode } from "~/flow/nodes/RadToDegNode";
import { Vec2AddNode } from "~/flow/nodes/vec2/Vec2AddNode";
import { Vec2FactorsNode } from "~/flow/nodes/vec2/Vec2FactorsNode";
import { Vec2InputNode } from "~/flow/nodes/vec2/Vec2InputNode";
import { Vec2LerpNode } from "~/flow/nodes/vec2/Vec2LerpNode";

export const getFlowNodeComponent = (
	nodeType: FlowNodeType,
): React.ComponentType<{
	areaId: string;
	graphId: string;
	nodeId: string;
	zIndex: number;
}> => {
	switch (nodeType) {
		case FlowNodeType.expr:
			return ExpressionNode;
		case FlowNodeType.num_lerp:
			return NumberLerpNode;
		case FlowNodeType.property_input:
			return PropertyInputNode;
		case FlowNodeType.num_cap:
			return CapNumberNode;
		case FlowNodeType.property_output:
			return PropertyOutputNode;
		case FlowNodeType.color_input:
			return ColorInputNode;
		case FlowNodeType.num_input:
			return NumberInputNode;
		case FlowNodeType.deg_to_rad:
			return DegToRadNode;
		case FlowNodeType.rad_to_deg:
			return RadToDegNode;
		case FlowNodeType.vec2_add:
			return Vec2AddNode;
		case FlowNodeType.vec2_lerp:
			return Vec2LerpNode;
		case FlowNodeType.vec2_factors:
			return Vec2FactorsNode;
		case FlowNodeType.vec2_input:
			return Vec2InputNode;
		case FlowNodeType.color_from_hsl_factors:
			return ColorFromHSLNode;
		default:
			return Node;
	}
};
