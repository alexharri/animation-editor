import { compositionActions } from "~/composition/compositionReducer";
import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import { CompoundProperty } from "~/composition/compositionTypes";
import { reduceLayerPropertiesAndGroups } from "~/composition/compositionUtils";
import { arrayModifierPropertiesFactory } from "~/composition/factories/arrayModifierPropertiesFactory";
import { getLayerTypeName } from "~/composition/layer/layerUtils";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { ContextMenuOption } from "~/contextMenu/contextMenuReducer";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeType } from "~/flow/flowTypes";
import { flowActions } from "~/flow/state/flowActions";
import { layerOperations } from "~/layer/layerOperations";
import { requestAction } from "~/listener/requestAction";
import { shapeActions } from "~/shape/shapeReducer";
import { shapeSelectionActions } from "~/shape/shapeSelectionReducer";
import { getShapeLayerPathIds } from "~/shape/shapeUtils";
import { createOperation } from "~/state/operation";
import { getActionState } from "~/state/stateUtils";
import { timelineActions, timelineSelectionActions } from "~/timeline/timelineActions";
import { LayerType, PropertyGroupName } from "~/types";
import { createGenMapIdFn, createMapNumberId } from "~/util/mapUtils";

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
				const { compositionState } = getActionState();
				const expectedLayerId = createMapNumberId(compositionState.layers);
				params.dispatch(
					compositionActions.createLayer(compositionId, type),
					contextMenuActions.closeContextMenu(),
				);
				params.addDiff((diff) => diff.addLayer(expectedLayerId));
				params.submitAction(`Add ${getLayerTypeName(type)}`);
			};

			options.push({
				label: "New layer",
				options: [LayerType.Rect, LayerType.Ellipse, LayerType.Shape, LayerType.Line].map(
					(type) => ({
						label: getLayerTypeName(type),
						onSelect: createAddLayerFn(type),
					}),
				),
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

							const { propertyId, propertiesToAdd } = arrayModifierPropertiesFactory({
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
							params.addDiff((diff) => diff.propertyStructure(layerId));
							params.submitAction("Add array modifier to layer");
						},
					},
				],
			});
		}

		if (propertyId) {
			const { compositionState } = getActionState();

			let compoundProperty: CompoundProperty | null = null;

			const property = compositionState.properties[propertyId];

			if (property.name === PropertyGroupName.ArrayModifier) {
				options.push({
					label: "Remove Array Modifier",
					onSelect: () => {
						const op = createOperation(params);
						layerOperations.removeArrayModifier(op, propertyId);
						op.submit();
						params.dispatch(contextMenuActions.closeContextMenu());
						params.submitAction("Remove array modifier");
					},
				});
			}

			if (property.type === "compound") {
				compoundProperty = property;
			} else if (property.type === "property") {
				if (property.compoundPropertyId) {
					compoundProperty = compositionState.properties[
						property.compoundPropertyId
					] as CompoundProperty;
				}
			}

			if (compoundProperty) {
				const separated = !compoundProperty.separated;
				const label = compoundProperty.separated
					? "Join dimensions"
					: "Separate dimensions";

				options.push({
					label,
					onSelect: () => {
						params.dispatch(
							compositionActions.setCompoundPropertySeparated(
								compoundProperty!.id,
								separated,
							),
						);
						params.dispatch(contextMenuActions.closeContextMenu());
						params.submitAction("Toggle separate dimensions");
					},
				});
			}
		}

		// Remove layer
		if (layerId) {
			const removeLayer = () => {
				const op = createOperation(params);

				const { compositionState, flowState, shapeState } = op.state;
				const layer = compositionState.layers[layerId];

				op.add(
					compositionActions.removeLayer(layer.id),
					contextMenuActions.closeContextMenu(),
				);

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
				op.add(
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

					if (property.type === "group" || property.type === "compound") {
						property.properties.forEach(crawl);
						return;
					}

					if (property.timelineId) {
						timelineIdsToRemove.push(property.timelineId);
					}
				}
				layer.properties.forEach(crawl);

				timelineIdsToRemove.forEach((id) => {
					op.add(timelineActions.removeTimeline(id));
					op.add(timelineSelectionActions.clear(id));
				});

				// Remove layer graph if it exists
				if (layer.graphId) {
					op.add(flowActions.removeGraph(layer.graphId));
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
					const nodeIds = graph.nodes;
					for (let j = 0; j < nodeIds.length; j += 1) {
						const node = flowState.nodes[nodeIds[j]];

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
						op.add(
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
						op.add(shapeActions.removePath(pathId));
						op.add(shapeActions.removeShape(shapeId));
						op.add(shapeSelectionActions.clearShapeSelection(shapeId));
					}
				}

				op.addDiff((diff) => diff.removeLayer(layerId));
				op.submit();
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
