import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { CompoundProperty, Property, PropertyGroup } from "~/composition/compositionTypes";
import { reduceCompProperties } from "~/composition/compositionUtils";
import { computeLayerTransformMap } from "~/composition/transformMap";
import { getLayerArrayModifiers } from "~/composition/util/compositionPropertyUtils";
import {
	FlowComputeContext,
	FlowComputeNodeArg,
	FlowGraph,
	FlowNode,
	FlowNodeType,
} from "~/flow/flowTypes";
import { computeNodeOutputArgs } from "~/flow/graph/computeNode";
import { FlowState } from "~/flow/state/flowReducers";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";
import { TimelineState } from "~/timeline/timelineReducer";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";
import { CompositionRenderValues, LayerTransform, LayerType } from "~/types";

function getGraphOutputNodes(flowState: FlowState, graph: FlowGraph) {
	const outputNodes: FlowNode<FlowNodeType.property_output>[] = [];
	for (const key of graph.nodes) {
		const node = flowState.nodes[key];

		if (node.type === FlowNodeType.property_output) {
			outputNodes.push(node as FlowNode<FlowNodeType.property_output>);
		}
	}
	return outputNodes;
}

/**
 * Gets nodes to compute in graph sorted topologically.
 *
 * We don't check for circularity yet. Infinite loops are easy to
 * create right now.
 */
function getGraphNodesToCompute(
	outputNodes: FlowNode<FlowNodeType.property_output>[],
	flowState: FlowState,
) {
	const visitedNodes = new Set<string>();
	const toCompute: string[] = [];

	function dfs(node: FlowNode<any>) {
		if (visitedNodes.has(node.id)) {
			return;
		}

		visitedNodes.add(node.id);

		for (const input of node.inputs) {
			if (input.pointer) {
				dfs(flowState.nodes[input.pointer.nodeId]);
			}
		}

		toCompute.push(node.id);
	}

	for (const outputNode of outputNodes) {
		dfs(outputNode);
	}

	return toCompute;
}

interface Context {
	compositionId: string;
	compositionState: CompositionState;
	compositionSelectionState: CompositionSelectionState;
	shapeState: ShapeState;
	shapeSelectionState: ShapeSelectionState;
	container: {
		width: number;
		height: number;
	};
	timelineState: TimelineState;
	timelineSelectionState: TimelineSelectionState;
	flowState: FlowState;
	frameIndex: number;
}

interface Options {
	recursive: boolean;
}

const _compute = (context: Context, options: Options): CompositionRenderValues => {
	const {
		compositionId,
		compositionState,
		container,
		timelineState,
		timelineSelectionState,
		frameIndex,
		flowState,
	} = context;

	const _compProperties: { [compositionId: string]: Property[] } = {};
	const getCompositionProperties = (compositionId: string) => {
		if (!_compProperties[compositionId]) {
			_compProperties[compositionId] = reduceCompProperties<Property[]>(
				compositionId,
				compositionState,
				(acc, property) => {
					acc.push(property);
					return acc;
				},
				[],
			);
		}

		return _compProperties[compositionId];
	};

	const renderCompAtFrameIndex = (
		parent: CompositionRenderValues | undefined,
		parentTransform: LayerTransform | undefined,
		compositionId: string,
		frameIndex: number,
	): CompositionRenderValues => {
		const composition = compositionState.compositions[compositionId];
		const map: CompositionRenderValues = {
			frameIndex,
			properties: {},
			arrayModifierProperties: {},
			compositionLayers: {},
			transforms: {},
			parent,
		};

		const properties = getCompositionProperties(compositionId);

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
		for (const layerId of composition.layers) {
			const computed: { [nodeId: string]: FlowComputeNodeArg[] } = {};
			const layer = compositionState.layers[layerId];

			if (!layer.graphId) {
				continue;
			}

			const graph = context.flowState.graphs[layer.graphId];
			const outputNodes = getGraphOutputNodes(flowState, graph);

			if (!outputNodes.length) {
				continue;
			}

			const toCompute = getGraphNodesToCompute(outputNodes, flowState);

			const ctx: FlowComputeContext = {
				compositionId: layer.compositionId,
				compositionState,
				computed,
				container,
				layerId,
				frameIndex,
				propertyToValue: map.properties,
				expressionCache: {},

				// `array_modifier_index` nodes may not exist in layer graphs
				arrayModifierIndex: -1,
			};

			for (const nodeId of toCompute) {
				computed[nodeId] = computeNodeOutputArgs(flowState.nodes[nodeId], ctx);
			}

			for (const outputNode of outputNodes) {
				const selectedProperty = compositionState.properties[outputNode.state.propertyId];

				// No property has been selected, the node does not affect
				// the output
				if (!selectedProperty) {
					continue;
				}

				let propertyIds: string[];

				switch (selectedProperty.type) {
					case "group": {
						propertyIds = selectedProperty.properties;
						break;
					}
					case "compound": {
						propertyIds = [selectedProperty.id, ...selectedProperty.properties];
						break;
					}
					case "property": {
						propertyIds = [selectedProperty.id];
						break;
					}
				}

				const properties = propertyIds
					.map((id) => context.compositionState.properties[id])
					.filter(
						(property): property is Property | CompoundProperty =>
							property.type !== "group",
					);

				for (let i = 0; i < properties.length; i += 1) {
					const property = properties[i];

					// Do not modify the property:value map if the input does not have
					// a pointer.
					//
					// This allows us to, for example, have two property_output nodes that
					// both reference Transform but modify different properties of the
					// Transform group.
					if (!outputNode.inputs[i].pointer) {
						continue;
					}

					if (property.type === "compound") {
						const value = computed[outputNode.id][i].value as Vec2;
						const [xId, yId] = property.properties;
						map.properties[xId].computedValue = value.x;
						map.properties[yId].computedValue = value.y;
						continue;
					}

					map.properties[property.id].computedValue = computed[outputNode.id][i].value;
				}
			}
		}

		// Compute array modifier properties of layers
		for (const layerId of composition.layers) {
			const arrayModifiers = getLayerArrayModifiers(layerId, compositionState);
			const layer = compositionState.layers[layerId];

			for (const modifier of arrayModifiers) {
				const modifierGroup = compositionState.properties[
					modifier.modifierGroupId
				] as PropertyGroup;

				if (!modifierGroup.graphId) {
					continue;
				}

				const graph = flowState.graphs[modifierGroup.graphId];
				const outputNodes = getGraphOutputNodes(flowState, graph);

				if (!outputNodes.length) {
					continue;
				}

				let count = 1;

				if (options.recursive) {
					count = Math.max(1, map.properties[modifier.countId].computedValue);
				}

				// Reuse for graph
				const expressionCache = {};

				for (let i = 0; i < count; i++) {
					const toCompute = getGraphNodesToCompute(outputNodes, flowState);

					const computed: { [nodeId: string]: FlowComputeNodeArg[] } = {};

					const ctx: FlowComputeContext = {
						compositionId: layer.compositionId,
						compositionState,
						computed,
						container,
						layerId,
						frameIndex,
						propertyToValue: map.properties,
						expressionCache,
						arrayModifierIndex: i,
					};

					for (const nodeId of toCompute) {
						computed[nodeId] = computeNodeOutputArgs(flowState.nodes[nodeId], ctx);
					}

					for (const outputNode of outputNodes) {
						const selectedProperty =
							compositionState.properties[outputNode.state.propertyId];

						// No property has been selected, the node does not affect
						// the output
						if (!selectedProperty) {
							continue;
						}

						const properties =
							selectedProperty.type === "group" ||
							selectedProperty.type === "compound"
								? selectedProperty.properties
										.map((id) => context.compositionState.properties[id])
										.filter(
											(property): property is Property =>
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

							if (!map.arrayModifierProperties[property.id]) {
								map.arrayModifierProperties[property.id] = {};
							}

							map.arrayModifierProperties[property.id][i] =
								computed[outputNode.id][j].value;
						}
					}
				}
			}
		}

		map.transforms = computeLayerTransformMap(
			composition.id,
			map.properties,
			map.arrayModifierProperties,
			context,
			parentTransform,
			options,
		);

		return map;
	};

	const _compRenderValues: { [key: string]: CompositionRenderValues } = {};
	const getCompRenderValuesAtFrameIndex = (
		parent: any,
		parentTransform: LayerTransform | undefined,
		compositionId: string,
		frameIndex: number,
		layerId?: string,
	): CompositionRenderValues => {
		const key = `${compositionId}:${frameIndex}:${layerId}`;

		if (!_compRenderValues[key]) {
			_compRenderValues[key] = renderCompAtFrameIndex(
				parent,
				parentTransform,
				compositionId,
				frameIndex,
			);
		}

		return renderCompAtFrameIndex(parent, parentTransform, compositionId, frameIndex);
	};

	function crawl(
		compositionId: string,
		frameIndex: number,
		parent?: CompositionRenderValues,
		parentTransform?: LayerTransform,
		layerId?: string,
	): CompositionRenderValues {
		const composition = compositionState.compositions[compositionId];

		const map = getCompRenderValuesAtFrameIndex(
			parent,
			parentTransform,
			compositionId,
			frameIndex,
			layerId,
		);

		if (options.recursive) {
			// Construct maps for composition layers
			for (const layerId of composition.layers) {
				const layer = compositionState.layers[layerId];

				if (layer.type === LayerType.Composition) {
					let transform = map.transforms[layer.id].transform;

					const id = compositionState.compositionLayerIdToComposition[layer.id];
					map.compositionLayers[layer.id] = crawl(
						id,
						map.frameIndex - layer.index,
						map,
						transform,
						layerId,
					);
				}
			}
		}

		return map;
	}

	return crawl(compositionId, frameIndex);
};

export const getCompositionRenderValues = (
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
		compositionSelectionState: state.compositionSelectionState,
		shapeState: state.shapeState,
		shapeSelectionState: state.shapeSelectionState,
		flowState: state.flowState,
		timelineSelectionState: state.timelineSelectionState,
		timelineState: state.timelineState,
		container,
		frameIndex,
	};

	const map = _compute(context, options);
	return map;
};
