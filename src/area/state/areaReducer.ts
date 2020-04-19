import { ActionType, getType } from "typesafe-actions";
import { areaActions as actions, areaActions } from "~/area/state/areaActions";
import { AreaRowLayout, AreaLayout } from "~/types/areaTypes";
import { areaStateReducerRegistry } from "~/area/windows";
import { joinAreas } from "~/area/util/joinArea";
import { areaToRow } from "~/area/util/areaToRow";
import { computeAreaToParentRow } from "~/area/util/areaToParentRow";
import { CardinalDirection } from "~/types";
import { AreaType } from "~/constants";
import { areaInitialStates } from "~/area/state/areaInitialStates";
import { getSavedAreaState, saveAreaState } from "~/area/state/localAreaState";
import { store } from "~/state/store";

type AreaAction = ActionType<typeof actions>;

export interface AreaState {
	_id: number;
	rootId: string;
	joinPreview: null | {
		areaId: string | null;
		movingInDirection: CardinalDirection | null;
		eligibleAreaIds: string[];
	};
	layout: {
		[key: string]: AreaRowLayout | AreaLayout;
	};
	areas: {
		[key: string]: {
			type: AreaType;
			state: any;
		};
	};
}

(window as any).saveAreaState = () => {
	const state = store.getState();
	saveAreaState(state.area.state);
};

export const initialAreaState: AreaState = getSavedAreaState() || {
	_id: 15,
	layout: {
		"2": {
			type: "area_row",
			id: "2",
			areas: [
				{ size: 0.6997578692493946, id: "12" },
				{ size: 0.30024213075060535, id: "13" },
			],
			orientation: "vertical",
		},
		"12": {
			type: "area_row",
			id: "12",
			areas: [
				{ size: 0.5820198482194979, id: "14" },
				{ size: 0.4179801517805021, id: "15" },
			],
			orientation: "horizontal",
		},
		"13": { type: "area", id: "13" },
		"14": { type: "area", id: "14" },
		"15": { type: "area", id: "15" },
	},
	areas: {
		"13": {
			type: AreaType.Timeline,
			state: { timelineId: "0", viewBounds: [0.2, 1] },
		},
		"14": {
			type: AreaType.NodeEditor,
			state: { pan: Vec2.new(-92, -63), scale: 1, graphId: "0" },
		},
		"15": {
			type: AreaType.History,
			state: {},
		},
	},
	joinPreview: null,
	rootId: "2",
};

export const areaReducer = (state: AreaState, action: AreaAction): AreaState => {
	switch (action.type) {
		case getType(areaActions.setJoinAreasPreview): {
			const { areaId, from, eligibleAreaIds } = action.payload;
			return {
				...state,
				joinPreview: {
					areaId,
					movingInDirection: from,
					eligibleAreaIds,
				},
			};
		}
		case getType(areaActions.joinAreas): {
			const { areaRowId, areaIndex, mergeInto } = action.payload;

			const row = state.layout[areaRowId] as AreaRowLayout;
			const { area, removedAreaId } = joinAreas(row, areaIndex, mergeInto);

			const shouldRemoveRow = row.areas.length === 2;
			const areaToParentRow = computeAreaToParentRow(state);

			const newState = {
				...state,
				rootId: shouldRemoveRow && state.rootId === row.id ? area.id : state.rootId,
				layout: Object.keys(state.layout).reduce<AreaState["layout"]>((obj, id) => {
					if (id === removedAreaId) {
						return obj;
					}

					if (shouldRemoveRow && id === row.id) {
						return obj;
					}

					if (id === areaToParentRow[row.id]) {
						obj[id] = {
							...state.layout[id],
							areas: (state.layout[id] as AreaRowLayout).areas.map((x) =>
								x.id === row.id ? { id: area.id, size: x.size } : x,
							),
						} as AreaRowLayout;
					} else if (id === area.id) {
						obj[id] = area;
					} else {
						obj[id] = state.layout[id];
					}

					return obj;
				}, {}),
				areas: Object.keys(state.areas).reduce<AreaState["areas"]>((obj, key) => {
					if (key !== removedAreaId) {
						obj[key] = state.areas[key];
					}

					return obj;
				}, {}),
				joinPreview: null,
			};

			return newState;
		}

		case getType(areaActions.convertAreaToRow): {
			const { cornerParts, areaId, horizontal } = action.payload;

			const newState: AreaState = {
				...state,
				layout: { ...state.layout },
				areas: { ...state.areas },
			};

			const rowId = areaId;
			const idForOldArea = (++newState._id).toString();
			const idForNewArea = (++newState._id).toString();

			const row = areaToRow(rowId, idForOldArea, idForNewArea, horizontal, cornerParts);

			// Rename 'areaId' to 'idForOldArea' and delete the old 'areaId' area
			newState.areas[idForOldArea] = { ...newState.areas[areaId] };
			delete newState.areas[areaId];

			// Add new area to areas
			newState.areas[idForNewArea] = { ...newState.areas[idForOldArea] };

			// Add old and new layouts
			newState.layout[idForOldArea] = { type: "area", id: idForOldArea };
			newState.layout[idForNewArea] = { type: "area", id: idForNewArea };

			// Replace old area with 'row'
			newState.layout[areaId] = row;

			return newState;
		}

		case getType(areaActions.insertAreaIntoRow): {
			const { rowId, basedOnId, insertIndex } = action.payload;

			const row = state.layout[rowId] as AreaRowLayout;

			const areas = [...row.areas];

			const newAreaId = (state._id + 1).toString();

			areas.splice(insertIndex, 0, { id: newAreaId, size: 0 });

			return {
				...state,
				_id: state._id + 1,
				layout: {
					...state.layout,
					[row.id]: {
						...row,
						areas,
					},
					[newAreaId]: {
						type: "area",
						id: newAreaId,
					},
				},
				areas: {
					...state.areas,
					[newAreaId]: {
						...state.areas[basedOnId],
					},
				},
			};
		}

		case getType(areaActions.setRowSizes): {
			const { rowId, sizes } = action.payload;
			const row = state.layout[rowId];

			if (row.type !== "area_row") {
				throw new Error("Expected layout to be of type 'area_row'.");
			}

			if (row.areas.length !== sizes.length) {
				throw new Error("Expected row areas to be the same length as sizes.");
			}

			return {
				...state,
				layout: {
					...state.layout,
					[row.id]: {
						...row,
						areas: row.areas.map((area, i) => ({ ...area, size: sizes[i] })),
					},
				},
			};
		}

		case getType(areaActions.setAreaType): {
			const { areaId, type } = action.payload;

			const area = state.areas[areaId];

			return {
				...state,
				areas: {
					...state.areas,
					[areaId]: {
						...area,
						type,
						state: areaInitialStates[type],
					},
				},
			};
		}

		case getType(areaActions.dispatchToAreaState): {
			const { areaId, action: _action } = action.payload;

			const area = state.areas[areaId];

			return {
				...state,
				areas: {
					...state.areas,
					[areaId]: {
						...area,
						state: areaStateReducerRegistry[area.type](area.state, _action),
					},
				},
			};
		}

		default:
			return state;
	}
};
