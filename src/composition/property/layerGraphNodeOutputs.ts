import * as mathjs from "mathjs";
import { Property } from "~/composition/compositionTypes";
import { LayerGraphsInfo } from "~/composition/layer/layerComputePropertiesOrder";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { flowNodeArg } from "~/flow/flowArgs";
import { computeNodeOutputsFromInputArgs } from "~/flow/flowComputeNode";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowComputeNodeArg, FlowNode, FlowNodeType } from "~/flow/flowTypes";
import { parseTypedValue } from "~/flow/flowValueConversion";
import { ValueType } from "~/types";

export const getGraphNodeOutputs = (
	type: "layer" | "array_modifier",
	actionState: ActionState,
	compositionId: string,
	propertyStore: PropertyStore,
	nodeOutputMap: Record<string, FlowComputeNodeArg[]>,
	arrayModifierGraphNodeOutputMap: Record<string, FlowComputeNodeArg[][]>,
	node: FlowNode,
	options: { frameIndex: number; arrayModifierIndex: number },
): FlowComputeNodeArg[] => {
	if (node.type === FlowNodeType.array_modifier_index) {
		return [flowNodeArg.number(options.arrayModifierIndex)];
	}
	if (node.type === FlowNodeType.composition) {
		const composition = actionState.compositionState.compositions[compositionId];
		return [composition.width, composition.height, options.frameIndex].map(flowNodeArg.number);
	}
	if (node.type === FlowNodeType.num_input) {
		const state = node.state as FlowNodeState<FlowNodeType.num_input>;
		return [flowNodeArg.number(state.value)];
	}
	if (node.type === FlowNodeType.color_input) {
		const state = node.state as FlowNodeState<FlowNodeType.color_input>;
		return [flowNodeArg.color(state.color)];
	}
	if (node.type === FlowNodeType.property_input) {
		const { compositionState } = actionState;
		const state = node.state as FlowNodeState<FlowNodeType.property_input>;

		if (!state.propertyId) {
			// The node has not selected a property.
			return [];
		}

		const property = compositionState.properties[state.propertyId];

		switch (property.type) {
			case "property":
				return [flowNodeArg.any(propertyStore.getRawPropertyValue(property.id))];
			case "compound": {
				if (property.properties.length !== 2) {
					throw new Error("Expected compound property to have 2 sub-properties.");
				}
				const [x, y] = property.properties.map((propertyId) =>
					propertyStore.getRawPropertyValue(propertyId),
				);
				return [
					flowNodeArg.vec2(Vec2.new(x, y)),
					flowNodeArg.number(x),
					flowNodeArg.number(y),
				];
			}
			case "group": {
				const result: FlowComputeNodeArg[] = [];
				property.properties.forEach((propertyId) => {
					const property = compositionState.properties[propertyId];
					switch (property.type) {
						case "compound": {
							const [x, y] = property.properties.map((propertyId) =>
								propertyStore.getRawPropertyValue(propertyId),
							);
							result.push(flowNodeArg.vec2(Vec2.new(x, y)));
							break;
						}
						case "property": {
							result.push(
								flowNodeArg.any(propertyStore.getRawPropertyValue(property.id)),
							);
							break;
						}
					}
				});
				return result;
			}
			default:
				throw new Error(`Unexpected property type '${(property as Property).type}'`);
		}
	}

	return node.inputs.map((input) => {
		if (input.pointer) {
			const outputs =
				type === "layer"
					? nodeOutputMap[input.pointer.nodeId]
					: arrayModifierGraphNodeOutputMap[input.pointer.nodeId][
							options.arrayModifierIndex
					  ];

			return outputs[input.pointer.outputIndex];
		}
		return { type: input.type, value: input.value };
	});
};

export const computeLayerGraphNodeOutputs = (
	node: FlowNode,
	inputs: FlowComputeNodeArg[],
	layerGraphs: LayerGraphsInfo,
) => {
	if (node.type === FlowNodeType.expr) {
		const scope = {
			...node.outputs.reduce<{ [key: string]: any }>((obj, output) => {
				obj[output.name] = null;
				return obj;
			}, {}),
			...node.inputs.reduce<{ [key: string]: any }>((obj, input, i) => {
				let v: any = inputs[i].value;

				switch (inputs[i].type) {
					case ValueType.Vec2:
						v = mathjs.matrix([v.x, v.y]);
						break;
				}

				obj[input.name] = v;
				return obj;
			}, {}),
		};

		const expression = layerGraphs.expressions[node.id];
		expression.evaluate(scope);

		const resolve = (res: any): unknown => {
			switch (mathjs.typeOf(res)) {
				case "Matrix": {
					const data = res._data as any[];
					for (let i = 0; i < data.length; i++) {
						if (mathjs.typeOf(data[i]) !== "number") {
							throw new Error("Matrices may only contain numbers.");
						}
					}
					return data;
				}
				case "number":
					return res;
				case "boolean":
				case "string":
				case "Object":
					return res;
				default:
					throw new Error(`Unknown type '${mathjs.typeOf(res)}'`);
			}
		};

		return node.outputs.map((output) => {
			const value = resolve(scope[output.name]);

			const parsed = parseTypedValue(ValueType.Any, output.type, value);

			if (typeof parsed === "undefined") {
				switch (output.type) {
					case ValueType.Number:
						return flowNodeArg.number(0);
					case ValueType.Vec2:
						return flowNodeArg.vec2(Vec2.new(0, 0));
				}
			}

			switch (output.type) {
				case ValueType.Number:
					return flowNodeArg.number(parsed);
				case ValueType.Vec2:
					return flowNodeArg.vec2(parsed);
			}
		});
	}
	return computeNodeOutputsFromInputArgs(node.type, inputs);
};
