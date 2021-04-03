import * as mathjs from "mathjs";
import { resolveCompositionLayerGraphs } from "~/composition/layer/layerComputePropertiesOrder";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { getPropertyIdsAffectedByNodes } from "~/composition/property/getPropertyIdsAffectedByNodes";
import {
	computeLayerGraphNodeOutputs,
	getLayerGraphNodeOutputs,
} from "~/composition/property/layerGraphNodeOutputs";
import { createPropertyInfoRegistry } from "~/composition/property/propertyInfoMap";
import { updateRawValuesForPropertyIds } from "~/composition/property/propertyRawValues";
import {
	recomputePropertyValueArraysAffectedByNode,
	recomputePropertyValuesAffectedByNode,
} from "~/composition/property/recomputePropertyValuesAffectedByNode";
import { FlowComputeNodeArg, FlowNode, FlowNodeType } from "~/flow/flowTypes";
import { Performable } from "~/types";

type LayerPerformables = { layerId: string; performables: Performable[] };

interface GetActionsToPerformOptions {
	layerIds?: string[];
	propertyIds?: string[];
	nodeIds?: string[];
}

export interface PropertyManager {
	addLayer: (actionState: ActionState) => void;
	removeLayer: (actionState: ActionState) => void;
	updateStructure: (actionState: ActionState) => void;
	store: PropertyStore;
	getPropertyValue: (propertyId: string) => any;
	onPropertyIdsChanged: (
		propertyIds: string[],
		actionState: ActionState,
		frameIndex?: number,
	) => void;
	onFrameIndexChanged: (actionState: ActionState, frameIndex: number) => void;
	onNodeStateChange: (nodeId: string, actionState: ActionState) => void;
	onNodeExpressionChange: (nodeId: string, actionState: ActionState) => void;
	getActionsToPerform: (
		actionState: ActionState,
		options: GetActionsToPerformOptions,
	) => LayerPerformables[];
	getActionsToPerformOnFrameIndexChange: () => LayerPerformables[];
}

export const createPropertyManager = (
	compositionId: string,
	actionState: ActionState,
): PropertyManager => {
	let layerGraphs = resolveCompositionLayerGraphs(compositionId, actionState);
	const propertyStore = new PropertyStore();
	let layerGraphNodeOutputMap: Record<string, FlowComputeNodeArg[]> = {};
	let arrayModifierGraphNodeOutputMap: Record<string, FlowComputeNodeArg[][]> = {};
	let pIdsAffectedByFrameViaGraphByLayer: Record<string, string[]> = {};
	let propertyInfo = createPropertyInfoRegistry(actionState, compositionId);

	function computeNode(
		actionState: ActionState,
		nodeId: string,
		options: { frameIndex: number },
	) {
		const { flowState } = actionState;
		const { frameIndex } = options;
		const node = flowState.nodes[nodeId];
		const graph = flowState.graphs[node.graphId];

		if (graph.type === "array_modifier_graph") {
			const countPropertyId = layerGraphs.arrayModifierGroupToCount[graph.propertyId];
			const count = propertyStore.getPropertyValue(countPropertyId);

			arrayModifierGraphNodeOutputMap[node.id] = Array.from({ length: count }).map((_, i) => {
				const inputs = getLayerGraphNodeOutputs(
					"array_modifier",
					actionState,
					compositionId,
					propertyStore,
					layerGraphNodeOutputMap,
					arrayModifierGraphNodeOutputMap,
					node,
					{ frameIndex, arrayModifierIndex: i },
				);
				return computeLayerGraphNodeOutputs(node, inputs, layerGraphs);
			});
			if (node.type === FlowNodeType.property_output) {
				recomputePropertyValueArraysAffectedByNode(
					node as FlowNode<FlowNodeType.property_output>,
					actionState,
					propertyStore,
					arrayModifierGraphNodeOutputMap,
				);
			}
			return;
		}

		const inputs = getLayerGraphNodeOutputs(
			"layer",
			actionState,
			compositionId,
			propertyStore,
			layerGraphNodeOutputMap,
			arrayModifierGraphNodeOutputMap,
			node,
			{ frameIndex, arrayModifierIndex: -1 },
		);
		layerGraphNodeOutputMap[node.id] = computeLayerGraphNodeOutputs(node, inputs, layerGraphs);

		if (node.type === FlowNodeType.property_output) {
			recomputePropertyValuesAffectedByNode(
				node as FlowNode<FlowNodeType.property_output>,
				actionState,
				propertyStore,
				layerGraphNodeOutputMap,
			);
		}
	}

	const reset = (actionState: ActionState) => {
		layerGraphs = resolveCompositionLayerGraphs(compositionId, actionState);
		propertyInfo = createPropertyInfoRegistry(actionState, compositionId);
		propertyStore.reset(actionState, compositionId);
		layerGraphNodeOutputMap = {};

		for (const nodeId of layerGraphs.toCompute) {
			const { frameIndex } = actionState.compositionState.compositions[compositionId];
			computeNode(actionState, nodeId, { frameIndex });
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
			const next = layerGraphs.nodeToNext[nodeId];
			for (const nodeId of next) {
				dfs(nodeId);
			}
		}
		for (const nodeId of nodeIds) {
			dfs(nodeId);
		}
		const toUpdate = [...nodeIdsToUpdate].sort(layerGraphs.compareNodeIds);
		for (const nodeId of toUpdate) {
			computeNode(actionState, nodeId, { frameIndex });
		}
	};

	const self: PropertyManager = {
		store: propertyStore,

		addLayer: (actionState) => reset(actionState),
		removeLayer: (actionState) => reset(actionState),
		updateStructure: (actionState) => reset(actionState),

		getPropertyValue: (propertyId) => propertyStore.getPropertyValue(propertyId),

		onPropertyIdsChanged: (propertyIds, actionState, frameIndex) => {
			updateRawValuesForPropertyIds(actionState, propertyIds, propertyStore, frameIndex);

			const nodeIds: string[] = [];
			for (const propertyId of propertyIds) {
				const affected = layerGraphs.propertyIdToAffectedInputNodes[propertyId];
				if (affected) {
					nodeIds.push(...affected);
				}
			}

			recomputeNodeRefs(actionState, nodeIds, { frameIndex });
		},

		onFrameIndexChanged: (actionState, frameIndex) => {
			const animatedPropertyIds = propertyInfo.getAnimatedPropertyIds();
			self.onPropertyIdsChanged(animatedPropertyIds, actionState, frameIndex);
			recomputeNodeRefs(actionState, layerGraphs.nodeIdsThatEmitFrameIndex, { frameIndex });
		},

		onNodeStateChange: (nodeId, actionState) => {
			recomputeNodeRefs(actionState, [nodeId], {});
		},

		onNodeExpressionChange: (nodeId, actionState) => {
			// Get expression and update the expression map
			const node = actionState.flowState.nodes[nodeId] as FlowNode<FlowNodeType.expr>;
			layerGraphs.expressions[node.id] = mathjs.compile(node.state.expression);

			// Recompute the expression node and subsequent nodes
			self.onNodeStateChange(nodeId, actionState);
		},

		getActionsToPerform: (actionState, options) => {
			const { compositionState } = actionState;
			const performablesByLayer: Record<string, Set<Performable>> = {};

			const propertyIds = [...(options.propertyIds || [])];

			if (options.nodeIds) {
				propertyIds.push(
					...getPropertyIdsAffectedByNodes(
						actionState,
						layerGraphs.nodeIdsThatEmitFrameIndex,
						layerGraphs.nodeToNext,
					),
				);
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

			for (const layerId of options.layerIds || []) {
				if (!performablesByLayer[layerId]) {
					performablesByLayer[layerId] = new Set();
				}
				performablesByLayer[layerId].add(Performable.DrawLayer);
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

				for (const propertyId of pIdsAffectedByFrameViaGraphByLayer[layerId] || []) {
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
