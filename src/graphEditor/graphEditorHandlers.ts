import { areaActions } from "~/area/state/areaActions";
import { AreaType } from "~/constants";
import {
	getGraphEditorYBoundsFromPaths,
	transformGlobalToGraphEditorPosition,
} from "~/graphEditor/graphEditorUtils";
import {
	createToGraphEditorViewportX,
	createToGraphEditorViewportY,
} from "~/graphEditor/renderGraphEditor";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { timelineActions, timelineSelectionActions } from "~/timeline/timelineActions";
import { timelineAreaActions } from "~/timeline/timelineAreaReducer";
import { Timeline, TimelineKeyframe } from "~/timeline/timelineTypes";
import {
	getControlPointAsVector,
	getTimelineSelection,
	timelineKeyframesToPathList,
} from "~/timeline/timelineUtils";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { getDistance, getDistance as _getDistance, isVecInRect, rectOfTwoVecs } from "~/util/math";

const getYUpperLower = (viewport: Rect, mousePositionGlobal: Vec2): [number, number] => {
	const { y } = mousePositionGlobal;
	const buffer = 5;
	const yUpper = Math.max(0, viewport.top - (y - buffer));
	const yLower = Math.max(0, y + buffer - (viewport.top + viewport.height));
	return [yUpper, yLower];
};

const getYFac = (
	viewport: Rect,
	options: {
		length: number;
		timelines: Timeline[];
		viewBounds: [number, number];
		viewport: Rect;
	},
) => {
	const timelinePaths = options.timelines.map((timeline) =>
		timelineKeyframesToPathList(timeline.keyframes),
	);

	const renderOptions = {
		timelines: options.timelines,
		length: options.length,
		viewBounds: options.viewBounds,
		width: viewport.width,
		height: viewport.height,
	};
	const toViewportY = createToGraphEditorViewportY(timelinePaths, renderOptions);
	const toViewportX = createToGraphEditorViewportX(renderOptions);
	return (toViewportX(1) - toViewportX(0)) / (toViewportY(1) - toViewportY(0));
};

const PAN_FAC = 0.0004;
const MIN_DIST = 6;

export const timelineHandlers = {
	onMouseDown: (
		e: React.MouseEvent,
		options: {
			timelineAreaId: string;
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	): void => {
		const { timelines } = options;

		const initialPos = Vec2.fromEvent(e);

		const mousePos = transformGlobalToGraphEditorPosition(initialPos, options);
		let getDistanceInPx: (a: Vec2, b: Vec2) => number;
		{
			const p0 = transformGlobalToGraphEditorPosition(Vec2.new(0, 0), options);
			const p1 = transformGlobalToGraphEditorPosition(Vec2.new(1, 1), options);

			const xt = p1.x - p0.x;
			const yt = p1.y - p0.y;

			getDistanceInPx = (a, b) => {
				const aScaled = a.scaleX(yt / xt).scale(1 / yt);
				const bScaled = b.scaleX(yt / xt).scale(1 / yt);
				return _getDistance(aScaled, bScaled);
			};
		}

		for (let ti = 0; ti < timelines.length; ti += 1) {
			const timeline = timelines[ti];
			const { keyframes } = timeline;

			// Check whether a control point was clicked
			for (let i = 0; i < keyframes.length - 1; i += 1) {
				const k0 = keyframes[i];
				const k1 = keyframes[i + 1];

				const cp0 = getControlPointAsVector("cp0", k0, k1);
				const cp1 = getControlPointAsVector("cp1", k0, k1);

				if (cp0 && getDistanceInPx(cp0, mousePos) < MIN_DIST) {
					timelineHandlers.onControlPointMouseDown(initialPos, ti, i, "right", options);
					return;
				}

				if (cp1 && getDistanceInPx(cp1, mousePos) < MIN_DIST) {
					timelineHandlers.onControlPointMouseDown(
						initialPos,
						ti,
						i + 1,
						"left",
						options,
					);
					return;
				}
			}

			// Check whether a keyframe was clicked
			for (let i = 0; i < keyframes.length; i += 1) {
				const keyframe = keyframes[i];
				const keyframePos = Vec2.new(keyframe.index, keyframe.value);
				if (getDistanceInPx(keyframePos, mousePos) < MIN_DIST) {
					if (isKeyDown("Alt")) {
						timelineHandlers.onKeyframeAltMouseDown(initialPos, ti, i, options);
						return;
					}

					timelineHandlers.onKeyframeMouseDown(initialPos, ti, i, options);
					return;
				}
			}
		}

		/**
		 * Did not select any entity on timeline.
		 *
		 * If user drags mouse, create a selection rect.
		 *
		 * If mouseup is fired without moving, clear selection.
		 */
		requestAction({ history: true }, ({ dispatch, submitAction, addListener }) => {
			let hasMoved = false;
			const wasShiftDown = isKeyDown("Shift");

			addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e);

				if (!hasMoved) {
					if (getDistance(initialPos, mousePos) < 5) {
						return;
					}

					hasMoved = true;
				}

				const dragSelectRect = rectOfTwoVecs(
					transformGlobalToGraphEditorPosition(initialPos, options),
					transformGlobalToGraphEditorPosition(mousePos, options),
				);

				dispatch(
					areaActions.dispatchToAreaState(
						options.timelineAreaId,
						timelineAreaActions.setFields({ dragSelectRect }),
					),
				);
			});

			addListener.once("mouseup", () => {
				if (!hasMoved) {
					timelines.forEach(({ id }) => dispatch(timelineSelectionActions.clear(id)));
					submitAction("Clear timeline selection");
					return;
				}

				if (!wasShiftDown) {
					timelines.forEach(({ id }) => dispatch(timelineSelectionActions.clear(id)));
				}

				const { dragSelectRect } = getAreaActionState<AreaType.Timeline>(
					options.timelineAreaId,
				);

				timelines.forEach((timeline) => {
					const keyframes = timeline.keyframes
						.filter((k) => {
							return isVecInRect(Vec2.new(k.index, k.value), dragSelectRect!);
						})
						.map((k) => k.id);
					dispatch(timelineSelectionActions.addKeyframes(timeline.id, keyframes));
				});
				dispatch(
					areaActions.dispatchToAreaState(
						options.timelineAreaId,
						timelineAreaActions.setFields({ dragSelectRect: null }),
					),
				);
				submitAction("Select keyframes");
			});
		});
	},

	onControlPointMouseDown: (
		initialMousePosition: Vec2,
		timelineIndex: number,
		index: number,
		direction: "left" | "right",
		options: {
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { timelines, viewport, viewBounds } = options;

		const timeline = timelines[timelineIndex];
		const k = timeline.keyframes[index];

		// Whether or not the angle of the other control point of the keyframe should
		// be reflected according the the control point being moved.
		const shouldReflect = k.reflectControlPoints;
		let reflect = isKeyDown("Alt") ? !shouldReflect : shouldReflect;

		const timelineSelectionState = getActionState().timelineSelectionState;
		const timelineSelectedKeyframes = timelines.map<
			Array<{ index: number; keyframe: TimelineKeyframe }>
		>((timeline) => {
			const selection = timelineSelectionState[timeline.id];

			if (!selection) {
				return [];
			}

			return timeline.keyframes
				.map((keyframe, index) => ({ keyframe, index }))
				.filter((item) => selection.keyframes[item.keyframe.id]);
		});

		const altDownAtMouseDown = isKeyDown("Alt");

		const timelinePaths = timelines.map((timeline) =>
			timelineKeyframesToPathList(timeline.keyframes),
		);
		const yBounds = getGraphEditorYBoundsFromPaths(
			viewBounds,
			options.length,
			timelines,
			timelinePaths,
		);
		const boundsDiff = Math.abs(yBounds[0] - yBounds[1]);

		const yFac = getYFac(viewport, options);

		let yPan = 0;

		mouseDownMoveAction(initialMousePosition, {
			keys: ["Shift"],
			translate: (vec) => transformGlobalToGraphEditorPosition(vec, options).addY(yPan),
			beforeMove: (params) => {
				// Add keyframe to selection if not part of current selection.
				//
				// If not part of current selection and shift key was not down, the current
				// timeline selection is cleared.
				const timelineSelectionState = getActionState().timelineSelectionState;
				const selected = timelineSelectionState[timeline.id]?.keyframes[k.id];
				if (!selected) {
					if (!isKeyDown("Shift")) {
						timelines.forEach((timeline) => {
							params.dispatch(timelineSelectionActions.clear(timeline.id));
						});
					}
					params.dispatch(timelineSelectionActions.toggleKeyframe(timeline.id, k.id));
				}

				if (altDownAtMouseDown) {
					// If alt was down, toggle the reflection preferences of all selected
					// keyframes in all active timelines.
					timelineSelectedKeyframes.forEach((ids, timelineIndex) => {
						const timeline = timelines[timelineIndex];
						ids.forEach(({ keyframe, index }) => {
							params.dispatch(
								timelineActions.setKeyframeReflectControlPoints(
									timeline.id,
									index,
									!keyframe.reflectControlPoints,
								),
							);
						});
					});
				}

				// Set mousedown keyframe specifically because `options.reflect` may
				// Have been provided.
				params.dispatch(
					timelineActions.setKeyframeReflectControlPoints(timeline.id, index, reflect),
				);
			},
			tickShouldUpdate: ({ mousePosition }) => {
				const [yUpper, yLower] = getYUpperLower(viewport, mousePosition.global);
				return !!(yUpper || yLower);
			},
			mouseMove: (params, { moveVector: _moveVector, mousePosition, keyDown, firstMove }) => {
				if (firstMove) {
					params.dispatch(
						timelines.map((t) => timelineActions.setYBounds(t.id, yBounds)),
					);
					params.dispatch(timelines.map((t) => timelineActions.setYPan(t.id, 0)));
				}

				const [yUpper, yLower] = getYUpperLower(viewport, mousePosition.global);

				if (yLower) {
					yPan -= yLower * boundsDiff * PAN_FAC;
				} else if (yUpper) {
					yPan += yUpper * boundsDiff * PAN_FAC;
				}

				if (yLower || yUpper) {
					params.dispatch(timelines.map((t) => timelineActions.setYPan(t.id, yPan)));
				}

				const moveVector = _moveVector.translated.copy();

				const { x: indexShift, y: valueShift } = moveVector;

				const indexDiff =
					direction === "left"
						? timeline.keyframes[index].index - timeline.keyframes[index - 1].index
						: timeline.keyframes[index + 1].index - timeline.keyframes[index].index;

				params.dispatch(
					timelines.map((t) =>
						timelineActions.setControlPointShift(t.id, {
							indexDiff,
							direction: direction,
							indexShift,
							valueShift,
							yFac,
							shiftDown: keyDown.Shift,
						}),
					),
				);
			},
			mouseUp: (params, hasMoved) => {
				timelines.forEach(({ id }) => {
					params.dispatch(timelineActions.setYBounds(id, null));
					params.dispatch(timelineActions.setYPan(id, 0));
				});

				if (!hasMoved) {
					if (!altDownAtMouseDown) {
						params.cancelAction();
						return;
					}

					params.dispatch(
						timelineActions.setKeyframeControlPoint(
							timeline.id,
							index,
							direction,
							null,
						),
					);
					params.submitAction("Remove control point");
					return;
				} else {
					const timelineSelectionState = getActionState().timelineSelectionState;

					params.dispatch(
						timelines.map(({ id }) =>
							timelineActions.applyControlPointShift(id, timelineSelectionState[id]),
						),
					);
				}

				params.submitAction("Move control point");
			},
		});
	},

	onKeyframeAltMouseDown: (
		initialMousePosition: Vec2,
		timelineIndex: number,
		index: number,
		options: {
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { timelines, viewport, viewBounds } = options;

		const timeline = timelines[timelineIndex];
		const k = timeline.keyframes[index];

		const timelinePaths = timelines.map((timeline) =>
			timelineKeyframesToPathList(timeline.keyframes),
		);
		const yBounds = getGraphEditorYBoundsFromPaths(
			viewBounds,
			options.length,
			timelines,
			timelinePaths,
		);
		const boundsDiff = Math.abs(yBounds[0] - yBounds[1]);

		let yPan = 0;
		let direction!: "left" | "right";

		mouseDownMoveAction(initialMousePosition, {
			keys: ["Shift"],
			translate: (vec) => transformGlobalToGraphEditorPosition(vec, options).addY(yPan),
			beforeMove: (params) => {
				// Clear timeline selection and select only the keyframe we are
				// operating on.
				params.dispatch(
					timelines.map((timeline) => timelineSelectionActions.clear(timeline.id)),
				);
				params.dispatch(timelineSelectionActions.toggleKeyframe(timeline.id, k.id));

				// Lock yBounds and init pan for all timelines.
				//
				// In the future the yBound should be controll via Timeline's
				// area state.
				timelines.forEach(({ id }) => {
					params.dispatch(timelineActions.setYBounds(id, yBounds));
					params.dispatch(timelineActions.setYPan(id, 0));
				});

				// When creating control points, they are always initialized to reflect
				params.dispatch(
					timelineActions.setKeyframeReflectControlPoints(timeline.id, index, true),
				);
			},
			tickShouldUpdate: ({ mousePosition }) => {
				const [yUpper, yLower] = getYUpperLower(viewport, mousePosition.global);
				return !!(yUpper || yLower);
			},
			mouseMove: (params, { moveVector: _moveVector, mousePosition, keyDown, firstMove }) => {
				if (firstMove) {
					direction = _moveVector.global.x > 0 ? "right" : "left";
				}

				const [yUpper, yLower] = getYUpperLower(viewport, mousePosition.global);

				if (yLower) {
					yPan -= yLower * boundsDiff * PAN_FAC;
				} else if (yUpper) {
					yPan += yUpper * boundsDiff * PAN_FAC;
				}

				if (yLower || yUpper) {
					params.dispatch(timelines.map((t) => timelineActions.setYPan(t.id, yPan)));
				}

				const moveVector = _moveVector.translated.copy();
				let { x: indexShift, y: valueShift } = moveVector;

				if (keyDown.Shift) {
					valueShift = 0;
				}

				params.dispatch(
					timelineActions.setNewControlPointShift(timeline.id, {
						keyframeIndex: index,
						direction,
						indexShift,
						valueShift,
					}),
				);
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved) {
					// Alt click on keyframe. Remove current control points.
					params.dispatch(
						timelineActions.setKeyframeControlPoint(timeline.id, index, "left", null),
						timelineActions.setKeyframeControlPoint(timeline.id, index, "right", null),
					);
					params.submitAction("Remove keyframe control points");
					return;
				}

				const toDispatch: any[] = [];

				timelines.forEach(({ id }) => {
					toDispatch.push(timelineActions.setYBounds(id, null));
					toDispatch.push(timelineActions.setYPan(id, 0));
				});

				const timelineSelectionState = getActionState().timelineSelectionState;
				timelines.forEach(({ id }) => {
					const selection = timelineSelectionState[id];
					toDispatch.push(timelineActions.applyControlPointShift(id, selection));
				});

				params.dispatch(toDispatch);
				params.submitAction("Create control points");
			},
		});
	},

	onKeyframeMouseDown: (
		initialMousePos: Vec2,
		timelineIndex: number,
		index: number,
		options: {
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	): void => {
		const { timelines, viewport, viewBounds } = options;
		const timeline = timelines[timelineIndex];

		const selection = getTimelineSelection(timeline.id);
		const keyframe = timeline.keyframes[index];

		const additiveSelection = isKeyDown("Shift") || isKeyDown("Command");

		const timelinePaths = timelines.map((timeline) =>
			timelineKeyframesToPathList(timeline.keyframes),
		);
		const yBounds = getGraphEditorYBoundsFromPaths(
			viewBounds,
			options.length,
			timelines,
			timelinePaths,
		);
		const boundsDiff = Math.abs(yBounds[0] - yBounds[1]);

		const yFac = getYFac(viewport, options);

		let yPan = 0;

		mouseDownMoveAction(initialMousePos, {
			keys: ["Shift"],
			translate: (vec) => transformGlobalToGraphEditorPosition(vec, options).addY(yPan),
			beforeMove: (params) => {
				if (additiveSelection) {
					params.dispatch(
						timelineSelectionActions.toggleKeyframe(timeline.id, keyframe.id),
					);
				} else if (!selection.keyframes[keyframe.id]) {
					// If the current node is not selected, we clear the selections of all timelines
					// we are operating on.
					params.dispatch(timelines.map(({ id }) => timelineSelectionActions.clear(id)));
					params.dispatch(
						timelineSelectionActions.toggleKeyframe(timeline.id, keyframe.id),
					);
				}
			},
			tickShouldUpdate: ({ mousePosition }) => {
				const [yUpper, yLower] = getYUpperLower(viewport, mousePosition.global);
				return !!(yUpper || yLower);
			},
			mouseMove: (params, { moveVector: _moveVector, mousePosition, keyDown, firstMove }) => {
				if (firstMove) {
					params.dispatch(
						timelines.map((t) => timelineActions.setYBounds(t.id, yBounds)),
					);
					params.dispatch(timelines.map((t) => timelineActions.setYPan(t.id, 0)));
				}

				const [yUpper, yLower] = getYUpperLower(viewport, mousePosition.global);

				if (yLower) {
					yPan -= yLower * boundsDiff * PAN_FAC;
				} else if (yUpper) {
					yPan += yUpper * boundsDiff * PAN_FAC;
				}

				if (yLower || yUpper) {
					params.dispatch(timelines.map((t) => timelineActions.setYPan(t.id, yPan)));
				}

				const moveVector = _moveVector.translated.copy();

				if (keyDown.Shift) {
					if (Math.abs(moveVector.x * yFac) > Math.abs(moveVector.y)) {
						moveVector.y = 0;
					} else {
						moveVector.x = 0;
					}
				}

				params.dispatch(
					timelines.map((t) =>
						timelineActions.setIndexAndValueShift(
							t.id,
							Math.round(moveVector.x),
							moveVector.y,
						),
					),
				);
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved) {
					params.submitAction("Select keyframe");
					return;
				}

				const toDispatch: any[] = [];

				for (const { id } of timelines) {
					toDispatch.push(timelineActions.setYBounds(id, null));
					toDispatch.push(timelineActions.setYPan(id, 0));
					toDispatch.push(
						timelineActions.submitIndexAndValueShift(id, getTimelineSelection(id)),
					);
				}

				params.dispatch(toDispatch);
				params.submitAction("Move selected keyframes", { allowIndexShift: true });
			},
		});
	},
};
