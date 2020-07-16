import { useComputeHistory } from "~/hook/useComputeHistory";
import { computeLayerGraph } from "~/nodeEditor/graph/computeLayerGraph";
import { useActionState } from "~/hook/useActionState";
import { ComputeNodeContext } from "~/nodeEditor/graph/computeNode";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { PropertyName } from "~/types";

export const useLayerNameToProperty = (compositionId: string, layerId: string) => {
	const { computePropertyValues, layer } = useComputeHistory((state) => {
		const layer = state.compositions.layers[layerId];
		const graph = layer.graphId ? state.nodeEditor.graphs[layer.graphId] : undefined;

		return { computePropertyValues: computeLayerGraph(graph), layer };
	});

	const propertyToValue = useActionState((actionState) => {
		const context: ComputeNodeContext = {
			computed: {},
			compositionId,
			layerId,
			compositionState: actionState.compositions,
			timelines: actionState.timelines,
			timelineSelection: actionState.timelineSelection,
			frameIndex: actionState.compositions.compositions[compositionId].frameIndex,
		};

		const mostRecentGraph = actionState.nodeEditor.graphs[layer.graphId];
		return computePropertyValues(context, mostRecentGraph);
	});

	const properties = useActionState((state) => {
		return getLayerCompositionProperties(layer.id, state.compositions);
	});

	const nameToProperty = properties.reduce<{ [key in keyof typeof PropertyName]: any }>(
		(obj, p) => {
			const value = propertyToValue[p.id] ?? p.value;
			(obj as any)[PropertyName[p.name]] = value.computedValue;
			return obj;
		},
		{} as any,
	);

	return nameToProperty;
};
