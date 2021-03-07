import { ActionType, createAction, getType } from "typesafe-actions";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import {
	Composition,
	CompoundProperty,
	Layer,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import {
	findLayerProperty,
	getChildPropertyIdsRecursive,
	reduceCompPropertiesAndGroups,
	reduceLayerPropertiesAndGroups,
} from "~/composition/compositionUtils";
import { layerFactory } from "~/composition/factories/layerFactory";
import { modifierPropertyGroupFactory } from "~/composition/factories/modifierPropertyGroupFactory";
import { getLayerModifierPropertyGroupId } from "~/composition/util/compositionPropertyUtils";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { LayerType, PropertyGroupName, RGBAColor, RGBColor, TransformBehavior } from "~/types";
import {
	addListToMap,
	createGenMapIdFn,
	mergeItemInMap,
	modifyItemsInMap,
	modifyItemsInUnionMap,
	removeKeysFromMap,
} from "~/util/mapUtils";

export interface CompositionState {
	compositions: {
		[compositionId: string]: Composition;
	};
	layers: {
		[layerId: string]: Layer;
	};
	properties: {
		[propertyId: string]: Property | CompoundProperty | PropertyGroup;
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

	setLayerIndex: createAction("comp/SET_LAYER_INDEX", (action) => {
		return (layerId: string, index: number) => action({ layerId, index });
	}),

	setLayerPlaybackIndex: createAction("comp/SET_LAYER_PLAYBACK_INDEX", (action) => {
		return (layerId: string, index: number) => action({ layerId, index });
	}),

	setLayerIndexAndLength: createAction("comp/SET_LAYER_INDEX_AND_LENGTH", (action) => {
		return (layerId: string, index: number, length: number) =>
			action({ layerId, index, length });
	}),

	moveLayers: createAction("comp/MOVE_LAYERS", (action) => {
		return (
			compositionId: string,
			moveLayers: {
				type: "above" | "below";
				layerId: string;
			},
			selectionState: CompositionSelectionState,
		) => action({ compositionId, moveLayers, selectionState });
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

	setCompositionLength: createAction("comp/SET_COMPOSITION_LENGTH", (action) => {
		return (compositionId: string, value: number) => action({ compositionId, value });
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
		return (propertyId: string, value: number | RGBColor | RGBAColor | TransformBehavior) =>
			action({ propertyId, value });
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

	createNonCompositionLayer: createAction("comp/CREATE_NON_COMP_LAYER", (action) => {
		return ({ layer, propertiesToAdd }: ReturnType<typeof layerFactory>) =>
			action({ layer, propertiesToAdd });
	}),

	createCompositionLayerReference: createAction("comp/CREATE_COMP_LAYER_REF", (action) => {
		return (layerId: string, compositionId: string) => action({ compositionId, layerId });
	}),

	removeLayer: createAction("comp/DELETE_LAYER", (action) => {
		return (layerId: string) => action({ layerId });
	}),

	removeProperty: createAction("comp/REMOVE_PROPERTY", (action) => {
		return (propertyId: string) => action({ propertyId });
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

	setPropertyGraphId: createAction("comp/SET_PROPERTY_GRAPH_ID", (action) => {
		return (propertyId: string, graphId: string) => action({ propertyId, graphId });
	}),

	setLayerParentLayerId: createAction("comp/SET_LAYER_PARENT_LAYER_ID", (action) => {
		return (layerId: string, parentLayerId: string) => action({ layerId, parentLayerId });
	}),

	addModifierToLayer: createAction("comp/ADD_MODIFIER_TO_LAYER", (action) => {
		return (
			layerId: string,
			propertyId: string,
			propertiesToAdd: Array<Property | CompoundProperty | PropertyGroup>,
		) => action({ layerId, propertyId, propertiesToAdd });
	}),

	addPropertyToPropertyGroup: createAction("comp/ADD_PROPERTY_TO_PROPERTY_GROUP", (action) => {
		return (
			addToPropertyGroup: string,
			propertyId: string,
			propertiesToAdd: Array<Property | CompoundProperty | PropertyGroup>,
		) => action({ addToPropertyGroup, propertyId, propertiesToAdd });
	}),

	moveModifier: createAction("comp/MOVE_MODIFIER", (action) => {
		return (modifierId: string, moveBy: -1 | 1) => action({ modifierId, moveBy });
	}),

	setPropertyMaintainProportions: createAction("comp/SET_PROP_MAINTAIN_PROPORTIONS", (action) => {
		return (propertyId: string, maintainProportions: boolean) =>
			action({ propertyId, maintainProportions });
	}),

	toggleLayerViewProperty: createAction("comp/TOGGLE_LAYER_VIEW_PROPERTY", (action) => {
		return (layerId: string, propertyId: string) => action({ layerId, propertyId });
	}),

	setLayerViewProperties: createAction("comp/SET_LAYER_VIEW_PROPERTIES", (action) => {
		return (layerId: string, propertyIds: string[]) => action({ layerId, propertyIds });
	}),

	setPropertyGroupViewProperties: createAction("comp/SET_GROUP_VIEW_PROPERTIES", (action) => {
		return (groupId: string, propertyIds: string[]) => action({ groupId, propertyIds });
	}),

	clearViewProperties: createAction("comp/CLEAR_VIEW_PROPERTIES", (action) => {
		return (layerId: string) => action({ layerId });
	}),

	setCompoundPropertySeparated: createAction("comp/SET_COMPOUND_SEPARATED", (action) => {
		return (propertyId: string, separated: boolean) => action({ propertyId, separated });
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

			const selection = compSelectionFromState(compositionId, selectionState);

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

		case getType(compositionActions.moveLayers): {
			const {
				compositionId,
				moveLayers: { layerId, type },
				selectionState,
			} = action.payload;

			const selection = compSelectionFromState(compositionId, selectionState);
			const composition = state.compositions[compositionId];

			const notSelected: string[] = [];
			const selected: string[] = [];

			for (const layerId of composition.layers) {
				if (selection.layers[layerId]) {
					selected.push(layerId);
				} else {
					notSelected.push(layerId);
				}
			}

			let insertIndex: number;

			if (!layerId) {
				insertIndex = 0;
			} else {
				insertIndex = notSelected.indexOf(layerId) + (type === "below" ? 1 : 0);
			}

			const layers = [...notSelected];
			layers.splice(insertIndex, 0, ...selected);

			return {
				...state,
				compositions: modifyItemsInMap(
					state.compositions,
					compositionId,
					(composition) => ({
						...composition,
						layers,
					}),
				),
			};
		}

		case getType(compositionActions.applyLayerLengthShift): {
			const { compositionId, layerLengthShift, selectionState } = action.payload;

			const selection = compSelectionFromState(compositionId, selectionState);

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

		case getType(compositionActions.setCompositionLength): {
			const { compositionId, value } = action.payload;
			return {
				...state,
				compositions: mergeItemInMap(state.compositions, compositionId, () => ({
					length: value,
				})),
			};
		}

		case getType(compositionActions.setPropertyValue): {
			const { propertyId, value } = action.payload;
			return {
				...state,
				properties: modifyItemsInUnionMap(
					state.properties,
					propertyId,
					(item: Property) => ({
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
				properties: modifyItemsInUnionMap(
					state.properties,
					propertyId,
					(item: PropertyGroup) => ({
						...item,
						collapsed,
						viewProperties: [],
					}),
				),
			};
		}

		case getType(compositionActions.setPropertyTimelineId): {
			const { propertyId, timelineId } = action.payload;
			return {
				...state,
				properties: modifyItemsInUnionMap(
					state.properties,
					propertyId,
					(item: Property) => ({
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

			const { layer, propertiesToAdd } = layerFactory({
				compositionId,
				type,
				compositionState: state,
				...(type === LayerType.Composition
					? { defaultName: state.compositions[compositionLayerReferenceId!].name }
					: {}),
			});

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

		case getType(compositionActions.createNonCompositionLayer): {
			const { layer, propertiesToAdd } = action.payload;

			return {
				...state,
				compositions: modifyItemsInMap(
					state.compositions,
					layer.compositionId,
					(composition) => ({
						...composition,
						layers: [...composition.layers, layer.id],
					}),
				),
				layers: addListToMap(state.layers, [layer], "id"),
				properties: addListToMap(state.properties, propertiesToAdd, "id"),
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

		case getType(compositionActions.removeProperty): {
			const { propertyId } = action.payload;

			const property = state.properties[propertyId];
			const layer = state.layers[property.layerId];

			const propertyIdsToRemove = [
				property.id,
				...getChildPropertyIdsRecursive(propertyId, state),
			];

			if (layer.properties.indexOf(propertyId) !== -1) {
				// Layer contains property directly, no need to find parent property
				return {
					...state,
					layers: modifyItemsInMap(state.layers, [layer.id], (layer) => ({
						...layer,
						properties: layer.properties.filter((id) => propertyId !== id),
					})),
					properties: removeKeysFromMap(state.properties, propertyIdsToRemove),
				};
			}

			// Property is not contained by layer directly, find parent property.
			const parentProperty = findLayerProperty(layer.id, state, (group) => {
				return group.type === "group" && group.properties.indexOf(propertyId) !== -1;
			});

			return {
				...state,
				properties: modifyItemsInUnionMap(
					removeKeysFromMap(state.properties, propertyIdsToRemove),
					parentProperty!.id,
					(group: PropertyGroup) => ({
						...group,
						properties: group.properties.filter((id) => propertyId !== id),
					}),
				),
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

		case getType(compositionActions.setPropertyGraphId): {
			const { propertyId, graphId } = action.payload;
			return {
				...state,
				properties: modifyItemsInUnionMap(
					state.properties,
					propertyId,
					(property: PropertyGroup) => ({
						...property,
						graphId,
					}),
				),
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

			const toClear = !collapsed
				? []
				: reduceLayerPropertiesAndGroups<string[]>(
						layerId,
						state,
						(acc, group) => {
							if (group.type === "property") {
								return acc;
							}

							if (group.viewProperties.length) {
								acc.push(group.id);
							}
							return acc;
						},
						[],
				  );

			return {
				...state,
				layers: modifyItemsInMap(state.layers, layerId, (layer) => ({
					...layer,
					collapsed,
					viewProperties: [],
				})),
				properties: modifyItemsInUnionMap(
					state.properties,
					toClear,
					(group: PropertyGroup) => {
						return { ...group, viewProperties: [], collapsed: true };
					},
				),
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

		case getType(compositionActions.addModifierToLayer): {
			const { layerId, propertyId, propertiesToAdd } = action.payload;

			const layer = { ...state.layers[layerId] };
			const newState = {
				...state,
				layers: { ...state.layers, [layer.id]: layer },
				properties: addListToMap(state.properties, propertiesToAdd, "id"),
			};

			const properties = layer.properties.map(
				(propertyId) => newState.properties[propertyId],
			);
			const propertyNames = properties.map((p) => (p.type === "group" ? p.name : null));

			let groupIndex = propertyNames.indexOf(PropertyGroupName.Modifiers);

			if (groupIndex === -1) {
				const createId = createGenMapIdFn(newState.properties);
				const { group, properties } = modifierPropertyGroupFactory({
					compositionId: layer.compositionId,
					layerId,
					createId,
				});
				newState.properties = addListToMap(
					newState.properties,
					[group, ...properties],
					"id",
				);
				layer.properties = [group.id, ...layer.properties];
				groupIndex = 0;
			}

			newState.properties = modifyItemsInUnionMap(
				newState.properties,
				layer.properties[groupIndex],
				(group: PropertyGroup) => ({
					...group,
					properties: [...group.properties, propertyId],
				}),
			);

			return newState;
		}

		case getType(compositionActions.addPropertyToPropertyGroup): {
			const { addToPropertyGroup, propertyId, propertiesToAdd } = action.payload;

			const newState = {
				...state,
				properties: addListToMap(state.properties, propertiesToAdd, "id"),
			};
			newState.properties = modifyItemsInUnionMap(
				newState.properties,
				addToPropertyGroup,
				(group: PropertyGroup) => ({
					...group,
					properties: [...group.properties, propertyId],
				}),
			);

			return newState;
		}

		case getType(compositionActions.moveModifier): {
			const { modifierId, moveBy } = action.payload;

			const modifier = state.properties[modifierId];
			const layerId = modifier.layerId;

			const modifierGroupId = getLayerModifierPropertyGroupId(layerId, state);

			if (!modifierGroupId) {
				throw new Error("Cannot move modfier. No Modifier group found.");
			}

			const modifierGroup = state.properties[modifierGroupId] as PropertyGroup;

			const index = modifierGroup.properties.indexOf(modifierId);

			if (index === -1) {
				throw new Error(
					`Cannot find modifier '${modifierId}' in group '${modifierGroupId}'.`,
				);
			}

			const properties = [...modifierGroup.properties];
			properties.splice(index, 1);
			properties.splice(index + moveBy, 0, modifierId);

			return {
				...state,
				properties: modifyItemsInUnionMap(
					state.properties,
					modifierGroupId,
					(item: PropertyGroup) => ({
						...item,
						properties,
					}),
				),
			};
		}

		case getType(compositionActions.setPropertyMaintainProportions): {
			const { maintainProportions, propertyId } = action.payload;
			return {
				...state,
				properties: modifyItemsInUnionMap(
					state.properties,
					propertyId,
					(item: CompoundProperty) => ({ ...item, maintainProportions }),
				),
			};
		}

		case getType(compositionActions.toggleLayerViewProperty): {
			const { layerId, propertyId } = action.payload;
			return {
				...state,
				layers: modifyItemsInMap(state.layers, layerId, (layer) => {
					const viewProperties = [...layer.viewProperties];
					const index = viewProperties.indexOf(propertyId);
					if (index === -1) {
						viewProperties.push(propertyId);
					} else {
						viewProperties.splice(index, 1);
					}
					return { ...layer, viewProperties };
				}),
			};
		}

		case getType(compositionActions.setLayerViewProperties): {
			const { layerId, propertyIds } = action.payload;
			return {
				...state,
				layers: modifyItemsInMap(state.layers, layerId, (layer) => {
					return { ...layer, viewProperties: propertyIds };
				}),
			};
		}

		case getType(compositionActions.setPropertyGroupViewProperties): {
			const { groupId, propertyIds } = action.payload;
			return {
				...state,
				properties: modifyItemsInUnionMap(
					state.properties,
					groupId,
					(group: PropertyGroup) => {
						return { ...group, viewProperties: propertyIds };
					},
				),
			};
		}

		case getType(compositionActions.clearViewProperties): {
			const { layerId } = action.payload;

			const toClear = reduceLayerPropertiesAndGroups<string[]>(
				layerId,
				state,
				(acc, group) => {
					if (group.type === "property") {
						return acc;
					}

					if (group.viewProperties.length) {
						acc.push(group.id);
					}
					return acc;
				},
				[],
			);

			return {
				...state,
				layers: modifyItemsInMap(state.layers, layerId, (layer) => {
					return { ...layer, viewProperties: [], collapsed: true };
				}),
				properties: modifyItemsInUnionMap(
					state.properties,
					toClear,
					(group: PropertyGroup) => {
						return { ...group, viewProperties: [], collapsed: true };
					},
				),
			};
		}

		case getType(compositionActions.setLayerIndex): {
			const { layerId, index } = action.payload;
			return { ...state, layers: mergeItemInMap(state.layers, layerId, () => ({ index })) };
		}

		case getType(compositionActions.setLayerPlaybackIndex): {
			const { layerId, index } = action.payload;
			return {
				...state,
				layers: mergeItemInMap(state.layers, layerId, () => ({
					playbackStartsAtIndex: index,
				})),
			};
		}

		case getType(compositionActions.setLayerIndexAndLength): {
			const { layerId, index, length } = action.payload;
			return {
				...state,
				layers: mergeItemInMap(state.layers, layerId, () => ({ index, length })),
			};
		}

		case getType(compositionActions.setCompoundPropertySeparated): {
			const { propertyId, separated } = action.payload;
			return {
				...state,
				properties: modifyItemsInUnionMap(
					state.properties,
					propertyId,
					(property: CompoundProperty) => {
						return { ...property, separated };
					},
				),
			};
		}

		default:
			return state;
	}
};
