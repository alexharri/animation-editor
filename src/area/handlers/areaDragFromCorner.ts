import { areaActions } from "~/area/state/areaActions";
import { AreaReducerState } from "~/area/state/areaReducer";
import { computeAreaToParentRow } from "~/area/util/areaToParentRow";
import { computeAreaToViewport } from "~/area/util/areaToViewport";
import { getAreaRootViewport } from "~/area/util/getAreaViewport";
import { AREA_MIN_CONTENT_WIDTH } from "~/constants";
import { requestAction } from "~/listener/requestAction";
import { getActionState } from "~/state/stateUtils";
import { CardinalDirection, IntercardinalDirection } from "~/types";
import { AreaRowLayout } from "~/types/areaTypes";
import { capToRange, interpolate, isVecInRect } from "~/util/math";
import { exceedsDirectionVector } from "~/util/math/exceedsDirectionVector";

const directionVectors = {
	n: { x: 0, y: 1 },
	s: { x: 0, y: -1 },
	w: { x: 1, y: 0 },
	e: { x: -1, y: 0 },
};

const oppositeDirectionVectors = {
	n: directionVectors.s,
	s: directionVectors.n,
	w: directionVectors.e,
	e: directionVectors.w,
};

const getEligibleAreaIndices = (areaState: AreaReducerState, row: AreaRowLayout, index: number) => {
	return [index - 1, index + 1].filter((i) => {
		if (i < 0 || i > row.areas.length - 1) {
			return false;
		}
		return areaState.layout[row.areas[i].id].type === "area";
	});
};

const getArrowDirection = (
	row: AreaRowLayout,
	oldAreaIndex: number,
	newAreaIndex: number,
): CardinalDirection => {
	if (row.orientation === "horizontal") {
		return newAreaIndex > oldAreaIndex ? "e" : "w";
	}
	return newAreaIndex > oldAreaIndex ? "s" : "n";
};

export const handleAreaDragFromCorner = (
	e: React.MouseEvent,
	corner: IntercardinalDirection,
	areaId: string,
	viewport: Rect,
) => {
	const initialMousePosition = Vec2.fromEvent(e);

	requestAction(
		{},
		({ addListener, dispatch, submitAction, cancelAction, performDiff, addDiff }) => {
			const areaState = getActionState().area;
			const areaToRow = computeAreaToParentRow(areaState);
			const areaToViewport = computeAreaToViewport(
				areaState.layout,
				areaState.rootId,
				getAreaRootViewport(),
			);

			// Row does not exist if the area we are operating on is the root area
			const row = areaState.layout[areaToRow[areaId]] as AreaRowLayout | null;

			const directionParts = corner.split("") as [CardinalDirection, CardinalDirection];

			// onMoveFn is set to handle mouse move events after the mouse has moved
			// in a specific direction.
			let onMoveFn: (mousePosition: Vec2) => void;

			let onMouseUpFn: () => void = () => {
				cancelAction();
			};

			function createNewArea(horizontal: boolean) {
				onMouseUpFn = () => {
					addDiff((diff) => diff.resizeAreas());
					submitAction("Create new area");
				};

				const getT = (vec: Vec2): number => {
					const viewportSize = horizontal ? viewport.width : viewport.height;
					const minT = AREA_MIN_CONTENT_WIDTH / viewportSize;

					const t0 = horizontal ? viewport.left : viewport.top;
					const t1 = horizontal
						? viewport.left + viewport.width
						: viewport.top + viewport.height;

					const val = horizontal ? vec.x : vec.y;
					return capToRange(minT, 1 - minT, (val - t0) / (t1 - t0));
				};

				// The area whose corner was clicked will be converted into an area with
				// two rows if either of the following apply:
				//
				//		1.	The area does not have a parent row.
				//		2.	The parent row's orientation does NOT equal the direction that the
				//			mouse was moved in to trigger the creation of the area.
				//
				if (!row || (row.orientation === "horizontal") !== horizontal) {
					dispatch(areaActions.convertAreaToRow(areaId, directionParts, horizontal));
					onMoveFn = (vec) => {
						const t = getT(vec);
						dispatch(areaActions.setRowSizes(areaId, [t, 1 - t]));
						performDiff((diff) => diff.resizeAreas());
					};
					return;
				}

				// The row exists and the mouse moved in the direction of the row's orientation.
				//
				// We insert the new area before the selected area if:
				//		1.	The mouse moved horizontally and one of the 'w' (west) corners was
				//			clicked.
				//		2.	OR the mouse moved vertically and one of the 'n' (north) corners
				//			was clicked.

				const areaIndex = row.areas.map((x) => x.id).indexOf(areaId);
				const insertIndex =
					areaIndex + (directionParts.indexOf(horizontal ? "w" : "n") !== -1 ? 0 : 1);

				dispatch(areaActions.insertAreaIntoRow(row.id, areaId, insertIndex));

				// The size to share between the area and the new area is the size of the area
				// before the action.
				const sizeToShare = row.areas[areaIndex].size;

				onMoveFn = (vec) => {
					const t = getT(vec);
					const sizes = [t, 1 - t].map((v) => interpolate(0, sizeToShare, v));
					const rowAreas = row.areas.map((x) => x.size);
					rowAreas.splice(insertIndex, 0, 0);
					rowAreas[areaIndex] = sizes[0];
					rowAreas[areaIndex + 1] = sizes[1];
					dispatch(areaActions.setRowSizes(row.id, rowAreas));
					performDiff((diff) => diff.resizeAreas());
				};
			}

			function joinAreas() {
				if (!row) {
					throw new Error("Expected row to be valid.");
				}

				let areaIndex = row.areas.map((x) => x.id).indexOf(areaId);
				let eligibleAreaIndices = getEligibleAreaIndices(areaState, row, areaIndex);

				const getEligibleAreaIds = (eligibleAreaIndices: number[]) =>
					eligibleAreaIndices.map((i) => row.areas[i].id);

				dispatch(
					areaActions.setJoinAreasPreview(
						null,
						null,
						getEligibleAreaIds(eligibleAreaIndices),
					),
				);

				let lastMousePosition: Vec2;

				onMoveFn = (vec) => {
					lastMousePosition = vec;

					for (let i = 0; i < eligibleAreaIndices.length; i += 1) {
						const eligibleAreaIndex = eligibleAreaIndices[i];
						const eligibleAreaId = row.areas[eligibleAreaIndex].id;

						if (!isVecInRect(vec, areaToViewport[eligibleAreaId])) {
							continue;
						}

						const arrowDirection = getArrowDirection(row, areaIndex, eligibleAreaIndex);
						const nextAreaId = row.areas[eligibleAreaIndices[i]].id;

						const mergeArea = areaIndex;
						const mergeInto = (eligibleAreaIndex - areaIndex) as -1 | 1;

						areaIndex = eligibleAreaIndex;
						eligibleAreaIndices = getEligibleAreaIndices(areaState, row, areaIndex);

						dispatch(
							areaActions.setJoinAreasPreview(
								nextAreaId,
								arrowDirection,
								getEligibleAreaIds(eligibleAreaIndices),
							),
						);
						performDiff((diff) => diff.resizeAreas());

						onMouseUpFn = () => {
							if (!isVecInRect(lastMousePosition, areaToViewport[eligibleAreaId])) {
								cancelAction();
								return;
							}

							dispatch(areaActions.joinAreas(row.id, mergeArea, mergeInto));
							addDiff((diff) => diff.resizeAreas());
							submitAction("Join areas");
						};
					}
				};
			}

			addListener.repeated("mousemove", (e) => {
				const vec = Vec2.fromEvent(e);

				if (onMoveFn) {
					onMoveFn(vec);
					return;
				}

				const moveVec = vec.sub(initialMousePosition);

				for (let i = 0; i < directionParts.length; i += 1) {
					const exceedsAxis = exceedsDirectionVector(
						directionVectors[directionParts[i]],
						AREA_MIN_CONTENT_WIDTH / 2,
						moveVec,
					);

					if (exceedsAxis) {
						const horizontal = exceedsAxis === "x";
						if (
							(horizontal ? viewport.width : viewport.height) <
							AREA_MIN_CONTENT_WIDTH * 2
						) {
							joinAreas();
							break;
						}

						createNewArea(horizontal);
						if (onMoveFn) {
							onMoveFn!(vec);
						}
						break;
					}

					const exceedsOpposite = exceedsDirectionVector(
						oppositeDirectionVectors[directionParts[i]],
						AREA_MIN_CONTENT_WIDTH / 2,
						moveVec,
					);

					if (exceedsOpposite && row) {
						joinAreas();
						break;
					}
				}
			});

			addListener.once("mouseup", () => {
				onMouseUpFn();
			});
		},
	);
};
