import { ActionType, createAction, getType } from "typesafe-actions";
import {
	Composition,
	CompositionLayer,
	CompositionProperty,
	CompositionPropertyGroup,
} from "~/composition/compositionTypes";
import { getDefaultLayerProperties } from "~/composition/util/compositionPropertyUtils";
import {
	removeKeysFromMap,
	addListToMap,
	modifyItemInMap,
	modifyItemInUnionMap,
} from "~/util/mapUtils";

const createLayerId = (layers: CompositionState["layers"]) =>
	(
		Math.max(
			0,
			...Object.keys(layers)
				.map((x) => parseInt(x))
				.filter((x) => !isNaN(x)),
		) + 1
	).toString();

const getNonDuplicateLayerName = (name: string, layers: CompositionLayer[]) => {
	const names = new Set(...layers.map((layer) => layer.name));

	if (!names.has(name)) {
		return name;
	}

	let i = 1;
	while (names.has(`${name} ${i}`)) {
		i++;
	}
	return `${name} ${i}`;
};

const createPropertyIdFn = (properties: CompositionState["properties"]) => {
	let n = 0;
	return () => {
		n++;
		return (
			Math.max(
				0,
				...Object.keys(properties)
					.map((x) => parseInt(x))
					.filter((x) => !isNaN(x)),
			) + n
		).toString();
	};
};

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
}

export const initialCompositionState: CompositionState = {
	compositions: {
		"0": {
			id: "0",
			layers: ["0"],
			frameIndex: 0,
			length: 500,
			width: 400,
			height: 400,
		},
	},
	layers: {},
	properties: {},
};

export const compositionActions = {
	clearCompositionSelection: createAction("comp/CLEAR_COMP_SELECTION", (action) => {
		return (compositionId: string) => action({ compositionId });
	}),

	toggleLayerSelection: createAction("comp/TOGGLE_LAYER_SELECTED", (action) => {
		return (compositionId: string, layerId: string) => action({ compositionId, layerId });
	}),

	togglePropertySelection: createAction("comp/TOGGLE_PROPERTY_SELECTED", (action) => {
		return (compositionId: string, propertyId: string) => action({ compositionId, propertyId });
	}),

	setCompositionDimension: createAction("comp/SET_COMPOSITION_DIMENSIONS", (action) => {
		return (compositionId: string, which: "width" | "height", value: number) =>
			action({ compositionId, which, value });
	}),

	setFrameIndex: createAction("comp/SET_FRAME_INDEX", (action) => {
		return (compositionId: string, frameIndex: number) => action({ compositionId, frameIndex });
	}),

	setPropertyValue: createAction("comp/SET_PROPERTY_VALUE", (action) => {
		return (propertyId: string, value: number) => action({ propertyId, value });
	}),

	setPropertyGroupCollapsed: createAction("comp/SET_PROP_GROUP_COLLAPSED", (action) => {
		return (propertyId: string, collapsed: boolean) => action({ propertyId, collapsed });
	}),

	setPropertyTimelineId: createAction("comp/SET_PROPERTY_TIMELINE_ID", (action) => {
		return (propertyId: string, timelineId: string) => action({ propertyId, timelineId });
	}),

	createRectLayer: createAction("comp/CREATE_RECT_LAYER", (action) => {
		return (compositionId: string) => action({ compositionId });
	}),

	removeLayer: createAction("comp/DELETE_LAYER", (action) => {
		return (layerId: string) => action({ layerId });
	}),

	setLayerName: createAction("comp/SET_LAYER_NAME", (action) => {
		return (layerId: string, name: string) => action({ layerId, name });
	}),

	setLayerGraphId: createAction("comp/SET_LAYER_GRAPH_ID", (action) => {
		return (layerId: string, graphId: string) => action({ layerId, graphId });
	}),
};

type Action = ActionType<typeof compositionActions>;

export const compositionReducer = (
	state = initialCompositionState,
	action: Action,
): CompositionState => {
	switch (action.type) {
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
						value,
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

		case getType(compositionActions.createRectLayer): {
			const { compositionId } = action.payload;

			const composition = state.compositions[compositionId];

			const layerId = createLayerId(state.layers);

			const { nestedProperties, topLevelProperties } = getDefaultLayerProperties({
				compositionId,
				layerId,
				createId: createPropertyIdFn(state.properties),
			});

			const layer: CompositionLayer = {
				compositionId,
				graphId: "",
				id: layerId,
				index: 0,
				length: composition.length,
				name: getNonDuplicateLayerName(
					"Rect Layer",
					composition.layers.map((id) => state.layers[id]),
				),
				properties: topLevelProperties.map((p) => p.id),
				type: "rect",
			};

			const propertiesToAdd = [...topLevelProperties, ...nestedProperties];

			return {
				...state,
				compositions: {
					...state.compositions,
					[composition.id]: {
						...composition,
						layers: [...composition.layers, layer.id],
					},
				},
				layers: {
					...state.layers,
					[layer.id]: layer,
				},
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

		case getType(compositionActions.setLayerGraphId): {
			const { layerId, graphId } = action.payload;
			return {
				...state,
				layers: modifyItemInMap(state.layers, layerId, (layer) => ({
					...layer,
					graphId,
				})),
			};
		}

		case getType(compositionActions.setLayerName): {
			const { layerId, name } = action.payload;
			return {
				...state,
				layers: modifyItemInMap(state.layers, layerId, (layer) => ({
					...layer,
					name,
				})),
			};
		}

		default:
			return state;
	}
};
