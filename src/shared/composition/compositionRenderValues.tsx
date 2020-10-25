import React, { useEffect, useRef } from "react";
import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
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
import { getActionState, getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { TimelineState } from "~/timeline/timelineReducer";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";
import { CompositionRenderValues, LayerTransform, LayerType } from "~/types";

function getGraphOutputNodes(graph: FlowGraph) {
	const outputNodes: FlowNode<FlowNodeType.property_output>[] = [];
	for (const key in graph.nodes) {
		const node = graph.nodes[key];

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
	graph: FlowGraph,
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
				dfs(graph.nodes[input.pointer.nodeId]);
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
	graphs: FlowState["graphs"];
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
	} = context;

	const _compProperties: { [compositionId: string]: CompositionProperty[] } = {};
	const getCompositionProperties = (compositionId: string) => {
		if (!_compProperties[compositionId]) {
			_compProperties[compositionId] = reduceCompProperties<CompositionProperty[]>(
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

			const graph = context.graphs[layer.graphId];
			const outputNodes = getGraphOutputNodes(graph);

			if (!outputNodes.length) {
				continue;
			}

			const toCompute = getGraphNodesToCompute(outputNodes, graph);

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
				computed[nodeId] = computeNodeOutputArgs(graph.nodes[nodeId], ctx);
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
				] as CompositionPropertyGroup;

				if (!modifierGroup.graphId) {
					continue;
				}

				const graph = context.graphs[modifierGroup.graphId];
				const outputNodes = getGraphOutputNodes(graph);

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
					const toCompute = getGraphNodesToCompute(outputNodes, graph);

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
						computed[nodeId] = computeNodeOutputArgs(graph.nodes[nodeId], ctx);
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
		graphs: state.flowState.graphs,
		timelineSelectionState: state.timelineSelectionState,
		timelineState: state.timelineState,
		container,
		frameIndex,
	};

	const map = _compute(context, options);
	return map;
};

type Value = { rawValue: any; computedValue: any };

export const CompositionPropertyValuesContext = React.createContext<{
	subscribe: (propertyId: string, listener: (value: Value) => void) => () => void;
	getValue: (propertyId: string) => Value;
}>({} as any);

export const CompositionPropertyValuesProvider: React.FC<{
	compositionId: string;
}> = ({ children, compositionId }) => {
	const getMap = (state: ActionState): CompositionRenderValues => {
		const composition = state.compositionState.compositions[compositionId];
		const { frameIndex, width, height } = composition;
		return getCompositionRenderValues(
			state,
			compositionId,
			frameIndex,
			{ width, height },
			{ recursive: false },
		);
	};

	const lastMapRef = useRef<CompositionRenderValues>(getMap(getActionState()));
	const lastStateRef = useRef<ActionState | null>(null);
	const shouldRenderRef = useRef(true);
	const nRef = useRef(0);
	const listenersRef = useRef<
		Array<{ id: string; propertyId: string; listener: (value: Value) => void }>
	>([]);

	useEffect(() => {
		const unsub = store.subscribe(() => {
			if (shouldRenderRef.current) {
				return;
			}

			const prevState = lastStateRef.current;
			const nextState = getActionStateFromApplicationState(store.getState());

			lastStateRef.current = nextState;

			shouldRenderRef.current = (() => {
				if (!prevState) {
					return true;
				}

				if (prevState.compositionState !== nextState.compositionState) {
					return true;
				}

				if (prevState.timelineState !== nextState.timelineState) {
					return true;
				}

				return false;
			})();
		});

		return unsub;
	}, []);

	const render = () => {
		const map = getMap(getActionState());
		const lastMap = lastMapRef.current;

		lastMapRef.current = map;
		shouldRenderRef.current = false;

		const listeners = listenersRef.current;
		for (const { listener, propertyId } of listeners) {
			const rawValue = map.properties[propertyId].rawValue;
			const lastRawValue = lastMap.properties[propertyId].rawValue;

			const computedValue = map.properties[propertyId].computedValue;
			const lastComputedValue = lastMap.properties[propertyId].computedValue;

			if (computedValue === lastComputedValue && rawValue === lastRawValue) {
				continue;
			}

			listener(map.properties[propertyId]);
		}
	};

	useEffect(() => {
		let mounted = true;

		const tick = () => {
			if (mounted) {
				requestAnimationFrame(tick);
			}

			const shouldRender = shouldRenderRef.current;

			if (!shouldRender) {
				return;
			}

			shouldRenderRef.current = false;
			render();
		};
		tick();

		return () => {
			mounted = false;
		};
	}, []);

	const getValue = (propertyId: string): Value => {
		const map = lastMapRef.current;
		const value = map.properties[propertyId];

		if (!value) {
			console.log(map, propertyId);
		}

		return value;
	};

	const subscribe = (propertyId: string, listener: (value: Value) => void) => {
		const id = (++nRef.current).toString();

		listenersRef.current.push({ id, propertyId, listener });

		return function unsubscribe() {
			const listeners = listenersRef.current;
			for (let i = 0; i < listeners.length; i += 1) {
				if (listeners[i].id !== id) {
					continue;
				}

				listeners.splice(i, 1);
				break;
			}
		};
	};

	return (
		<CompositionPropertyValuesContext.Provider value={{ getValue, subscribe }}>
			{children}
		</CompositionPropertyValuesContext.Provider>
	);
};
