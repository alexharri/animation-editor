import * as mathjs from "mathjs";
import { Property } from "~/composition/compositionTypes";
import { LayerGraphsInfo } from "~/composition/layer/layerComputePropertiesOrder";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { flowNodeArg } from "~/flow/flowArgs";
import { computeNodeOutputsFromInputArgs } from "~/flow/flowComputeNodeNew";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowComputeNodeArg, FlowNode, FlowNodeType } from "~/flow/flowTypes";

export const getLayerGraphNodeOutputs = (
	actionState: ActionState,
	compositionId: string,
	propertyStore: PropertyStore,
	nodeOutputMap: Record<string, FlowComputeNodeArg[]>,
	node: FlowNode,
	options: { frameIndex: number },
): FlowComputeNodeArg[] => {
	if (node.type === FlowNodeType.array_modifier_index) {
		return [flowNodeArg.number(-1)];
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
			const outputs = nodeOutputMap[input.pointer.nodeId];
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
				obj[input.name] = inputs[i].value;
				return obj;
			}, {}),
		};

		const expression = layerGraphs.expressions[node.id];
		expression.evaluate(scope);

		const resolve = (res: any): FlowComputeNodeArg => {
			switch (mathjs.typeOf(res)) {
				case "Matrix": {
					const data = res._data as any[];
					for (let i = 0; i < data.length; i++) {
						if (mathjs.typeOf(data[i]) !== "number") {
							throw new Error("Matrices may only contain numbers.");
						}
					}
					return flowNodeArg.any(data);
				}
				case "number":
					return flowNodeArg.number(res);
				case "boolean":
				case "string":
				case "Object":
					return flowNodeArg.any(res);
				default:
					throw new Error(`Unknown type '${mathjs.typeOf(res)}'`);
			}
		};

		return node.outputs.map((output) => resolve(scope[output.name]));
	}
	return computeNodeOutputsFromInputArgs(node.type, inputs);
};
