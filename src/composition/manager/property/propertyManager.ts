import { getArrayModifierGroupToCountId } from "~/composition/arrayModifier";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { getPropertyIdsPotentiallyAffectedByNodes } from "~/composition/property/getPropertyIdsAffectedByNodes";
import { createPropertyInfoRegistry } from "~/composition/property/propertyInfoMap";
import { updateRawValuesForPropertyIds } from "~/composition/property/propertyRawValues";
import {
	recomputePropertyValueArraysAffectedByNode,
	recomputePropertyValuesAffectedByNode,
} from "~/composition/property/recomputePropertyValuesAffectedByNode";
import { compileCompositionFlow } from "~/flow/compileCompositionFlowGraphs";
import { CompiledFlow, CompiledFlowNode, FlowNode, FlowNodeType } from "~/flow/flowTypes";
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
	getActionsToPerformOnFrameIndexChange: (actionState: ActionState) => LayerPerformables[];
	getErrors: () => CompositionError[];
}

export const createPropertyManager = (
	compositionId: string,
	actionState: ActionState,
): PropertyManager => {
	let compilationErrors: CompositionError[] = [];
	let runtimeErrors: CompositionError[] = [];

	let flow: CompiledFlow;
	let arrayModifierGroupToCountId!: Record<string, string>;
	const propertyStore = new PropertyStore(actionState, compositionId);
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
			const countPropertyId = arrayModifierGroupToCountId[graph.propertyId];
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

				const result = computeLayerGraphNodeOutputs(node, inputs, flow);
				if (result.status === "error") {
					runtimeErrors = result.errors;
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

		const inputs = getGraphNodeInputs(
			"layer",
			actionState,
			compositionId,
			propertyStore,
			layerGraphNodeOutputMap,
			arrayModifierGraphNodeOutputMap,
			node,
			{ frameIndex, arrayModifierIndex: -1 },
		);
		const result = computeLayerGraphNodeOutputs(node, inputs, flow);

		if (result.status === "error") {
			runtimeErrors = result.errors;
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

	const computeNodeList = (
		actionState: ActionState,
		toCompute: CompiledFlowNode[],
		frameIndex: number,
	) => {
		runtimeErrors = [];
		for (const compiledNode of toCompute) {
			const computedSuccessfully = computeNode(actionState, compiledNode.id, { frameIndex });
			if (!computedSuccessfully) {
				return;
			}
		}
	};

	const reset = (actionState: ActionState) => {
		compilationErrors = [];

		const flowResult = compileCompositionFlow(actionState, compositionId);

		if (flowResult.status === "error") {
			compilationErrors = flowResult.errors;
			return;
		}

		flow = flowResult.flow;
		arrayModifierGroupToCountId = getArrayModifierGroupToCountId(actionState, compositionId);
		propertyInfo = createPropertyInfoRegistry(actionState, compositionId);
		propertyStore.reset(actionState, compositionId);
		layerGraphNodeOutputMap = {};

		const { frameIndex } = actionState.compositionState.compositions[compositionId];
		computeNodeList(actionState, flow.toCompute, frameIndex);
	};

	reset(actionState);

	const recomputeNodeRefs = (
		actionState: ActionState,
		nodeIds: string[],
		options: { frameIndex?: number },
	) => {
		if (compilationErrors.length > 0) {
			runtimeErrors = [];
			return;
		}

		let frameIndex = options.frameIndex;

		if (typeof frameIndex === "undefined") {
			const composition = actionState.compositionState.compositions[compositionId];
			frameIndex = composition.frameIndex;
		}

		// If errors are present, we compute the entire graph from
		// start to finish.
		if (runtimeErrors.length > 0) {
			runtimeErrors = [];
			computeNodeList(actionState, flow.toCompute, frameIndex);
			return;
		}

		const nodeIdsToUpdate = new Set<string>();

		function dfs(nodeId: string) {
			if (nodeIdsToUpdate.has(nodeId)) {
				return;
			}
			nodeIdsToUpdate.add(nodeId);
			if (!flow.nodes[nodeId]) {
				console.log(nodeId, flow);
			}
			for (const next of flow.nodes[nodeId].next) {
				dfs(next.id);
			}
		}
		for (const nodeId of nodeIds) {
			dfs(nodeId);
		}
		const toCompute = [...nodeIdsToUpdate]
			.map((nodeId) => flow.nodes[nodeId])
			.sort((a, b) => a.computeIndex - b.computeIndex);
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

			if (compilationErrors.length > 0) {
				return;
			}

			const nodeIds: string[] = [];
			for (const propertyId of propertyIds) {
				const affected = flow.externals.propertyValue[propertyId];
				if (affected) {
					nodeIds.push(...affected.map((node) => node.id));
				}
			}

			recomputeNodeRefs(actionState, nodeIds, { frameIndex });
		},

		onFrameIndexChanged: (actionState, frameIndex) => {
			const animatedPropertyIds = propertyInfo.getAnimatedPropertyIds();
			self.onPropertyIdsChanged(animatedPropertyIds, actionState, frameIndex);

			if (compilationErrors.length > 0) {
				return;
			}

			recomputeNodeRefs(
				actionState,
				flow.externals.frameIndex.map((node) => node.id),
				{ frameIndex },
			);
		},

		onNodeStateChange: (nodeId, actionState) => {
			recomputeNodeRefs(actionState, [nodeId], {});
		},

		onNodeExpressionChange: (_nodeId, actionState) => {
			reset(actionState);
		},

		getActionsToPerform: (actionState, options) => {
			const { compositionState } = actionState;
			const performablesByLayer: Record<string, Set<Performable>> = {};

			const propertyIds = [...(options.propertyIds || [])];

			if (options.nodeIds && compilationErrors.length === 0) {
				propertyIds.push(
					...getPropertyIdsPotentiallyAffectedByNodes(
						options.nodeIds.map((nodeId) => flow.nodes[nodeId]),
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

		getActionsToPerformOnFrameIndexChange: (actionState) => {
			return self.getActionsToPerform(actionState, {
				nodeIds: flow.externals.frameIndex.map((node) => node.id),
			});
		},

		getErrors: () => (compilationErrors.length > 0 ? compilationErrors : runtimeErrors),
	};
	return self;
};
