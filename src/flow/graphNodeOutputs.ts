import * as mathjs from "mathjs";
import { Property } from "~/composition/compositionTypes";
import { LayerGraphsInfo } from "~/composition/layer/layerComputePropertiesOrder";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { computeNodeOutputsFromInputArgs } from "~/flow/flowComputeNode";
import { FlowNodeError } from "~/flow/FlowNodeError";
import { FlowNodeState } from "~/flow/flowNodeState";
import { ComputeFlowNodeResult, FlowNode, FlowNodeType } from "~/flow/flowTypes";
import { parseTypedValue } from "~/flow/flowValueConversion";
import { ValueType } from "~/types";

const resolvePropertyInputNode = (
	actionState: ActionState,
	node: FlowNode,
	propertyStore: PropertyStore,
): unknown[] => {
	const { compositionState } = actionState;
	const state = node.state as FlowNodeState<FlowNodeType.property_input>;

	if (!state.propertyId) {
		// The node has not selected a property.
		return [];
	}

	const property = compositionState.properties[state.propertyId];

	switch (property.type) {
		case "property":
			return [propertyStore.getRawPropertyValue(property.id)];
		case "compound": {
			if (property.properties.length !== 2) {
				throw new Error("Expected compound property to have 2 sub-properties.");
			}
			const [x, y] = property.properties.map((propertyId) =>
				propertyStore.getRawPropertyValue(propertyId),
			);
			return [Vec2.new(x, y), x, y];
		}
		case "group": {
			const result: unknown[] = [];
			property.properties.forEach((propertyId) => {
				const property = compositionState.properties[propertyId];
				switch (property.type) {
					case "compound": {
						const [x, y] = property.properties.map((propertyId) =>
							propertyStore.getRawPropertyValue(propertyId),
						);
						result.push(Vec2.new(x, y));
						break;
					}
					case "property": {
						result.push(propertyStore.getRawPropertyValue(property.id));
						break;
					}
				}
			});
			return result;
		}
		default:
			throw new Error(`Unexpected property type '${(property as Property).type}'`);
	}
};

export const getGraphNodeInputs = (
	type: "layer" | "array_modifier",
	actionState: ActionState,
	compositionId: string,
	propertyStore: PropertyStore,
	nodeOutputMap: Record<string, unknown[]>,
	arrayModifierGraphNodeOutputMap: Record<string, unknown[][]>,
	node: FlowNode,
	options: { frameIndex: number; arrayModifierIndex: number },
): unknown[] => {
	switch (node.type) {
		case FlowNodeType.array_modifier_index:
			return [options.arrayModifierIndex];
		case FlowNodeType.composition:
			const composition = actionState.compositionState.compositions[compositionId];
			return [composition.width, composition.height, options.frameIndex];
		case FlowNodeType.num_input:
			return [(node.state as FlowNodeState<FlowNodeType.num_input>).value];
		case FlowNodeType.color_input:
			return [(node.state as FlowNodeState<FlowNodeType.color_input>).color];
		case FlowNodeType.property_input:
			return resolvePropertyInputNode(actionState, node, propertyStore);
		default:
			return node.inputs.map((input) => {
				if (!input.pointer) {
					return input.value;
				}

				const outputNode = actionState.flowState.nodes[input.pointer.nodeId];
				const output = outputNode.outputs[input.pointer.outputIndex];

				const outputValues =
					type === "layer"
						? nodeOutputMap[input.pointer.nodeId]
						: arrayModifierGraphNodeOutputMap[input.pointer.nodeId][
								options.arrayModifierIndex
						  ];

				const value = outputValues[input.pointer.outputIndex];
				return parseTypedValue(output.type, input.type, value);
			});
	}
};

const resolveExpressionNodeOutputs = (
	node: FlowNode,
	inputs: unknown[],
	layerGraphs: LayerGraphsInfo,
): ComputeFlowNodeResult => {
	const { id: nodeId, graphId } = node;

	const scope = {
		...node.outputs.reduce<{ [key: string]: any }>((obj, output) => {
			obj[output.name] = null;
			return obj;
		}, {}),
		...node.inputs.reduce<{ [key: string]: any }>((obj, input, i) => {
			let v: any = inputs[i];
			if (v instanceof Vec2) {
				v = mathjs.matrix([v.x, v.y]);
			}
			obj[input.name] = v;
			return obj;
		}, {}),
	};

	const expression = layerGraphs.expressions[node.id];

	try {
		expression.evaluate(scope);
	} catch (e) {
		return {
			status: "error",
			errors: [e || new FlowNodeError("Expression evaluation failed", { graphId, nodeId })],
		};
	}

	const resolve = (res: any): [FlowNodeError | null, unknown] => {
		switch (mathjs.typeOf(res)) {
			case "Matrix": {
				const data = res._data as any[];
				for (let i = 0; i < data.length; i++) {
					if (mathjs.typeOf(data[i]) !== "number") {
						throw new Error("Matrices may only contain numbers.");
					}
				}
				return [null, data];
			}
			case "number":
				return [null, res];
			case "boolean":
			case "string":
			case "Object":
				return [null, res];
			default:
				return [
					new FlowNodeError(`Unknown type '${mathjs.typeOf(res)}'`, { graphId, nodeId }),
					null,
				];
		}
	};

	const results: unknown[] = [];
	const errors: FlowNodeError[] = [];

	for (const output of node.outputs) {
		const [error, value] = resolve(scope[output.name]);
		if (error) {
			errors.push(error);
			continue;
		}

		const parsed = parseTypedValue(ValueType.Any, output.type, value);

		if (typeof parsed === "undefined") {
			errors.push(
				new FlowNodeError(`Failed to compute '${output.name}' of type '${output.type}'.`, {
					nodeId,
					graphId,
				}),
			);
			continue;
		}

		results.push(parsed);
	}

	if (errors.length) {
		return { status: "error", errors };
	}
	return { status: "ok", results };
};

export const computeLayerGraphNodeOutputs = (
	node: FlowNode,
	inputs: unknown[],
	layerGraphs: LayerGraphsInfo,
): ComputeFlowNodeResult => {
	if (node.type === FlowNodeType.expr) {
		return resolveExpressionNodeOutputs(node, inputs, layerGraphs);
	}

	/**
	 * @todo Expect errors to potentially occur here.
	 */
	return { status: "ok", results: computeNodeOutputsFromInputArgs(node, inputs) };
};
