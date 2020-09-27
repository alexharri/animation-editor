import { compositionActions } from "~/composition/compositionReducer";
import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import { reduceLayerPropertiesAndGroups } from "~/composition/compositionUtils";
import { getLayerTypeName } from "~/composition/layer/layerUtils";
import { createArrayModifier } from "~/composition/modifiers/arrayModifier";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { ContextMenuOption } from "~/contextMenu/contextMenuReducer";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeType } from "~/flow/flowTypes";
import { flowActions } from "~/flow/state/flowActions";
import { requestAction } from "~/listener/requestAction";
import { shapeActions } from "~/shape/shapeReducer";
import { shapeSelectionActions } from "~/shape/shapeSelectionReducer";
import { getShapeLayerPathIds } from "~/shape/shapeUtils";
import { getActionState } from "~/state/stateUtils";
import { timelineActions, timelineSelectionActions } from "~/timeline/timelineActions";
import { LayerType, ToDispatch } from "~/types";
import { createGenMapIdFn } from "~/util/mapUtils";

interface Options {
	compositionId: string;
	layerId?: string;
	propertyId?: string;
}

export const createTimelineContextMenu = (
	position: Vec2,
	{ compositionId, layerId, propertyId }: Options,
): void => {
	requestAction({ history: true }, (params) => {
		const options: ContextMenuOption[] = [];

		if (!layerId && !propertyId) {
			const createAddLayerFn = (type: LayerType) => () => {
				params.dispatch(compositionActions.createLayer(compositionId, type));
				params.dispatch(contextMenuActions.closeContextMenu());
				params.submitAction(`Add ${getLayerTypeName(type)}`);
			};

			options.push({
				label: "Add new layer",
				options: [LayerType.Rect, LayerType.Ellipse, LayerType.Shape].map((type) => ({
					label: getLayerTypeName(type),
					onSelect: createAddLayerFn(type),
				})),
			});
		}

		// Add modifier
		if (layerId) {
			options.push({
				label: "Add modifier",
				options: [
					{
						label: "Array",
						onSelect: () => {
							const { compositionState } = getActionState();

							const { propertyId, propertiesToAdd } = createArrayModifier({
								compositionId,
								layerId,
								createId: createGenMapIdFn(compositionState.properties),
							});

							params.dispatch(
								compositionActions.addModifierToLayer(
									layerId,
									propertyId,
									propertiesToAdd,
								),
							);
							params.dispatch(contextMenuActions.closeContextMenu());
							params.submitAction("Add array modifier to layer");
						},
					},
				],
			});
		}

		// Remove layer
		if (layerId) {
			const removeLayer = () => {
				const { compositionState, flowState, shapeState } = getActionState();
				const layer = compositionState.layers[layerId];

				const toDispatch: ToDispatch = [
					compositionActions.removeLayer(layer.id),
					contextMenuActions.closeContextMenu(),
				];

				// Clear layer selection and property selection
				const propertyIds = reduceLayerPropertiesAndGroups<string[]>(
					layerId,
					compositionState,
					(acc, property) => {
						acc.push(property.id);
						return acc;
					},
					[],
				);
				toDispatch.push(
					compSelectionActions.removeLayersFromSelection(compositionId, [layerId]),
					compSelectionActions.removePropertiesFromSelection(compositionId, propertyIds),
				);

				// Remove all timelines referenced by properties of the deleted layer.
				//
				// In the future, timelines may be referenced in more ways than just by animated
				// properties. When that is the case we will have to check for other references to
				// the timelines we're deleting.
				const timelineIdsToRemove: string[] = [];

				function crawl(propertyId: string) {
					const property = compositionState.properties[propertyId];

					if (property.type === "group") {
						property.properties.forEach(crawl);
						return;
					}

					if (property.timelineId) {
						timelineIdsToRemove.push(property.timelineId);
					}
				}
				layer.properties.forEach(crawl);

				timelineIdsToRemove.forEach((id) => {
					toDispatch.push(timelineActions.removeTimeline(id));
					toDispatch.push(timelineSelectionActions.clear(id));
				});

				// Remove layer graph if it exists
				if (layer.graphId) {
					toDispatch.push(flowActions.removeGraph(layer.graphId));
				}

				// Remove references to layer in layer graphs in this composition
				const composition = compositionState.compositions[layer.compositionId];
				for (let i = 0; i < composition.layers.length; i += 1) {
					const layerId = composition.layers[i];

					if (layer.id === layerId) {
						continue;
					}

					const graphId = compositionState.layers[layerId].graphId;
					if (!graphId) {
						continue;
					}

					const graph = flowState.graphs[graphId];
					const nodeIds = Object.keys(graph.nodes);
					for (let j = 0; j < nodeIds.length; j += 1) {
						const node = graph.nodes[nodeIds[j]];

						if (node.type !== FlowNodeType.property_input) {
							continue;
						}

						const state = node.state as FlowNodeState<FlowNodeType.property_input>;

						if (state.layerId !== layer.id) {
							continue;
						}

						// Node references layer.
						//
						// Reset node state/outputs and remove all references to it.
						toDispatch.push(
							flowActions.removeReferencesToNodeInGraph(graph.id, node.id),
							flowActions.setNodeOutputs(graph.id, node.id, []),
							flowActions.updateNodeState<FlowNodeType.property_input>(
								graph.id,
								node.id,
								{ layerId: "", propertyId: "" },
							),
						);
					}
				}

				// If shape layer, remove all shapes and paths referenced by layer
				if (layer.type === LayerType.Shape) {
					const pathIds = getShapeLayerPathIds(layerId, compositionState);
					for (const pathId of pathIds) {
						const { shapeId } = shapeState.paths[pathId];
						toDispatch.push(shapeActions.removePath(pathId));
						toDispatch.push(shapeActions.removeShape(shapeId));
						toDispatch.push(shapeSelectionActions.clearShapeSelection(shapeId));
					}
				}

				params.dispatch(toDispatch);
				params.submitAction("Delete layer");
			};

			options.push({
				label: "Delete layer",
				onSelect: removeLayer,
			});
		}

		params.dispatch(
			contextMenuActions.openContextMenu("Timeline", options, position, params.cancelAction),
		);
	});
};
