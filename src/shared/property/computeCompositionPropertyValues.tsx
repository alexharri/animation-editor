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
	container: {
		width: number;
		height: number;
	};
	timelineState: TimelineState;
	timelineSelectionState: TimelineSelectionState;
	graphs: NodeEditorState["graphs"];
	frameIndex: number;
}

export const _compute = (context: Context): PropertyValueMap => {
	try {
		const {
			compositionId,
			compositionState,
			container,
			timelineState,
			timelineSelectionState,
			frameIndex,
		} = context;

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
			{ recursive: true },
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

		// const layerIds = reduceCompLayersRecursive<string[]>(
		// 	compositionId,
		// 	compositionState,
		// 	propertyToValue,
		// 	(acc, layer) => {
		// 		acc.push(layer.id);
		// 		return acc;
		// 	},
		// 	[],
		// );

		const composition = compositionState.compositions[compositionId];
		const layerIds = composition.layers;

		for (const layerId of layerIds) {
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
				compositionId: layer.compositionId,
				compositionState,
				computed,
				container,
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
	} catch (e) {
		console.log(e);
		return {};
	}
};

export const computeCompositionPropertyValues = (
	state: ActionState,
	compositionId: string,
	frameIndex: number,
	container: {
		width: number;
		height: number;
	},
): PropertyValueMap => {
	const context: Context = {
		compositionId,
		compositionState: state.compositionState,
		graphs: state.nodeEditor.graphs,
		timelineSelectionState: state.timelineSelection,
		timelineState: state.timelines,
		container,
		frameIndex,
	};

	return _compute(context);
};

export const CompositionPropertyValuesContext = React.createContext<PropertyValueMap>({});

export const CompositionPropertyValuesProvider: React.FC<{
	compositionId: string;
	frameIndex: number;
	containerWidth: number;
	containerHeight: number;
}> = ({ children, compositionId, frameIndex, containerWidth, containerHeight }) => {
	const propertyToValue = useActionState((state) => {
		return computeCompositionPropertyValues(state, compositionId, frameIndex, {
			width: containerWidth,
			height: containerHeight,
		});
	});

	return (
		<CompositionPropertyValuesContext.Provider value={propertyToValue}>
			{children}
		</CompositionPropertyValuesContext.Provider>
	);
};
