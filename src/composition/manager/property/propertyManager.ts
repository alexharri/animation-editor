import * as mathjs from "mathjs";
import {
	LayerGraphsInfo,
	resolveCompositionLayerGraphs,
} from "~/composition/layer/layerComputePropertiesOrder";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { getPropertyIdsAffectedByNodes } from "~/composition/property/getPropertyIdsAffectedByNodes";
import { createPropertyInfoRegistry } from "~/composition/property/propertyInfoMap";
import { updateRawValuesForPropertyIds } from "~/composition/property/propertyRawValues";
import {
	recomputePropertyValueArraysAffectedByNode,
	recomputePropertyValuesAffectedByNode,
} from "~/composition/property/recomputePropertyValuesAffectedByNode";
import { FlowNode, FlowNodeType } from "~/flow/flowTypes";
import { computeLayerGraphNodeOutputs, getGraphNodeInputs } from "~/flow/graphNodeOutputs";
import { CompositionError, Performable } from "~/types";

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
	getErrors: () => CompositionError[];
}

export const createPropertyManager = (
	compositionId: string,
	actionState: ActionState,
): PropertyManager => {
	let errors: CompositionError[] = [];

	let layerGraphs!: LayerGraphsInfo;
	const propertyStore = new PropertyStore();
	let layerGraphNodeOutputMap: Record<string, unknown[]> = {};
	let arrayModifierGraphNodeOutputMap: Record<string, unknown[][]> = {};
	let propertyInfo = createPropertyInfoRegistry(actionState, compositionId);

	/**
	 * @returns true if computed successfully, false otherwise
	 */
	function computeNode(
		actionState: ActionState,
		nodeId: string,
		options: { frameIndex: number },
	): boolean {
		const { flowState } = actionState;
		const { frameIndex } = options;
		const node = flowState.nodes[nodeId];
		const graph = flowState.graphs[node.graphId];

		if (graph.type === "array_modifier_graph") {
			const countPropertyId = layerGraphs.arrayModifierGroupToCount[graph.propertyId];
			const count = propertyStore.getPropertyValue(countPropertyId);

			const resultsList: unknown[][] = [];

			for (let i = 0; i < count; i++) {
				const inputs = getGraphNodeInputs(
					"array_modifier",
					actionState,
					compositionId,
					propertyStore,
					layerGraphNodeOutputMap,
					arrayModifierGraphNodeOutputMap,
					node,
					{ frameIndex, arrayModifierIndex: i },
				);

				const result = computeLayerGraphNodeOutputs(node, inputs, layerGraphs);
				if (result.status === "error") {
					errors = result.errors;
					return false;
				}
				resultsList.push(result.results);
			}

			arrayModifierGraphNodeOutputMap[node.id] = resultsList;

			if (node.type === FlowNodeType.property_output) {
				recomputePropertyValueArraysAffectedByNode(
					node as FlowNode<FlowNodeType.property_output>,
					actionState,
					propertyStore,
					arrayModifierGraphNodeOutputMap,
				);
			}
			return true;
		}

		const outputs = getGraphNodeInputs(
			"layer",
			actionState,
			compositionId,
			propertyStore,
			layerGraphNodeOutputMap,
			arrayModifierGraphNodeOutputMap,
			node,
			{ frameIndex, arrayModifierIndex: -1 },
		);
		const result = computeLayerGraphNodeOutputs(node, outputs, layerGraphs);

		if (result.status === "error") {
			errors = result.errors;
			return false;
		}

		layerGraphNodeOutputMap[node.id] = result.results;

		if (node.type === FlowNodeType.property_output) {
			recomputePropertyValuesAffectedByNode(
				node as FlowNode<FlowNodeType.property_output>,
				actionState,
				propertyStore,
				layerGraphNodeOutputMap,
			);
		}
		return true;
	}

	const computeNodeList = (actionState: ActionState, toCompute: string[], frameIndex: number) => {
		errors = [];
		for (const nodeId of toCompute) {
			const computedSuccessfully = computeNode(actionState, nodeId, { frameIndex });
			if (!computedSuccessfully) {
				return;
			}
		}
	};

	const reset = (actionState: ActionState) => {
		const layerGraphsResult = resolveCompositionLayerGraphs(compositionId, actionState);

		if (layerGraphsResult.status === "error") {
			errors = layerGraphsResult.errors;
			return;
		}

		layerGraphs = layerGraphsResult.info;
		propertyInfo = createPropertyInfoRegistry(actionState, compositionId);
		propertyStore.reset(actionState, compositionId);
		layerGraphNodeOutputMap = {};

		const { frameIndex } = actionState.compositionState.compositions[compositionId];
		computeNodeList(actionState, layerGraphs.toCompute, frameIndex);
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

		// If errors are present, we compute the entire graph from
		// start to finish.
		if (errors.length > 0) {
			errors = [];
			computeNodeList(actionState, layerGraphs.toCompute, frameIndex);
			return;
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
		const toCompute = [...nodeIdsToUpdate].sort(layerGraphs.compareNodeIds);
		computeNodeList(actionState, toCompute, frameIndex);
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
						options.nodeIds,
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

				for (const propertyId of layerGraphs.propertyIdsAffectedByFrameIndexByLayer[
					layerId
				] || []) {
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

		getErrors: () => errors,
	};
	return self;
};
