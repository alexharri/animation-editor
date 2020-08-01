import { ActionType, createAction, getType } from "typesafe-actions";
import {
	Composition,
	CompositionLayer,
	CompositionProperty,
	CompositionPropertyGroup,
} from "~/composition/compositionTypes";
import { createLayer } from "~/composition/layer/createLayer";
import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";
import {
	reduceCompPropertiesAndGroups,
	reduceLayerPropertiesAndGroups,
} from "~/composition/timeline/compTimeUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { LayerType, RGBAColor } from "~/types";
import {
	addListToMap,
	modifyItemInUnionMap,
	modifyItemsInMap,
	removeKeysFromMap,
} from "~/util/mapUtils";

export interface CompositionState {
	compositions: {
		[compositionId: string]: Composition;
	};
	layers: {
		[layerId: string]: CompositionLayer;
	};
	properties: {
		[propertyId: string]: CompositionProperty | CompositionPropertyGroup;
	};
	compositionLayerIdToComposition: {
		[layerId: string]: string;
	};
}

export const initialCompositionState: CompositionState = {
	compositions: {},
	layers: {},
	properties: {},
	compositionLayerIdToComposition: {},
};

interface CreateLayerOptions {
	compositionLayerReferenceId: string;
	insertLayerIndex: number;
}

export const compositionActions = {
	applyLayerIndexShift: createAction("comp/APPLY_LAYER_INDEX_SHIFT", (action) => {
		return (
			compositionId: string,
			layerIndexShift: number,
			selectionState: CompositionSelectionState,
		) => action({ compositionId, layerIndexShift, selectionState });
	}),

	applyLayerLengthShift: createAction("comp/APPLY_LAYER_LENGTH_SHIFT", (action) => {
		return (
			compositionId: string,
			layerLengthShift: [number, number],
			selectionState: CompositionSelectionState,
		) => action({ compositionId, layerLengthShift, selectionState });
	}),

	setComposition: createAction("comp/SET_COMPOSITION", (action) => {
		return (composition: Composition) => action({ composition });
	}),

	setCompositionName: createAction("comp/SET_COMP_NAME", (action) => {
		return (compositionId: string, name: string) => action({ compositionId, name });
	}),

	setCompositionDimension: createAction("comp/SET_COMPOSITION_DIMENSIONS", (action) => {
		return (compositionId: string, which: "width" | "height", value: number) =>
			action({ compositionId, which, value });
	}),

	/**
	 * Removes a composition, all of its layers and all of its properties.
	 *
	 * Note that this does not remove the timelines referenced by properties
	 * of the composition.
	 *
	 * This also removes all layers in other compositions who reference this
	 * composition.
	 */
	removeComposition: createAction("comp/REMOVE_COMPOSITION", (action) => {
		return (compositionId: string) => action({ compositionId });
	}),

	setFrameIndex: createAction("comp/SET_FRAME_INDEX", (action) => {
		return (compositionId: string, frameIndex: number) => action({ compositionId, frameIndex });
	}),

	setPropertyValue: createAction("comp/SET_PROPERTY_VALUE", (action) => {
		return (propertyId: string, value: number | RGBAColor) => action({ propertyId, value });
	}),

	setPropertyGroupCollapsed: createAction("comp/SET_PROP_GROUP_COLLAPSED", (action) => {
		return (propertyId: string, collapsed: boolean) => action({ propertyId, collapsed });
	}),

	setPropertyTimelineId: createAction("comp/SET_PROPERTY_TIMELINE_ID", (action) => {
		return (propertyId: string, timelineId: string) => action({ propertyId, timelineId });
	}),

	createLayer: createAction("comp/CREATE_LAYER", (action) => {
		return (compositionId: string, type: LayerType, options?: Partial<CreateLayerOptions>) =>
			action({ compositionId, type, options });
	}),

	createCompositionLayerReference: createAction("comp/CREATE_COMP_LAYER_REF", (action) => {
		return (layerId: string, compositionId: string) => action({ compositionId, layerId });
	}),

	removeLayer: createAction("comp/DELETE_LAYER", (action) => {
		return (layerId: string) => action({ layerId });
	}),

	setLayerName: createAction("comp/SET_LAYER_NAME", (action) => {
		return (layerId: string, name: string) => action({ layerId, name });
	}),

	setLayerCollapsed: createAction("comp/SET_LAYER_COLLAPSED", (action) => {
		return (layerId: string, collapsed: boolean) => action({ layerId, collapsed });
	}),

	setLayerGraphId: createAction("comp/SET_LAYER_GRAPH_ID", (action) => {
		return (layerId: string, graphId: string) => action({ layerId, graphId });
	}),

	setLayerParentLayerId: createAction("comp/SET_LAYER_PARENT_LAYER_ID", (action) => {
		return (layerId: string, parentLayerId: string) => action({ layerId, parentLayerId });
	}),
};

type Action = ActionType<typeof compositionActions>;

export const compositionReducer = (
	state = initialCompositionState,
	action: Action,
): CompositionState => {
	switch (action.type) {
		case getType(compositionActions.applyLayerIndexShift): {
			const { compositionId, layerIndexShift, selectionState } = action.payload;

			const selection = getCompSelectionFromState(compositionId, selectionState);

			const newState = {
				...state,
				layers: { ...state.layers },
			};

			const layerIds = state.compositions[compositionId].layers;

			for (let i = 0; i < layerIds.length; i += 1) {
				const layerId = layerIds[i];

				if (!selection.layers[layerId]) {
					continue;
				}

				const layer = state.layers[layerId];
				newState.layers[layerId] = {
					...layer,
					index: Math.max(0, layer.index + layerIndexShift),
				};
			}

			return newState;
		}

		case getType(compositionActions.applyLayerLengthShift): {
			const { compositionId, layerLengthShift, selectionState } = action.payload;

			const selection = getCompSelectionFromState(compositionId, selectionState);

			const newState = {
				...state,
				layers: { ...state.layers },
			};

			const layerIds = state.compositions[compositionId].layers;

			for (let i = 0; i < layerIds.length; i += 1) {
				const layerId = layerIds[i];

				if (!selection.layers[layerId]) {
					continue;
				}

				const layer = state.layers[layerId];
				const compositionLength = state.compositions[layer.compositionId].length;

				const length = Math.min(
					compositionLength - layer.index,
					Math.max(0, layer.length - layerLengthShift[0] + layerLengthShift[1]),
				);
				const index = Math.min(
					compositionLength - length,
					Math.max(0, layer.index + layerLengthShift[0]),
				);
				newState.layers[layerId] = {
					...layer,
					index,
					length,
				};
			}

			return newState;
		}

		case getType(compositionActions.setComposition): {
			const { composition } = action.payload;
			return {
				...state,
				compositions: addListToMap(state.compositions, [composition], "id"),
			};
		}

		case getType(compositionActions.setCompositionName): {
			const { compositionId, name } = action.payload;
			return {
				...state,
				compositions: modifyItemsInMap(
					state.compositions,
					compositionId,
					(composition) => ({
						...composition,
						name,
					}),
				),
			};
		}

		case getType(compositionActions.setFrameIndex): {
			const { compositionId, frameIndex } = action.payload;
			return {
				...state,
				compositions: {
					...state.compositions,
					[compositionId]: {
						...state.compositions[compositionId],
						frameIndex,
					},
				},
			};
		}

		case getType(compositionActions.removeComposition): {
			const { compositionId } = action.payload;

			const composition = state.compositions[compositionId];

			// Find all CompositionLayers that reference the composition being removed
			const compLayerLayerIds = Object.keys(state.compositionLayerIdToComposition).filter(
				(layerId) => {
					return state.compositionLayerIdToComposition[layerId] === compositionId;
				},
			);

			// All layers in composition being removed, and all composition layers who
			// reference the composition being removed.
			const layerIds = [...composition.layers, ...compLayerLayerIds];

			// All properties and property groups in this composition
			const propertyIds = reduceCompPropertiesAndGroups<string[]>(
				compositionId,
				state,
				(arr, property) => {
					arr.push(property.id);
					return arr;
				},
				[],
			);

			// Add the properties of composition layers to `propertyIds`
			for (const layerId of compLayerLayerIds) {
				const compLayerPropertyIds = reduceLayerPropertiesAndGroups<string[]>(
					layerId,
					state,
					(arr, property) => {
						arr.push(property.id);
						return arr;
					},
					[],
				);
				propertyIds.push(...compLayerPropertyIds);
			}

			// Sorry for the extreme name, but it's hard to find a concise name for this.
			const compositionIdsThatReferenceCompositionLayersBeingRemoved = [
				...new Set(
					compLayerLayerIds.map((layerId) => {
						return state.layers[layerId].compositionId;
					}),
				),
			];

			let compositions = state.compositions;

			// Remove composition
			compositions = removeKeysFromMap(state.compositions, [compositionId]);

			// Remove the composition layers that reference the composition being removed
			compositions = modifyItemsInMap(
				compositions,
				compositionIdsThatReferenceCompositionLayersBeingRemoved,
				(composition) => ({
					...composition,
					layers: composition.layers.filter(
						(id) => state.compositionLayerIdToComposition[id] !== compositionId,
					),
				}),
			);

			return {
				...state,
				compositions,
				layers: removeKeysFromMap(state.layers, layerIds),
				properties: removeKeysFromMap(state.properties, propertyIds),
				compositionLayerIdToComposition: removeKeysFromMap(
					state.compositionLayerIdToComposition,
					compLayerLayerIds,
				),
			};
		}

		case getType(compositionActions.setCompositionDimension): {
			const { compositionId, which, value } = action.payload;
			return {
				...state,
				compositions: {
					...state.compositions,
					[compositionId]: {
						...state.compositions[compositionId],
						[which]: value,
					},
				},
			};
		}

		case getType(compositionActions.setPropertyValue): {
			const { propertyId, value } = action.payload;
			return {
				...state,
				properties: modifyItemInUnionMap(
					state.properties,
					propertyId,
					(item: CompositionProperty) => ({
						...item,
						value: value as any,
					}),
				),
			};
		}

		case getType(compositionActions.setPropertyGroupCollapsed): {
			const { propertyId, collapsed } = action.payload;
			return {
				...state,
				properties: modifyItemInUnionMap(
					state.properties,
					propertyId,
					(item: CompositionPropertyGroup) => ({
						...item,
						collapsed,
					}),
				),
			};
		}

		case getType(compositionActions.setPropertyTimelineId): {
			const { propertyId, timelineId } = action.payload;
			return {
				...state,
				properties: modifyItemInUnionMap(
					state.properties,
					propertyId,
					(item: CompositionProperty) => ({
						...item,
						timelineId,
					}),
				),
			};
		}

		case getType(compositionActions.createLayer): {
			const { compositionId, type, options } = action.payload;

			const composition = state.compositions[compositionId];

			const compositionLayerReferenceId = options?.compositionLayerReferenceId;

			if (type === LayerType.Composition && !compositionLayerReferenceId) {
				throw new Error(
					"A 'compositionLayerReferenceId' must be provided when creating a composition layer",
				);
			}

			const { layer, propertiesToAdd } = createLayer(
				state,
				type,
				compositionId,
				type === LayerType.Composition
					? { defaultName: state.compositions[compositionLayerReferenceId!].name }
					: undefined,
			);

			const layers = [...composition.layers];
			layers.splice(options?.insertLayerIndex ?? 0, 0, layer.id);

			return {
				...state,
				compositions: {
					...state.compositions,
					[composition.id]: { ...composition, layers },
				},
				layers: addListToMap(state.layers, [layer], "id"),
				properties: addListToMap(state.properties, propertiesToAdd, "id"),
				compositionLayerIdToComposition:
					type === LayerType.Composition
						? {
								...state.compositionLayerIdToComposition,
								[layer.id]: compositionLayerReferenceId!,
						  }
						: state.compositionLayerIdToComposition,
			};
		}

		case getType(compositionActions.removeLayer): {
			const { layerId } = action.payload;
			const layer = state.layers[layerId];
			const comp = state.compositions[layer.compositionId];

			return {
				...state,
				compositions: {
					...state.compositions,
					[comp.id]: {
						...comp,
						layers: comp.layers.filter((id) => id !== layer.id),
					},
				},
				layers: removeKeysFromMap(state.layers, [layer.id]),
				properties: removeKeysFromMap(state.properties, layer.properties),
			};
		}

		case getType(compositionActions.setLayerGraphId): {
			const { layerId, graphId } = action.payload;
			return {
				...state,
				layers: modifyItemsInMap(state.layers, layerId, (layer) => ({
					...layer,
					graphId,
				})),
			};
		}

		case getType(compositionActions.setLayerName): {
			const { layerId, name } = action.payload;
			return {
				...state,
				layers: modifyItemsInMap(state.layers, layerId, (layer) => ({
					...layer,
					name,
				})),
			};
		}

		case getType(compositionActions.setLayerCollapsed): {
			const { layerId, collapsed } = action.payload;
			return {
				...state,
				layers: modifyItemsInMap(state.layers, layerId, (layer) => ({
					...layer,
					collapsed,
				})),
			};
		}

		case getType(compositionActions.setLayerParentLayerId): {
			const { layerId, parentLayerId } = action.payload;
			return {
				...state,
				layers: modifyItemsInMap(state.layers, layerId, (layer) => ({
					...layer,
					parentLayerId,
				})),
			};
		}

		default:
			return state;
	}
};
