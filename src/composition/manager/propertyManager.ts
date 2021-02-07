import * as mathjs from "mathjs";
import { Property } from "~/composition/compositionTypes";
import { forEachLayerProperty } from "~/composition/compositionUtils";
import { getCompositionPropertyGraphOrder } from "~/composition/layer/layerComputePropertiesOrder";
import { createPropertyInfoRegistry } from "~/composition/property/propertyInfoMap";
import { flowNodeArg } from "~/flow/flowArgs";
import { computeNodeOutputsFromInputArgs } from "~/flow/flowComputeNodeNew";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowComputeNodeArg, FlowNode, FlowNodeType } from "~/flow/flowTypes";
import { getFlowPropertyNodeReferencedPropertyIds } from "~/flow/flowUtils";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";
import { Performable } from "~/types";

type LayerPerformables = { layerId: string; performables: Performable[] };

export interface PropertyManager {
	addLayer: (actionState: ActionState) => void;
	removeLayer: (actionState: ActionState) => void;
	updateStructure: (actionState: ActionState) => void;
	getPropertyValue: (propertyId: string) => any;
	onPropertyIdsChanged: (
		propertyIds: string[],
		actionState: ActionState,
		frameIndex?: number,
	) => void;
	onFrameIndexChanged: (actionState: ActionState, frameIndex: number) => void;
	onNodeStateChange: (nodeId: string, actionState: ActionState) => void;
	onNodeExpressionChange: (nodeId: string, actionState: ActionState) => void;
	getPropertyIdsAffectedByFrameIndexInGraphByLayer: () => Record<string, string[]>;
	getActionsToPerform: (
		actionState: ActionState,
		options: {
			propertyIds?: string[];
			nodeIds?: string[];
		},
	) => Array<{ layerId: string; performables: Performable[] }>;
	getActionsToPerformOnFrameIndexChange: () => Array<LayerPerformables>;
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
		nodeIdsThatEmitFrameIndex,
	} = getCompositionPropertyGraphOrder(compositionId, actionState);
	let propertyValues: Record<string, any> = {};
	let computed: Record<string, FlowComputeNodeArg[]> = {};
	let pIdsAffectedByFrameViaGraphByLayer: Record<string, string[]> = {};
	let propertyInfo = createPropertyInfoRegistry(actionState, compositionId);

	const reset = (actionState: ActionState) => {
		const result = getCompositionPropertyGraphOrder(compositionId, actionState);
		propertyInfo = createPropertyInfoRegistry(actionState, compositionId);
		nodeToIndex = result.nodeToIndex;
		nodeToNext = result.nodeToNext;
		toCompute = result.toCompute;
		expressions = result.expressions;
		propertyIdToAffectedInputNodes = result.propertyIdToAffectedInputNodes;
		propertyIdToAffectedOutputNodes = result.propertyIdToAffectedOutputNodes;
		nodeIdsThatEmitFrameIndex = result.nodeIdsThatEmitFrameIndex;
		propertyValues = {};
		computed = {};

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

		for (const nodeId of toCompute) {
			const { frameIndex } = actionState.compositionState.compositions[compositionId];
			computeNode(actionState, nodeId, { frameIndex });
		}

		pIdsAffectedByFrameViaGraphByLayer = getPropertyIdsAffectedByNodes(
			nodeIdsThatEmitFrameIndex,
			actionState,
		).reduce<Record<string, string[]>>((acc, propertyId) => {
			const property = actionState.compositionState.properties[propertyId];
			if (!acc[property.layerId]) {
				acc[property.layerId] = [];
			}
			acc[property.layerId].push(property.id);
			return acc;
		}, {});
	};

	const getNodeInputValues = (
		actionState: ActionState,
		node: FlowNode,
		options: { frameIndex: number },
	): FlowComputeNodeArg[] => {
		if (node.type === FlowNodeType.array_modifier_index) {
			return [flowNodeArg.number(-1)];
		}
		if (node.type === FlowNodeType.composition) {
			const composition = actionState.compositionState.compositions[compositionId];
			return [composition.width, composition.height, options.frameIndex].map(
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

			if (!state.propertyId) {
				// The node has not selected a property.
				return [];
			}

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

		if (!state.propertyId) {
			// The node has not selected a property.
			return;
		}

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
			const propertyId = propertyIds[i];
			const property = compositionState.properties[propertyId];

			let { value } = outputs[i];

			if (property.type === "compound") {
				if (typeof value === "number") {
					// If the value provided to a compound property (Vec2) is a number
					// then we case it to Vec2(N, N).
					value = Vec2.new(value, value);
				}

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
		nodeId: string,
		options: { frameIndex: number },
	) => {
		const { flowState } = actionState;
		const node = flowState.nodes[nodeId];
		const inputs = getNodeInputValues(actionState, node, options);
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
		nodeIds: string[],
		options: { frameIndex?: number },
	) => {
		let frameIndex = options.frameIndex;

		if (typeof frameIndex === "undefined") {
			const composition = actionState.compositionState.compositions[compositionId];
			frameIndex = composition.frameIndex;
		}

		const nodeIdsToUpdate = new Set<string>();

		function dfs(nodeId: string) {
			if (nodeIdsToUpdate.has(nodeId)) {
				return;
			}
			nodeIdsToUpdate.add(nodeId);
			const next = nodeToNext[nodeId];
			for (const nodeId of next) {
				dfs(nodeId);
			}
		}
		for (const nodeId of nodeIds) {
			dfs(nodeId);
		}
		const toUpdate = [...nodeIdsToUpdate].sort((a, b) => nodeToIndex[a] - nodeToIndex[b]);
		for (const nodeId of toUpdate) {
			computeNode(actionState, nodeId, { frameIndex });
		}
	};

	function getPropertyIdsAffectedByNodes(nodeIds: string[], actionState: ActionState): string[] {
		const found = new Set<string>();
		const propertyIdSet = new Set<string>();

		function dfs(nodeId: string) {
			if (found.has(nodeId)) {
				return;
			}
			found.add(nodeId);
			const next = nodeToNext[nodeId];
			for (const nodeId of next) {
				dfs(nodeId);
			}

			const node = actionState.flowState.nodes[nodeId];
			if (node.type === FlowNodeType.property_output) {
				const state = node.state as FlowNodeState<FlowNodeType.property_output>;
				const propertyIds = getFlowPropertyNodeReferencedPropertyIds(
					actionState.compositionState,
					state.propertyId,
				);
				propertyIds.forEach((propertyId) => propertyIdSet.add(propertyId));
			}
		}
		for (const nodeId of nodeIds) {
			dfs(nodeId);
		}
		return [...propertyIdSet];
	}

	const self: PropertyManager = {
		addLayer: (actionState) => {
			reset(actionState);
		},

		removeLayer: (actionState) => {
			reset(actionState);
		},

		getPropertyValue: (propertyId) => propertyValues[propertyId],

		onPropertyIdsChanged: (propertyIds, actionState, frameIndex) => {
			const { compositionState, timelineState, timelineSelectionState } = actionState;
			for (const propertyId of propertyIds) {
				const property = compositionState.properties[propertyId] as Property;
				const layer = compositionState.layers[property.layerId];
				const composition = compositionState.compositions[layer.compositionId];
				const value = property.timelineId
					? getTimelineValueAtIndex({
							timeline: timelineState[property.timelineId],
							selection: timelineSelectionState[property.timelineId],
							frameIndex: frameIndex ?? composition.frameIndex,
							layerIndex: layer.index,
					  })
					: property.value;
				propertyValues[property.id] = value;
			}
			const nodeIds: string[] = [];
			for (const propertyId of propertyIds) {
				nodeIds.push(...(propertyIdToAffectedInputNodes[propertyId] || []));
				nodeIds.push(...(propertyIdToAffectedOutputNodes[propertyId] || []));
			}

			recomputeNodeRefs(actionState, nodeIds, { frameIndex });
		},

		onFrameIndexChanged: (actionState, frameIndex) => {
			const animatedPropertyIds = propertyInfo.getAnimatedPropertyIds();
			self.onPropertyIdsChanged(animatedPropertyIds, actionState, frameIndex);
			recomputeNodeRefs(actionState, nodeIdsThatEmitFrameIndex, { frameIndex });
		},

		onNodeStateChange: (nodeId, actionState) => {
			recomputeNodeRefs(actionState, [nodeId], {});
		},

		onNodeExpressionChange: (nodeId, actionState) => {
			// Get expression and update the expression map
			const node = actionState.flowState.nodes[nodeId] as FlowNode<FlowNodeType.expr>;
			expressions[node.id] = mathjs.compile(node.state.expression);

			// Recompute the expression node and subsequent nodes
			self.onNodeStateChange(nodeId, actionState);
		},

		updateStructure: (actionState) => {
			reset(actionState);
		},

		getPropertyIdsAffectedByFrameIndexInGraphByLayer: () => {
			return pIdsAffectedByFrameViaGraphByLayer;
		},

		getActionsToPerform: (actionState, options) => {
			const { compositionState } = actionState;
			const performablesByLayer: Record<string, Set<Performable>> = {};

			const propertyIds = [...(options.propertyIds || [])];

			if (options.nodeIds) {
				propertyIds.push(...getPropertyIdsAffectedByNodes(options.nodeIds, actionState));
			}

			for (const propertyId of propertyIds) {
				const property = compositionState.properties[propertyId];

				if (!performablesByLayer[property.layerId]) {
					performablesByLayer[property.layerId] = new Set();
				}

				performablesByLayer[property.layerId].add(
					propertyInfo.properties[propertyId].performable,
				);
			}

			const layerIds = Object.keys(performablesByLayer);
			for (const layerId of layerIds) {
				const performableSet = performablesByLayer[layerId];
				if (performableSet.has(Performable.UpdateTransform)) {
					performableSet.delete(Performable.UpdatePosition);
				}
			}

			return layerIds.map((layerId) => ({
				layerId,
				performables: [...performablesByLayer[layerId]],
			}));
		},

		getActionsToPerformOnFrameIndexChange: () => {
			const layerIds = [...propertyInfo.layerIdSet];

			const graph_pidsAffectedByFrameInGraphByLayer = self.getPropertyIdsAffectedByFrameIndexInGraphByLayer();

			const layerPerformables: LayerPerformables[] = [];
			for (const layerId of layerIds) {
				const allLayerPropertyIds = propertyInfo.propertyIdsByLayer[layerId];
				const performableSet = new Set<Performable>();

				for (const propertyId of allLayerPropertyIds) {
					const info = propertyInfo.properties[propertyId];
					if (info.isAnimated) {
						performableSet.add(info.performable);
					}
				}

				for (const propertyId of graph_pidsAffectedByFrameInGraphByLayer[layerId] || []) {
					const info = propertyInfo.properties[propertyId];
					performableSet.add(info.performable);
				}

				if (performableSet.has(Performable.UpdateTransform)) {
					performableSet.delete(Performable.UpdatePosition);
				}

				if (performableSet.size === 0) {
					continue;
				}

				const performables = [...performableSet];
				layerPerformables.push({ layerId, performables });
			}

			return layerPerformables;
		},
	};
	return self;
};
