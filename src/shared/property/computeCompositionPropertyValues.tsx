import React from "react";
import { CompositionProperty } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { reduceCompProperties } from "~/composition/timeline/compTimeUtils";
import { useActionState } from "~/hook/useActionState";
import {
	ComputeNodeArg,
	ComputeNodeContext,
	computeNodeOutputArgs,
} from "~/nodeEditor/graph/computeNode";
import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorState } from "~/nodeEditor/nodeEditorReducers";
import { TimelineState } from "~/timeline/timelineReducer";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";
import { LayerType, NodeEditorNodeType, PropertyValueMap } from "~/types";

interface Context {
	compositionId: string;
	compositionState: CompositionState;
	timelineState: TimelineState;
	timelineSelectionState: TimelineSelectionState;
	graphs: NodeEditorState["graphs"];
	frameIndex: number;
}

export const computeCompositionPropertyValues = (
	context: Context,
): {
	[propertyId: string]: {
		computedValue: any;
		rawValue: any;
	};
} => {
	const {
		compositionId,
		compositionState,
		timelineState,
		timelineSelectionState,
		frameIndex,
	} = context;
	const composition = compositionState.compositions[compositionId];

	const layerIdToFrameIndex: { [layerId: string]: number } = {};

	(function crawl(compositionId: string, index) {
		const composition = compositionState.compositions[compositionId];

		for (let i = 0; i < composition.layers.length; i += 1) {
			const layer = compositionState.layers[composition.layers[i]];

			layerIdToFrameIndex[layer.id] = frameIndex - index;

			if (layer.type === LayerType.Composition) {
				const id = compositionState.compositionLayerIdToComposition[layer.id];
				crawl(id, layer.index);
			}
		}
	})(compositionId, 0);

	const propertyToValue: PropertyValueMap = {};

	const properties = reduceCompProperties<CompositionProperty[]>(
		compositionId,
		compositionState,
		(acc, property) => {
			acc.push(property);
			return acc;
		},
		[],
	);

	for (const property of properties) {
		const layer = compositionState.layers[property.layerId];
		const frameIndex = layerIdToFrameIndex[layer.id];

		const rawValue = property.timelineId
			? getTimelineValueAtIndex({
					timeline: timelineState[property.timelineId],
					layerIndex: layer.index,
					frameIndex,
					selection: timelineSelectionState[property.timelineId],
			  })
			: property.value;

		propertyToValue[property.id] = {
			rawValue,
			computedValue: rawValue,
		};
	}

	const computed: { [nodeId: string]: ComputeNodeArg[] } = {};

	for (const layerId of composition.layers) {
		const layer = compositionState.layers[layerId];

		if (!layer.graphId) {
			continue;
		}

		const graph = context.graphs[layer.graphId];

		const outputNodes: NodeEditorNode<NodeEditorNodeType.property_output>[] = [];

		for (const key in graph.nodes) {
			const node = graph.nodes[key];

			if (node.type === NodeEditorNodeType.property_output) {
				outputNodes.push(node as NodeEditorNode<NodeEditorNodeType.property_output>);
			}
		}

		if (!outputNodes.length) {
			continue;
		}

		const visitedNodes = new Set<string>();
		const toCompute: string[] = [];

		function dfs(node: NodeEditorNode<any>) {
			if (visitedNodes.has(node.id)) {
				return;
			}

			visitedNodes.add(node.id);

			for (const input of node.inputs) {
				if (input.pointer) {
					dfs(graph.nodes[input.pointer.nodeId]);
				}
			}

			toCompute.push(node.id);
		}

		for (const outputNode of outputNodes) {
			dfs(outputNode);
		}

		const ctx: ComputeNodeContext = {
			compositionId,
			compositionState,
			computed,
			layerId,
			layerIdToFrameIndex,
			propertyToValue,
		};

		for (const nodeId of toCompute) {
			const node = graph.nodes[nodeId];
			computed[node.id] = computeNodeOutputArgs(node, ctx);
		}

		for (const outputNode of outputNodes) {
			const selectedProperty = compositionState.properties[outputNode.state.propertyId];

			// No property has been selected, the node does not affect
			// the output
			if (!selectedProperty) {
				continue;
			}

			const properties =
				selectedProperty.type === "group"
					? selectedProperty.properties
							.map((id) => context.compositionState.properties[id])
							.filter(
								(property): property is CompositionProperty =>
									property.type === "property",
							)
					: [selectedProperty];

			for (let j = 0; j < properties.length; j += 1) {
				const property = properties[j];

				// Do not modify the property:value map if the input does not have
				// a pointer.
				//
				// This allows us to, for example, have two property_output nodes that
				// both reference Transform but modify different properties of the
				// Transform group.
				if (!outputNode.inputs[j].pointer) {
					continue;
				}

				propertyToValue[property.id].computedValue = computed[outputNode.id][j].value;
			}
		}
	}

	return propertyToValue;
};

export const computeCompPropertyValues = (state: ActionState, compositionId: string) => {
	const context: Context = {
		compositionId,
		compositionState: state.compositionState,
		graphs: state.nodeEditor.graphs,
		timelineSelectionState: state.timelineSelection,
		timelineState: state.timelines,
		frameIndex: state.compositionState.compositions[compositionId].frameIndex,
	};

	return computeCompositionPropertyValues(context);
};

export const CompositionPropertyValuesContext = React.createContext<PropertyValueMap>({});

export const CompositionPropertyValuesProvider: React.FC<{ compositionId: string }> = ({
	children,
	compositionId,
}) => {
	const propertyToValue = useActionState((state) => {
		return computeCompPropertyValues(state, compositionId);
	});

	return (
		<CompositionPropertyValuesContext.Provider value={propertyToValue}>
			{children}
		</CompositionPropertyValuesContext.Provider>
	);
};
