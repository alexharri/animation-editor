import * as mathjs from "mathjs";
import { Layer, Property } from "~/composition/compositionTypes";
import { forEachLayerProperty } from "~/composition/compositionUtils";
import { getCompositionPropertyGraphOrder } from "~/composition/layer/layerComputePropertiesOrder";
import { flowNodeArg } from "~/flow/flowArgs";
import { computeNodeOutputsFromInputArgs } from "~/flow/flowComputeNodeNew";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowComputeNodeArg, FlowNode, FlowNodeReference, FlowNodeType } from "~/flow/flowTypes";
import { getPropertyFlowNodeReferencedPropertyIds } from "~/flow/flowUtils";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";

export interface PropertyManager {
	addLayer: (layer: Layer, actionState: ActionState) => void;
	updateStructure: (actionState: ActionState) => void;
	getPropertyValue: (propertyId: string) => any;
	onPropertyIdsChanged: (propertyIds: string[], actionState: ActionState) => void;
	onNodeStateChange: (nodeRef: FlowNodeReference, actionState: ActionState) => void;
	onNodeExpressionChange: (nodeRef: FlowNodeReference, actionState: ActionState) => void;
	getPropertyIdsAffectedByNodes: (
		nodeRefs: FlowNodeReference[],
		actionState: ActionState,
	) => string[];
}

export const createPropertyManager = (
	compositionId: string,
	actionState: ActionState,
): PropertyManager => {
	let {
		nodeToIndex,
		nodeToNext,
		toCompute,
		expressions,
		propertyIdToAffectedInputNodes,
		propertyIdToAffectedOutputNodes,
	} = getCompositionPropertyGraphOrder(compositionId, actionState);
	let propertyValues: Record<string, any> = {};
	let computed: Record<string, FlowComputeNodeArg[]> = {};

	const reset = (actionState: ActionState) => {
		const result = getCompositionPropertyGraphOrder(compositionId, actionState);
		nodeToIndex = result.nodeToIndex;
		nodeToNext = result.nodeToNext;
		toCompute = result.toCompute;
		expressions = result.expressions;
		propertyIdToAffectedInputNodes = result.propertyIdToAffectedInputNodes;
		propertyIdToAffectedOutputNodes = result.propertyIdToAffectedOutputNodes;

		// Populate property values
		{
			const { compositionState, timelineState, timelineSelectionState } = actionState;
			const composition = compositionState.compositions[compositionId];
			for (const layerId of composition.layers) {
				const layer = compositionState.layers[layerId];
				forEachLayerProperty(layer.id, actionState.compositionState, (property) => {
					const composition = compositionState.compositions[property.compositionId];
					const value = property.timelineId
						? getTimelineValueAtIndex({
								timeline: timelineState[property.timelineId],
								selection: timelineSelectionState[property.timelineId],
								frameIndex: composition.frameIndex,
								layerIndex: layer.index,
						  })
						: property.value;
					propertyValues[property.id] = value;
				});
			}
		}

		for (const ref of toCompute) {
			computeNode(actionState, ref);
		}
	};

	const getNodeInputValues = (actionState: ActionState, node: FlowNode): FlowComputeNodeArg[] => {
		if (node.type === FlowNodeType.array_modifier_index) {
			return [flowNodeArg.number(-1)];
		}
		if (node.type === FlowNodeType.composition) {
			const composition = actionState.compositionState.compositions[compositionId];
			return [composition.width, composition.height, composition.frameIndex].map(
				flowNodeArg.number,
			);
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
			const property = compositionState.properties[state.propertyId];

			switch (property.type) {
				case "property":
					return [flowNodeArg.any(propertyValues[property.id])];
				case "compound": {
					if (property.properties.length !== 2) {
						throw new Error("Expected compound property to have 2 sub-properties.");
					}
					const [x, y] = property.properties.map(
						(propertyId) => propertyValues[propertyId],
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
								const [x, y] = property.properties.map(
									(propertyId) => propertyValues[propertyId],
								);
								result.push(flowNodeArg.vec2(Vec2.new(x, y)));
								break;
							}
							case "property": {
								result.push(flowNodeArg.any(propertyValues[property.id]));
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
				const outputs = computed[input.pointer.nodeId];
				return outputs[input.pointer.outputIndex];
			}
			return { type: input.type, value: input.value };
		});
	};

	const recomputePropertyValuesAffectedByNode = (
		node: FlowNode<FlowNodeType.property_output>,
		actionState: ActionState,
	) => {
		const { compositionState } = actionState;
		const state = node.state;
		const outputs = computed[node.id];
		const targetProperty = compositionState.properties[state.propertyId];

		let propertyIds: string[];

		if (targetProperty.type === "property") {
			propertyIds = [targetProperty.id];
		} else if (targetProperty.type === "compound") {
			const [xId, yId] = targetProperty.properties;
			propertyIds = [targetProperty.id, xId, yId];
		} else {
			propertyIds = targetProperty.properties.filter(
				(propertyId) => compositionState.properties[propertyId].type !== "group",
			);
		}

		for (let i = 0; i < node.inputs.length; i++) {
			const input = node.inputs[i];
			if (!input.pointer) {
				continue;
			}
			const { value } = outputs[i];
			const propertyId = propertyIds[i];
			const property = compositionState.properties[propertyId];

			if (property.type === "compound") {
				if (!(value instanceof Vec2)) {
					throw new Error("Expected compound property value to be Vec2");
				}

				const { x, y } = value;
				const [xId, yId] = property.properties;
				propertyValues[xId] = x;
				propertyValues[yId] = y;
			} else {
				propertyValues[propertyId] = value;
			}
		}
	};

	const computeNode = (
		actionState: ActionState,
		{
			nodeId,
			graphId,
		}: {
			graphId: string;
			nodeId: string;
		},
	) => {
		const graph = actionState.flowState.graphs[graphId];
		const node = graph.nodes[nodeId];
		const inputs = getNodeInputValues(actionState, node);
		let outputs: FlowComputeNodeArg[];

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

			const expression = expressions[node.id];
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

			outputs = node.outputs.map((output) => resolve(scope[output.name]));
		} else {
			outputs = computeNodeOutputsFromInputArgs(node.type, inputs);
		}

		computed[node.id] = outputs;

		if (node.type === FlowNodeType.property_output) {
			recomputePropertyValuesAffectedByNode(
				node as FlowNode<FlowNodeType.property_output>,
				actionState,
			);
		}
	};

	reset(actionState);

	const recomputeNodeRefs = (
		actionState: ActionState,
		nodeRefs: Array<{ nodeId: string; graphId: string }>,
	) => {
		const nodeIdToGraphId = nodeRefs.reduce<Record<string, string>>((acc, ref) => {
			acc[ref.nodeId] = ref.graphId;
			return acc;
		}, {});
		const nodeIdsToUpdate = new Set<string>();

		function dfs(ref: { nodeId: string; graphId: string }) {
			if (nodeIdsToUpdate.has(ref.nodeId)) {
				return;
			}
			nodeIdsToUpdate.add(ref.nodeId);
			nodeIdToGraphId[ref.nodeId] = ref.graphId;
			const next = nodeToNext[ref.nodeId];
			for (const ref of next) {
				dfs(ref);
			}
		}
		for (const ref of nodeRefs) {
			dfs(ref);
		}
		const toUpdate = [...nodeIdsToUpdate].sort((a, b) => nodeToIndex[a] - nodeToIndex[b]);
		for (const nodeId of toUpdate) {
			const graphId = nodeIdToGraphId[nodeId];
			computeNode(actionState, { nodeId, graphId });
		}
	};

	const getPropertyIdsAffectedByNodes = (
		nodeRefs: FlowNodeReference[],
		actionState: ActionState,
	): string[] => {
		const found = new Set<string>();
		const propertyIdSet = new Set<string>();

		function dfs(ref: { nodeId: string; graphId: string }) {
			if (found.has(ref.nodeId)) {
				return;
			}
			found.add(ref.nodeId);
			const next = nodeToNext[ref.nodeId];
			for (const ref of next) {
				dfs(ref);
			}

			const graph = actionState.flowState.graphs[ref.graphId];
			const node = graph.nodes[ref.nodeId];

			if (node.type === FlowNodeType.property_output) {
				const state = node.state as FlowNodeState<FlowNodeType.property_output>;
				const propertyIds = getPropertyFlowNodeReferencedPropertyIds(
					actionState.compositionState,
					state.propertyId,
				);
				propertyIds.forEach((propertyId) => propertyIdSet.add(propertyId));
			}
		}
		for (const ref of nodeRefs) {
			dfs(ref);
		}
		return [...propertyIdSet];
	};

	const self: PropertyManager = {
		addLayer: (layer, actionState) => {
			const { compositionState, timelineState, timelineSelectionState } = actionState;

			forEachLayerProperty(layer.id, actionState.compositionState, (property) => {
				const composition = compositionState.compositions[property.compositionId];
				const value = property.timelineId
					? getTimelineValueAtIndex({
							timeline: timelineState[property.timelineId],
							selection: timelineSelectionState[property.timelineId],
							frameIndex: composition.frameIndex,
							layerIndex: layer.index,
					  })
					: property.value;
				propertyValues[property.id] = value;
			});

			reset(actionState);
		},

		getPropertyValue: (propertyId) => propertyValues[propertyId],

		onPropertyIdsChanged: (propertyIds, actionState) => {
			const { compositionState, timelineState, timelineSelectionState } = actionState;
			for (const propertyId of propertyIds) {
				const property = compositionState.properties[propertyId] as Property;
				const layer = compositionState.layers[property.layerId];
				const composition = compositionState.compositions[property.compositionId];
				const value = property.timelineId
					? getTimelineValueAtIndex({
							timeline: timelineState[property.timelineId],
							selection: timelineSelectionState[property.timelineId],
							frameIndex: composition.frameIndex,
							layerIndex: layer.index,
					  })
					: property.value;
				propertyValues[property.id] = value;
			}
			const nodeRefs: Array<{ nodeId: string; graphId: string }> = [];
			for (const propertyId of propertyIds) {
				nodeRefs.push(...(propertyIdToAffectedInputNodes[propertyId] || []));
				nodeRefs.push(...(propertyIdToAffectedOutputNodes[propertyId] || []));
			}
			recomputeNodeRefs(actionState, nodeRefs);
		},

		onNodeStateChange: (nodeRef, actionState) => {
			recomputeNodeRefs(actionState, [nodeRef]);
		},

		onNodeExpressionChange: (nodeRef, actionState) => {
			const { nodeId, graphId } = nodeRef;
			const graph = actionState.flowState.graphs[graphId];
			const node = graph.nodes[nodeId] as FlowNode<FlowNodeType.expr>;
			const { expression } = node.state;
			expressions[node.id] = mathjs.compile(expression);
			self.onNodeStateChange(nodeRef, actionState);
		},

		getPropertyIdsAffectedByNodes: (nodeRefs, actionState) => {
			return getPropertyIdsAffectedByNodes(nodeRefs, actionState);
		},

		updateStructure: (actionState) => {
			reset(actionState);
		},
	};
	return self;
};
