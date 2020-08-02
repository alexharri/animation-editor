import React from "react";
import { CompositionProperty } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { reduceCompProperties } from "~/composition/timeline/compTimeUtils";
import { computeLayerTransformMap } from "~/composition/transformUtils";
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
import {
	AffineTransform,
	CompositionRenderValues,
	LayerType,
	NodeEditorNodeType,
	PropertyValueMap,
} from "~/types";

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

interface Options {
	recursive: boolean;
}

export const _compute = (context: Context, options: Options): CompositionRenderValues => {
	const {
		compositionId,
		compositionState,
		container,
		timelineState,
		timelineSelectionState,
		frameIndex,
	} = context;

	function crawl(
		compositionId: string,
		frameIndex: number,
		parent?: CompositionRenderValues,
		parentTransform?: AffineTransform,
	): CompositionRenderValues {
		const composition = compositionState.compositions[compositionId];
		const map: CompositionRenderValues = {
			frameIndex,
			properties: {},
			compositionLayers: {},
			transforms: {},
			parent,
		};

		const properties = reduceCompProperties<CompositionProperty[]>(
			compositionId,
			compositionState,
			(acc, property) => {
				acc.push(property);
				return acc;
			},
			[],
		);

		// Compute raw values for each property in the composition
		for (const property of properties) {
			const layer = compositionState.layers[property.layerId];
			const frameIndex = map.frameIndex;

			const rawValue = property.timelineId
				? getTimelineValueAtIndex({
						timeline: timelineState[property.timelineId],
						layerIndex: layer.index,
						frameIndex,
						selection: timelineSelectionState[property.timelineId],
				  })
				: property.value;

			map.properties[property.id] = {
				rawValue,
				computedValue: rawValue,
			};
		}

		// Compute property values from layer graphs
		const computed: { [nodeId: string]: ComputeNodeArg[] } = {};
		for (const layerId of composition.layers) {
			const layer = compositionState.layers[layerId];

			if (!layer.graphId) {
				continue;
			}

			const graph = context.graphs[layer.graphId];

			// Find all output nodes
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

			// Sort nodes to compute topologically
			//
			// We don't check for circularity yet. Infinite loops are easy to
			// create right now.
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
				frameIndex,
				propertyToValue: map.properties,
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

					map.properties[property.id].computedValue = computed[outputNode.id][j].value;
				}
			}
		}

		// Compute transforms
		// console.log({ parentTransform });
		map.transforms = computeLayerTransformMap(
			composition.id,
			map.properties,
			compositionState,
			parentTransform,
		);

		if (options.recursive) {
			// Construct maps for composition layers
			for (const layerId of composition.layers) {
				const layer = compositionState.layers[layerId];

				if (layer.type === LayerType.Composition) {
					const id = compositionState.compositionLayerIdToComposition[layer.id];
					map.compositionLayers[layer.id] = crawl(
						id,
						map.frameIndex - layer.index,
						map,
						map.transforms[layer.id],
					);
				}
			}
		}

		return map;
	}

	return crawl(compositionId, frameIndex);
};

export const computeCompositionPropertyValues = (
	state: ActionState,
	compositionId: string,
	frameIndex: number,
	container: {
		width: number;
		height: number;
	},
	options: Options,
): CompositionRenderValues => {
	const context: Context = {
		compositionId,
		compositionState: state.compositionState,
		graphs: state.nodeEditor.graphs,
		timelineSelectionState: state.timelineSelection,
		timelineState: state.timelines,
		container,
		frameIndex,
	};

	return _compute(context, options);
};

export const CompositionPropertyValuesContext = React.createContext<PropertyValueMap>({});

export const CompositionPropertyValuesProvider: React.FC<{
	compositionId: string;
	frameIndex: number;
	containerWidth: number;
	containerHeight: number;
}> = ({ children, compositionId, frameIndex, containerWidth, containerHeight }) => {
	const map = useActionState((state) => {
		return computeCompositionPropertyValues(
			state,
			compositionId,
			frameIndex,
			{
				width: containerWidth,
				height: containerHeight,
			},
			{ recursive: false },
		);
	});

	return (
		<CompositionPropertyValuesContext.Provider value={map.properties}>
			{children}
		</CompositionPropertyValuesContext.Provider>
	);
};
