import { PropertyGroup } from "~/composition/compositionTypes";
import { getLayerArrayModifiers } from "~/composition/util/compositionPropertyUtils";
import { compileFlowGraph } from "~/flow/compileFlowGraph";
import { getLayerFlowGraphOrder } from "~/flow/flowGraphOrder";
import { CompiledFlow } from "~/flow/flowTypes";
import { CompositionError } from "~/types";

export function compileCompositionFlow(
	actionState: ActionState,
	compositionId: string,
): { status: "ok"; flow: CompiledFlow } | { status: "error"; errors: CompositionError[] } {
	const { compositionState } = actionState;

	const composition = compositionState.compositions[compositionId];

	const layerGraphIds: string[] = [];
	const arrayModifierGraphIds: string[] = [];

	for (const layerId of composition.layers) {
		const layer = compositionState.layers[layerId];
		layer.graphId && layerGraphIds.push(layer.graphId);

		for (const { modifierGroupId } of getLayerArrayModifiers(layerId, compositionState)) {
			const group = compositionState.properties[modifierGroupId] as PropertyGroup;
			group.graphId && arrayModifierGraphIds.push(group.graphId);
		}
	}

	const layerFlows = layerGraphIds.map((graphId) => compileFlowGraph(actionState, graphId));
	const arrayModifierFlows = arrayModifierGraphIds.map((graphId) =>
		compileFlowGraph(actionState, graphId),
	);

	const errors: CompositionError[] = [];
	for (const item of [...layerFlows, ...arrayModifierFlows]) {
		errors.push(...item.errors);
	}
	if (errors.length > 0) {
		return { status: "error", errors };
	}

	const compiledGraphMap: Record<string, CompiledFlow> = {};

	for (const [i, graphId] of layerGraphIds.entries()) {
		compiledGraphMap[graphId] = layerFlows[i].flow;
	}
	for (const [i, graphId] of arrayModifierGraphIds.entries()) {
		compiledGraphMap[graphId] = arrayModifierFlows[i].flow;
	}

	const toCompute = getLayerFlowGraphOrder(
		layerGraphIds,
		layerFlows.map((x) => x.flow),
	);

	const compositionFlow: CompiledFlow = {
		nodes: {},
		externals: {
			arrayModifierCount: {},
			arrayModifierIndex: [],
			frameIndex: [],
			propertyValue: {},
		},
		expressions: {},
		toCompute: [],
	};

	for (const graphId of [...toCompute, ...arrayModifierGraphIds]) {
		const compiled = compiledGraphMap[graphId];

		compositionFlow.nodes = { ...compositionFlow.nodes, ...compiled.nodes };
		compositionFlow.expressions = { ...compositionFlow.expressions, ...compiled.expressions };
		compositionFlow.externals.arrayModifierCount = {
			...compositionFlow.externals.arrayModifierCount,
			...compiled.externals.arrayModifierCount,
		};
		compositionFlow.externals.arrayModifierIndex = [
			...compositionFlow.externals.arrayModifierIndex,
			...compiled.externals.arrayModifierIndex,
		];
		compositionFlow.externals.frameIndex = [
			...compositionFlow.externals.frameIndex,
			...compiled.externals.frameIndex,
		];
		const keys = Object.keys(compiled.externals.propertyValue);
		for (const propertyId of keys) {
			if (!compositionFlow.externals.propertyValue[propertyId]) {
				compositionFlow.externals.propertyValue[propertyId] = [];
			}
			compositionFlow.externals.propertyValue[propertyId].push(
				...compiled.externals.propertyValue[propertyId],
			);
		}
		const len = compositionFlow.toCompute.length;
		for (const node of compiled.toCompute) {
			node.computeIndex += len;
		}
		compositionFlow.toCompute.push(...compiled.toCompute);

		// Resolve externals that have become internal by adding externals as node.next.
		for (const nodeId of Object.keys(compositionFlow.nodes)) {
			const node = compositionFlow.nodes[nodeId];

			for (const propertyId of node.affectedExternals.potentialPropertyIds) {
				const nextNodes = compositionFlow.externals.propertyValue[propertyId];
				for (const nextNode of nextNodes || []) {
					if (!node.next.includes(nextNode)) {
						node.next.push(nextNode);
					}
				}
			}
		}
	}

	return { status: "ok", flow: compositionFlow };
}
