import { ActionType, getType } from "typesafe-actions";
import { areaActions as actions, areaActions } from "~/area/state/areaActions";
import { AreaRowLayout, AreaLayout } from "~/types/areaTypes";
import { areaStateReducerRegistry } from "~/area/windows";
import { joinAreas } from "~/area/util/joinArea";
import { areaToRow } from "~/area/util/areaToRow";
import { computeAreaToParentRow } from "~/area/util/areaToParentRow";
import { CardinalDirection } from "~/types";
import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { areaInitialStates } from "~/area/state/areaInitialStates";

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

export const initialAreaState: AreaState = {
	_id: 11,
	layout: {
		0: {
			id: "0",
			type: "area_row",
			areas: [
				{ id: "2", size: 0.75 },
				{ id: "1", size: 0.25 },
				{ id: "8", size: 0.5 },
				{ id: "9", size: 0.25 },
			],
			orientation: "horizontal",
		},
		1: {
			id: "1",
			type: "area_row",
			areas: [
				{ id: "3", size: 0.5 },
				{ id: "4", size: 0.25 },
				{ id: "5", size: 0.25 },
			],
			orientation: "vertical",
		},
		2: { id: "2", type: "area" },
		3: { id: "3", type: "area" },
		4: {
			id: "4",
			type: "area_row",
			areas: [
				{ id: "6", size: 0.5 },
				{ id: "7", size: 0.5 },
			],
			orientation: "horizontal",
		},
		5: { id: "5", type: "area" },
		6: { id: "6", type: "area" },
		7: { id: "7", type: "area" },
		8: {
			id: "8",
			type: "area_row",
			areas: [
				{ id: "10", size: 0.1 },
				{ id: "11", size: 0.9 },
			],
			orientation: "vertical",
		},
		9: { id: "9", type: "area" },
		10: { id: "10", type: "area" },
		11: { id: "11", type: "area" },
	},
	areas: {
		2: { type: AreaType.NodeEditor, state: initialNodeEditorAreaState },
		3: { type: AreaType.VectorEditor, state: {} },
		5: { type: AreaType.VectorEditor, state: {} },
		6: { type: AreaType.VectorEditor, state: {} },
		7: { type: AreaType.VectorEditor, state: {} },
		9: { type: AreaType.VectorEditor, state: {} },
		10: { type: AreaType.VectorEditor, state: {} },
		11: { type: AreaType.VectorEditor, state: {} },
	},
	joinPreview: null,
	rootId: "0",
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
							areas: (state.layout[id] as AreaRowLayout).areas.map(x =>
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

			console.log(area);

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
