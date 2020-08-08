import React, { useEffect, useRef } from "react";
import { CompositionProperty } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { reduceCompProperties } from "~/composition/timeline/compTimeUtils";
import { computeLayerTransformMap } from "~/composition/transformUtils";
import { getLayerArrayModifierCountPropertyId } from "~/composition/util/compositionPropertyUtils";
import {
	ComputeNodeArg,
	ComputeNodeContext,
	computeNodeOutputArgs,
} from "~/nodeEditor/graph/computeNode";
import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorState } from "~/nodeEditor/nodeEditorReducers";
import { getActionState, getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { TimelineState } from "~/timeline/timelineReducer";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";
import { AffineTransform, CompositionRenderValues, LayerType, NodeEditorNodeType } from "~/types";

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

const _compute = (context: Context, options: Options): CompositionRenderValues => {
	const {
		compositionId,
		compositionState,
		container,
		timelineState,
		timelineSelectionState,
		frameIndex,
	} = context;

	// May be reused since node ids are not reused in different graphs
	const expressionCache = {};

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
		parent: any,
		parentTransform: AffineTransform | undefined,
		compositionId: string,
		frameIndex: number,
	): CompositionRenderValues => {
		const composition = compositionState.compositions[compositionId];
		const map: CompositionRenderValues = {
			frameIndex,
			properties: {},
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
				computedValue: { "0": rawValue },
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

			let count = 1;

			for (let amodIndex = 0; amodIndex < count; amodIndex++) {
				const ctx: ComputeNodeContext = {
					compositionId: layer.compositionId,
					compositionState,
					computed,
					container,
					layerId,
					arrayModifierIndex: amodIndex,
					frameIndex,
					propertyToValue: map.properties,
					expressionCache,
				};

				for (const nodeId of toCompute) {
					const node = graph.nodes[nodeId];
					computed[node.id] = computeNodeOutputArgs(node, ctx);
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

						map.properties[property.id].computedValue[amodIndex] =
							computed[outputNode.id][j].value;
					}
				}

				if (options.recursive && amodIndex === 0) {
					const countPropertyId = getLayerArrayModifierCountPropertyId(
						layerId,
						compositionState,
					);
					if (countPropertyId) {
						count = map.properties[countPropertyId].computedValue[0];
					}
				}
			}
		}

		map.transforms = computeLayerTransformMap(
			composition.id,
			map.properties,
			compositionState,
			parentTransform,
			options,
		);

		return map;
	};

	const _compRenderValues: { [key: string]: CompositionRenderValues } = {};
	const getCompRenderValuesAtFrameIndex = (
		parent: any,
		parentTransform: AffineTransform | undefined,
		compositionId: string,
		frameIndex: number,
	): CompositionRenderValues => {
		const key = `${compositionId}:${frameIndex}`;

		if (!_compRenderValues[key]) {
			_compRenderValues[key] = renderCompAtFrameIndex(
				parent,
				parentTransform,
				compositionId,
				frameIndex,
			);
		}

		return _compRenderValues[key];
	};

	function crawl(
		compositionId: string,
		frameIndex: number,
		parent?: CompositionRenderValues,
		parentTransform?: AffineTransform,
	): CompositionRenderValues {
		const composition = compositionState.compositions[compositionId];

		const map = getCompRenderValuesAtFrameIndex(
			parent,
			parentTransform,
			compositionId,
			frameIndex,
		);

		if (options.recursive) {
			// Construct maps for composition layers
			for (const layerId of composition.layers) {
				const layer = compositionState.layers[layerId];

				if (layer.type === LayerType.Composition) {
					map.compositionLayers[layer.id] = {};

					let count = 1;

					const countPropertyId = getLayerArrayModifierCountPropertyId(
						layerId,
						compositionState,
					);
					if (countPropertyId) {
						count = map.properties[countPropertyId].computedValue[0];
					}

					for (let i = 0; i < count; i += 1) {
						let transform = map.transforms[layer.id].transform[i];

						const id = compositionState.compositionLayerIdToComposition[layer.id];
						map.compositionLayers[layer.id][i] = crawl(
							id,
							map.frameIndex - layer.index,
							map,
							transform,
						);
					}
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
		graphs: state.nodeEditor.graphs,
		timelineSelectionState: state.timelineSelection,
		timelineState: state.timelines,
		container,
		frameIndex,
	};

	const map = _compute(context, options);
	return map;
};

type Value = { rawValue: any; computedValue: { [index: number]: any } };

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

			const lastState = lastStateRef.current;
			const state = getActionStateFromApplicationState(store.getState());

			lastStateRef.current = state;

			shouldRenderRef.current = (() => {
				if (!lastState) {
					return true;
				}

				if (state.compositionState !== lastState.compositionState) {
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

			const computedValue = map.properties[propertyId].computedValue[0];
			const lastComputedValue = lastMap.properties[propertyId].computedValue[0];

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
