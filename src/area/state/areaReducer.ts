import { ActionType, getType } from "typesafe-actions";
import { areaStateReducerRegistry } from "~/area/areaRegistry";
import { areaActions as actions, areaActions } from "~/area/state/areaActions";
import { areaInitialStates } from "~/area/state/areaInitialStates";
import { computeAreaToParentRow } from "~/area/util/areaToParentRow";
import { areaToRow } from "~/area/util/areaToRow";
import { joinAreas } from "~/area/util/joinArea";
import { AreaType } from "~/constants";
import { CardinalDirection } from "~/types";
import { Area, AreaLayout, AreaRowLayout, AreaToOpen } from "~/types/areaTypes";

type AreaAction = ActionType<typeof actions>;

export interface AreaReducerState {
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
		[key: string]: Area;
	};
	areaToOpen: null | AreaToOpen;
}

export const initialAreaState: AreaReducerState = {
	_id: 0,
	layout: {
		"0": {
			type: "area",
			id: "0",
		},
	},
	areas: {
		"0": {
			type: AreaType.Project,
			state: {},
		},
	},
	joinPreview: null,
	rootId: "0",
	areaToOpen: null,
};

export const areaReducer = (state: AreaReducerState, action: AreaAction): AreaReducerState => {
	switch (action.type) {
		case getType(areaActions.setFields): {
			const { fields } = action.payload;
			return { ...state, ...fields };
		}

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
				layout: Object.keys(state.layout).reduce<AreaReducerState["layout"]>((obj, id) => {
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
				areas: Object.keys(state.areas).reduce<AreaReducerState["areas"]>((obj, key) => {
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

			const newState: AreaReducerState = {
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
			const { rowId, area, insertIndex } = action.payload;

			const row = state.layout[rowId] as AreaRowLayout;

			const areas = [...row.areas];

			const newAreaId = (state._id + 1).toString();

			areas.splice(insertIndex, 0, { id: newAreaId, size: 0 });

			return {
				...state,
				_id: state._id + 1,
				layout: {
					...state.layout,
					[row.id]: { ...row, areas },
					[newAreaId]: { type: "area", id: newAreaId },
				},
				areas: { ...state.areas, [newAreaId]: area },
			};
		}

		case getType(areaActions.wrapAreaInRow): {
			const { areaId, orientation } = action.payload;

			const areaToParentRow = computeAreaToParentRow(state);

			const parentRowId = areaToParentRow[areaId];

			if (!parentRowId) {
				// Is top-level area.
				throw new Error("Not implemented.");
			}

			const parentRow = { ...(state.layout[parentRowId] as AreaRowLayout) };

			const newRow: AreaRowLayout = {
				type: "area_row",
				id: (state._id + 1).toString(),
				areas: [{ size: 1, id: areaId }],
				orientation,
			};

			parentRow.areas = parentRow.areas.map((area) => {
				if (area.id === areaId) {
					return { ...area, id: newRow.id };
				}
				return area;
			});

			return {
				...state,
				_id: state._id + 1,
				layout: {
					...state.layout,
					[newRow.id]: newRow,
					[parentRow.id]: parentRow,
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
			const { areaId, type, initialState } = action.payload;

			const area = state.areas[areaId];

			return {
				...state,
				areas: {
					...state.areas,
					[areaId]: {
						...area,
						type,
						state: initialState || areaInitialStates[type],
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
						state: areaStateReducerRegistry[area.type](area.state as any, _action),
					},
				},
			};
		}

		default:
			return state;
	}
};
