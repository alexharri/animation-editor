import { areaActions } from "~/area/state/areaActions";
import { AreaType } from "~/constants";
import { constructGraphEditorContext, GraphEditorContext } from "~/graphEditor/graphEditorContext";
import { getGraphEditorTimelineTargetObject } from "~/graphEditor/graphEditorUtils";
import { isKeyDown } from "~/listener/keyboard";
import { createOperation } from "~/state/operation";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { timelineActions, timelineSelectionActions } from "~/timeline/timelineActions";
import { timelineAreaActions } from "~/timeline/timelineAreaReducer";
import { Timeline, TimelineKeyframe } from "~/timeline/timelineTypes";
import { getTimelineSelection } from "~/timeline/timelineUtils";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { isVecInRect, rectOfTwoVecs } from "~/util/math";

const getYUpperLower = (viewport: Rect, mousePositionGlobal: Vec2): [number, number] => {
	const { y } = mousePositionGlobal;
	const buffer = 5;
	const yUpper = Math.max(0, viewport.top - (y - buffer));
	const yLower = Math.max(0, y + buffer - (viewport.top + viewport.height));
	return [yUpper, yLower];
};

const PAN_FAC = 0.0004;

export const graphEditorHandlers = {
	onMouseDown: (
		e: React.MouseEvent,
		options: {
			areaId: string;
			viewport: Rect;
		},
	): void => {
		const { areaId, viewport } = options;
		const ctx = constructGraphEditorContext(Vec2.fromEvent(e), areaId, viewport);

		const { timelines } = ctx;

		for (let ti = 0; ti < timelines.length; ti += 1) {
			const timeline = timelines[ti];

			const target = getGraphEditorTimelineTargetObject(
				timeline,
				ctx.mousePosition.viewport,
				ctx.normalToViewport,
			);

			switch (target.type) {
				case "keyframe": {
					if (isKeyDown("Alt")) {
						graphEditorHandlers.onKeyframeAltMouseDown(
							ctx,
							timeline,
							target.keyframeIndex,
						);
						return;
					}

					graphEditorHandlers.onKeyframeMouseDown(ctx, timeline, target.keyframeIndex);
					return;
				}

				case "control_point": {
					graphEditorHandlers.onControlPointMouseDown(
						ctx,
						timeline,
						target.keyframeIndex,
						target.which,
					);
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
		const wasShiftDown = isKeyDown("Shift");
		mouseDownMoveAction(ctx.mousePosition.global, {
			translate: ctx.globalToNormal,
			keys: [],
			beforeMove: () => {},
			mouseMove: (params, { mousePosition, initialMousePosition }) => {
				const dragSelectRect = rectOfTwoVecs(
					initialMousePosition.normal,
					mousePosition.normal,
				);

				params.dispatch(
					areaActions.dispatchToAreaState(
						options.areaId,
						timelineAreaActions.setFields({ dragSelectRect }),
					),
				);
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved) {
					params.dispatch(
						timelines.map((timeline) => timelineSelectionActions.clear(timeline.id)),
					);
					params.submitAction("Clear timeline selection");
					return;
				}

				const op = createOperation(params);

				if (!wasShiftDown) {
					params.dispatch(
						timelines.map((timeline) => timelineSelectionActions.clear(timeline.id)),
					);
				}

				const { dragSelectRect } = getAreaActionState<AreaType.Timeline>(ctx.areaId);

				timelines.forEach((timeline) => {
					const keyframes = timeline.keyframes
						.filter((k) => {
							return isVecInRect(Vec2.new(k.index, k.value), dragSelectRect!);
						})
						.map((k) => k.id);
					op.add(timelineSelectionActions.addKeyframes(timeline.id, keyframes));
				});
				op.add(
					areaActions.dispatchToAreaState(
						options.areaId,
						timelineAreaActions.setFields({ dragSelectRect: null }),
					),
				);
				params.dispatch(op.actions);
				params.submitAction("Select keyframes");
			},
		});
	},

	onControlPointMouseDown: (
		ctx: GraphEditorContext,
		timeline: Timeline,
		keyframeIndex: number,
		direction: "left" | "right",
	) => {
		const { timelines, viewport, yBounds, yFac } = ctx;

		const k = timeline.keyframes[keyframeIndex];

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

		const boundsDiff = Math.abs(yBounds[0] - yBounds[1]);

		let yPan = 0;

		mouseDownMoveAction(ctx.mousePosition.global, {
			keys: ["Shift"],
			translate: (vec) => ctx.globalToNormal(vec).addY(yPan),
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
					timelineActions.setKeyframeReflectControlPoints(
						timeline.id,
						keyframeIndex,
						reflect,
					),
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

				const moveVector = _moveVector.normal.copy();

				const { x: indexShift, y: valueShift } = moveVector;

				const indexDiff =
					direction === "left"
						? timeline.keyframes[keyframeIndex].index -
						  timeline.keyframes[keyframeIndex - 1].index
						: timeline.keyframes[keyframeIndex + 1].index -
						  timeline.keyframes[keyframeIndex].index;

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
				const op = createOperation(params);

				timelines.forEach(({ id }) => {
					op.add(timelineActions.setYBounds(id, null), timelineActions.setYPan(id, 0));
				});

				if (!hasMoved) {
					if (!altDownAtMouseDown) {
						params.cancelAction();
						return;
					}

					op.add(
						timelineActions.setKeyframeControlPoint(
							timeline.id,
							keyframeIndex,
							direction,
							null,
						),
					);
					params.dispatch(op.actions);
					params.submitAction("Remove control point");
					return;
				} else {
					const { timelineSelectionState } = getActionState();

					op.add(
						...timelines.map(({ id }) =>
							timelineActions.applyControlPointShift(id, timelineSelectionState[id]),
						),
					);
				}

				params.dispatch(op.actions);
				params.submitAction("Move control point");
			},
		});
	},

	onKeyframeAltMouseDown: (
		ctx: GraphEditorContext,
		timeline: Timeline,
		keyframeIndex: number,
	) => {
		const { timelines, viewport, yBounds } = ctx;

		const k = timeline.keyframes[keyframeIndex];

		const boundsDiff = Math.abs(yBounds[0] - yBounds[1]);

		let yPan = 0;
		let direction!: "left" | "right";

		mouseDownMoveAction(ctx.mousePosition.global, {
			keys: ["Shift"],
			translate: (vec) => ctx.globalToNormal(vec).addY(yPan),
			beforeMove: (params) => {
				const op = createOperation(params);

				// Clear timeline selection and select only the keyframe we are
				// operating on.
				op.add(...timelines.map((timeline) => timelineSelectionActions.clear(timeline.id)));
				op.add(timelineSelectionActions.toggleKeyframe(timeline.id, k.id));

				// Lock yBounds and init pan for all timelines.
				//
				// In the future the yBound should be controll via Timeline's
				// area state.
				timelines.forEach(({ id }) => {
					op.add(timelineActions.setYBounds(id, yBounds), timelineActions.setYPan(id, 0));
				});

				// When creating control points, they are always initialized to reflect
				op.add(
					timelineActions.setKeyframeReflectControlPoints(
						timeline.id,
						keyframeIndex,
						true,
					),
				);

				params.dispatch(op.actions);
			},
			tickShouldUpdate: ({ mousePosition }) => {
				const [yUpper, yLower] = getYUpperLower(viewport, mousePosition.global);
				return !!(yUpper || yLower);
			},
			mouseMove: (params, { moveVector: _moveVector, mousePosition, keyDown, firstMove }) => {
				const op = createOperation(params);

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
					op.add(...timelines.map((t) => timelineActions.setYPan(t.id, yPan)));
				}

				const moveVector = _moveVector.normal.copy();
				let { x: indexShift, y: valueShift } = moveVector;

				if (keyDown.Shift) {
					valueShift = 0;
				}

				op.add(
					timelineActions.setNewControlPointShift(timeline.id, {
						keyframeIndex: keyframeIndex,
						direction,
						indexShift,
						valueShift,
					}),
				);
				params.dispatch(op.actions);
			},
			mouseUp: (params, hasMoved) => {
				const op = createOperation(params);

				if (!hasMoved) {
					// Alt click on keyframe. Remove current control points.
					op.add(
						timelineActions.setKeyframeControlPoint(
							timeline.id,
							keyframeIndex,
							"left",
							null,
						),
						timelineActions.setKeyframeControlPoint(
							timeline.id,
							keyframeIndex,
							"right",
							null,
						),
					);
					params.dispatch(op.actions);
					params.submitAction("Remove keyframe control points");
					return;
				}

				timelines.forEach(({ id }) => {
					op.add(timelineActions.setYBounds(id, null), timelineActions.setYPan(id, 0));
				});

				const timelineSelectionState = getActionState().timelineSelectionState;
				timelines.forEach(({ id }) => {
					const selection = timelineSelectionState[id];
					op.add(timelineActions.applyControlPointShift(id, selection));
				});

				params.dispatch(op.actions);
				params.submitAction("Create control points");
			},
		});
	},

	onKeyframeMouseDown: (
		ctx: GraphEditorContext,
		timeline: Timeline,
		keyframeIndex: number,
	): void => {
		const { timelines, yBounds, yFac } = ctx;

		const selection = getTimelineSelection(timeline.id);
		const keyframe = timeline.keyframes[keyframeIndex];
		const additiveSelection = isKeyDown("Shift") || isKeyDown("Command");

		const boundsDiff = Math.abs(yBounds[0] - yBounds[1]);
		let yPan = 0;

		mouseDownMoveAction(ctx.mousePosition.global, {
			keys: ["Shift"],
			translate: (vec) => ctx.globalToNormal(vec).addY(yPan),
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
				const [yUpper, yLower] = getYUpperLower(ctx.viewport, mousePosition.global);
				return !!(yUpper || yLower);
			},
			mouseMove: (params, { moveVector: _moveVector, mousePosition, keyDown, firstMove }) => {
				if (firstMove) {
					params.dispatch(
						timelines.map((t) => timelineActions.setYBounds(t.id, yBounds)),
					);
					params.dispatch(timelines.map((t) => timelineActions.setYPan(t.id, 0)));
				}

				const [yUpper, yLower] = getYUpperLower(ctx.viewport, mousePosition.global);

				if (yLower) {
					yPan -= yLower * boundsDiff * PAN_FAC;
				} else if (yUpper) {
					yPan += yUpper * boundsDiff * PAN_FAC;
				}

				if (yLower || yUpper) {
					params.dispatch(timelines.map((t) => timelineActions.setYPan(t.id, yPan)));
				}

				const moveVector = _moveVector.normal.copy();

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
					toDispatch.push(
						timelineActions.setYBounds(id, null),
						timelineActions.setYPan(id, 0),
						timelineActions.submitIndexAndValueShift(id, getTimelineSelection(id)),
					);
				}

				params.dispatch(toDispatch);
				params.submitAction("Move selected keyframes", { allowIndexShift: true });
			},
		});
	},
};
