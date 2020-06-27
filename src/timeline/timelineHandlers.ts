import {
	transformGlobalToTimelinePosition,
	getTimelineYBoundsFromPaths,
	timelineKeyframesToPathList,
	getControlPointAsVector,
	getTimelineSelection,
} from "~/timeline/timelineUtils";
import { Timeline, TimelineKeyframe } from "~/timeline/timelineTypes";
import { getDistance as _getDistance, getDistance, rectOfTwoVecs, isVecInRect } from "~/util/math";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { timelineActions } from "~/timeline/timelineActions";
import { isKeyDown } from "~/listener/keyboard";
import { createToTimelineViewportY, createToTimelineViewportX } from "~/timeline/renderTimeline";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { areaActions } from "~/area/state/areaActions";
import { compositionTimelineAreaActions } from "~/composition/timeline/compositionTimelineAreaReducer";
import { AreaType } from "~/constants";

const PAN_FAC = 0.0004;
const MIN_DIST = 6;

const actions = {
	onLeftClickOutside: (
		e: React.MouseEvent,
		options: {
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { timelines } = options;

		e.preventDefault();

		requestAction(
			{ history: true },
			({ addListener, dispatch, cancelAction, submitAction }) => {
				const initialMousePos = Vec2.fromEvent(e);

				let hasMoved = false;

				addListener.repeated("mousemove", (e) => {
					const mousePos = Vec2.fromEvent(e);
					if (!hasMoved) {
						// We don't consider the mouse to be "moved" until the mouse has moved at least
						// 5px from where it was initially.
						if (getDistance(initialMousePos, mousePos) > 5) {
							hasMoved = true;
						} else {
							return;
						}
					}

					// const p0 = transformGlobalToTimelinePosition(initialMousePos, options);
					// const p1 = transformGlobalToTimelinePosition(mousePos, options);
					// const rect = rectOfTwoVecs(p0, p1);
					// dispatch(timelineActions.setDragSelectRect(timeline.id, rect));
				});

				addListener.once("mouseup", () => {
					if (hasMoved) {
						// const isAdditiveSelection = isKeyDown("Shift");
						// dispatch(
						// 	timelineActions.submitDragSelectRect(timeline.id, isAdditiveSelection),
						// );
						// submitAction("Modify selection");
						cancelAction();
					} else {
						timelines.forEach(({ id }) => dispatch(timelineActions.clearSelection(id)));
						submitAction("Modify selection");
					}
				});
			},
		);
	},

	keyframeMouseDown: (
		{ dispatch, addListener, submitAction }: RequestActionParams,
		initialMousePos: Vec2,
		timelineIndex: number,
		index: number,
		options: {
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { timelines, viewport } = options;
		const timeline = timelines[timelineIndex];

		const selection = getTimelineSelection(timeline.id);
		const keyframe = timeline.keyframes[index];

		const shiftKeyDownAtMouseDown = isKeyDown("Shift");

		if (shiftKeyDownAtMouseDown) {
			dispatch(timelineActions.toggleKeyframeSelection(timeline.id, keyframe.id));
		} else if (!selection.keyframes[keyframe.id]) {
			// If the current node is not selected, we clear the selections of all timelines
			// we are operating on.
			timelines.forEach(({ id }) => dispatch(timelineActions.clearSelection(id)));
			dispatch(timelineActions.toggleKeyframeSelection(timeline.id, keyframe.id));
		}

		const timelinePaths = timelines.map((timeline) =>
			timelineKeyframesToPathList(timeline.keyframes),
		);
		const yBounds = getTimelineYBoundsFromPaths(timelines, timelinePaths);

		let yPan = 0;
		let hasMoved = false;
		let mousePos: Vec2;
		let lastUsedMousePos: Vec2;
		let lastShift = isKeyDown("Shift");
		let hasSubmitted = false;

		addListener.repeated("mousemove", (e) => {
			if (!hasMoved) {
				hasMoved = true;

				timelines.forEach(({ id }) => {
					dispatch(timelineActions.setYBounds(id, yBounds));
					dispatch(timelineActions.setYPan(id, 0));
				});
			}

			mousePos = Vec2.fromEvent(e);
		});

		// Used for Shift moving (lock to more significant axis)
		let yFac: number;
		{
			const renderOptions = {
				timelines,
				length: options.length,
				viewBounds: options.viewBounds,
				width: viewport.width,
				height: viewport.height,
			};
			const toViewportY = createToTimelineViewportY(renderOptions);
			const toViewportX = createToTimelineViewportX(renderOptions);

			yFac = (toViewportX(1) - toViewportX(0)) / (toViewportY(1) - toViewportY(0));
		}

		const tick = () => {
			if (hasSubmitted) {
				return;
			}

			requestAnimationFrame(tick);

			if (!hasMoved) {
				return;
			}

			let shouldAlwaysUpdate = false;

			if (lastShift !== isKeyDown("Shift")) {
				lastShift = !lastShift;
				shouldAlwaysUpdate = true;
			}

			const buffer = 5;
			const boundsDiff = Math.abs(yBounds[0] - yBounds[1]);
			const yUpper = Math.max(0, viewport.top - (mousePos.y - buffer));
			const yLower = Math.max(0, mousePos.y + buffer - (viewport.top + viewport.height));

			if (yLower) {
				shouldAlwaysUpdate = true;
				yPan -= yLower * boundsDiff * PAN_FAC;
			} else if (yUpper) {
				shouldAlwaysUpdate = true;
				yPan += yUpper * boundsDiff * PAN_FAC;
			}

			if (yLower || yUpper) {
				timelines.forEach(({ id }) => dispatch(timelineActions.setYPan(id, yPan)));
			}

			if (shouldAlwaysUpdate || lastUsedMousePos !== mousePos) {
				lastUsedMousePos = mousePos;
				let moveVector = mousePos
					.apply((vec) => transformGlobalToTimelinePosition(vec, options))
					.addY(yPan);

				moveVector.y = Math.min(
					yBounds[0] + yPan + yUpper * boundsDiff * PAN_FAC,
					moveVector.y,
				);
				moveVector.y = Math.max(
					yBounds[1] + yPan - yLower * boundsDiff * PAN_FAC,
					moveVector.y,
				);

				moveVector = moveVector.sub(initialMousePos);

				if (lastShift) {
					if (Math.abs(moveVector.x * yFac) > Math.abs(moveVector.y)) {
						moveVector.y = 0;
					} else {
						moveVector.x = 0;
					}
				}

				timelines.forEach(({ id }) =>
					dispatch(
						timelineActions.setIndexAndValueShift(
							id,
							Math.round(moveVector.x),
							moveVector.y,
						),
					),
				);
			}
		};
		requestAnimationFrame(tick);

		addListener.once("mouseup", () => {
			hasSubmitted = true;

			if (!hasMoved) {
				submitAction("Select keyframe");
				return;
			}

			timelines.forEach(({ id }) => {
				dispatch(timelineActions.setYBounds(id, null));
				dispatch(timelineActions.setYPan(id, 0));
				dispatch(timelineActions.submitIndexAndValueShift(id, getTimelineSelection(id)));
			});
			submitAction("Move selected keyframes");
		});
	},

	keyframeAltMouseDown: (
		params: RequestActionParams,
		initialEv: React.MouseEvent,
		timelineIndex: number,
		index: number,
		initialPos: Vec2,
		options: {
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { timelines } = options;
		const { dispatch, addListener, removeListener, submitAction } = params;

		const timeline = timelines[timelineIndex];
		const initialMousePos = Vec2.fromEvent(initialEv);

		let upToken: string;
		const moveToken = addListener.repeated("mousemove", (e) => {
			const mousePos = Vec2.fromEvent(e);
			if (getDistance(initialPos, mousePos) > 3) {
				removeListener(moveToken);
				removeListener(upToken);
				actions.createKeyframeControlPoints(
					params,
					initialMousePos,
					timelineIndex,
					index,
					mousePos.x < initialPos.x ? "left" : "right",
					options,
				);
			}
		});
		upToken = addListener.once("mouseup", () => {
			dispatch(timelineActions.setKeyframeControlPoint(timeline.id, index, "left", null));
			dispatch(timelineActions.setKeyframeControlPoint(timeline.id, index, "right", null));
			dispatch(timelineActions.setKeyframeReflectControlPoints(timeline.id, index, true));
			submitAction("Remove keyframe control points");
		});
	},

	controlPointMouseDown: (
		{ addListener, dispatch, cancelAction, submitAction }: RequestActionParams,
		initialGlobalMousePos: Vec2,
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

		// Add keyframe to selection if not part of current selection.
		//
		// If not part of current selection and shift key was not down, the current
		// timeline selection is cleared.
		{
			const selected = getActionState().timelineSelection[timeline.id]?.keyframes[k.id];

			if (!selected) {
				if (!isKeyDown("Shift")) {
					timelines.forEach((timeline) => {
						dispatch(timelineActions.clearSelection(timeline.id));
					});
				}
				dispatch(timelineActions.toggleKeyframeSelection(timeline.id, k.id));
			}
		}

		// Whether or not the angle of the other control point of the keyframe should
		// be reflected according the the control point being moved.
		let reflect: boolean | undefined;

		const shouldReflect = k.reflectControlPoints;
		reflect = isKeyDown("Alt") ? !shouldReflect : shouldReflect;

		const timelineSelectionState = getActionState().timelineSelection;
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
		const yBounds = getTimelineYBoundsFromPaths(timelines, timelinePaths);

		// Lock yBounds and init pan for all timelines.
		//
		// In the future the yBound should be controll via CompositionTimeline's
		// area state.
		timelines.forEach(({ id }) => {
			dispatch(timelineActions.setYBounds(id, yBounds));
			dispatch(timelineActions.setYPan(id, 0));
		});

		if (altDownAtMouseDown) {
			// If alt was down, toggle the reflection preferences of all selected
			// keyframes in all active timelines.
			timelineSelectedKeyframes.forEach((ids, timelineIndex) => {
				const timeline = timelines[timelineIndex];
				ids.forEach(({ keyframe, index }) => {
					dispatch(
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
		dispatch(timelineActions.setKeyframeReflectControlPoints(timeline.id, index, reflect));

		let yPan = 0;
		let hasMoved = false;
		let mousePos: Vec2;
		let lastUsedMousePos: Vec2;
		let lastShift = isKeyDown("Shift");
		let hasSubmitted = false;

		addListener.repeated("mousemove", (e) => {
			hasMoved = true;
			mousePos = Vec2.fromEvent(e);
		});

		const tick = () => {
			if (hasSubmitted) {
				return;
			}
			requestAnimationFrame(tick);

			if (!hasMoved) {
				return;
			}

			let shouldAlwaysUpdate = false;

			if (lastShift !== isKeyDown("Shift")) {
				lastShift = !lastShift;
				shouldAlwaysUpdate = true;
			}

			const buffer = 5;
			const boundsDiff = Math.abs(yBounds[0] - yBounds[1]);
			const yUpper = Math.max(0, viewport.top - (mousePos.y - buffer));
			const yLower = Math.max(0, mousePos.y + buffer - (viewport.top + viewport.height));

			if (yLower) {
				shouldAlwaysUpdate = true;
				yPan -= yLower * boundsDiff * PAN_FAC;
			} else if (yUpper) {
				shouldAlwaysUpdate = true;
				yPan += yUpper * boundsDiff * PAN_FAC;
			}

			if (yLower || yUpper) {
				timelines.forEach(({ id }) => dispatch(timelineActions.setYPan(id, yPan)));
			}

			if (!shouldAlwaysUpdate && lastUsedMousePos === mousePos) {
				return;
			}

			lastUsedMousePos = mousePos;

			const timelineActionState = getActionState().timelines;

			const renderOptions = {
				length: options.length,
				timelines: timelines.map(({ id }) => timelineActionState[id]),
				height: viewport.height,
				width: viewport.width,
				viewBounds,
			};
			const toViewportY = createToTimelineViewportY(renderOptions);
			const toViewportX = createToTimelineViewportX(renderOptions);

			const initialPos = transformGlobalToTimelinePosition(initialGlobalMousePos, options);
			let pos = transformGlobalToTimelinePosition(mousePos, options).addY(yPan);

			const yFac = (toViewportX(1) - toViewportX(0)) / (toViewportY(1) - toViewportY(0));

			const { x: indexShift, y: valueShift } = pos.sub(initialPos);

			const indexDiff =
				direction === "left"
					? timeline.keyframes[index].index - timeline.keyframes[index - 1].index
					: timeline.keyframes[index + 1].index - timeline.keyframes[index].index;

			timelines.forEach((timeline) => {
				dispatch(
					timelineActions.setControlPointShift(timeline.id, {
						indexDiff,
						direction: direction,
						indexShift,
						valueShift,
						yFac,
						shiftDown: lastShift,
					}),
				);
			});
		};
		requestAnimationFrame(tick);

		addListener.once("mouseup", () => {
			hasSubmitted = true;
			timelines.forEach(({ id }) => {
				dispatch(timelineActions.setYBounds(id, null));
				dispatch(timelineActions.setYPan(id, 0));
			});

			if (!hasMoved) {
				if (!altDownAtMouseDown) {
					cancelAction();
					return;
				}

				dispatch(
					timelineActions.setKeyframeControlPoint(timeline.id, index, direction, null),
				);
				submitAction("Remove control point");
				return;
			} else {
				const timelineSelectionState = getActionState().timelineSelection;
				timelines.forEach(({ id }) => {
					const selection = timelineSelectionState[id];
					dispatch(timelineActions.applyControlPointShift(id, selection));
				});
			}

			submitAction("Move control point");
		});
	},

	createKeyframeControlPoints: (
		{ addListener, dispatch, cancelAction, submitAction }: RequestActionParams,
		initialGlobalMousePos: Vec2,
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
		const { timelines, viewport } = options;

		const timeline = timelines[timelineIndex];
		const k = timeline.keyframes[index];

		// Clear timeline selection and select only the keyframe we are
		// operating on.
		timelines.forEach((timeline) => {
			dispatch(timelineActions.clearSelection(timeline.id));
		});
		dispatch(timelineActions.toggleKeyframeSelection(timeline.id, k.id));

		const timelinePaths = timelines.map((timeline) =>
			timelineKeyframesToPathList(timeline.keyframes),
		);
		const yBounds = getTimelineYBoundsFromPaths(timelines, timelinePaths);

		// Lock yBounds and init pan for all timelines.
		//
		// In the future the yBound should be controll via CompositionTimeline's
		// area state.
		timelines.forEach(({ id }) => {
			dispatch(timelineActions.setYBounds(id, yBounds));
			dispatch(timelineActions.setYPan(id, 0));
		});

		// When creating control points, they are always initialized to reflect
		dispatch(timelineActions.setKeyframeReflectControlPoints(timeline.id, index, true));

		let yPan = 0;
		let hasMoved = false;
		let mousePos: Vec2;
		let lastUsedMousePos: Vec2;
		let lastShift = isKeyDown("Shift");
		let hasSubmitted = false;

		addListener.repeated("mousemove", (e) => {
			hasMoved = true;
			mousePos = Vec2.fromEvent(e);
		});

		const tick = () => {
			if (hasSubmitted) {
				return;
			}
			requestAnimationFrame(tick);

			if (!hasMoved) {
				return;
			}

			let shouldAlwaysUpdate = false;

			if (lastShift !== isKeyDown("Shift")) {
				lastShift = !lastShift;
				shouldAlwaysUpdate = true;
			}

			const buffer = 5;
			const boundsDiff = Math.abs(yBounds[0] - yBounds[1]);
			const yUpper = Math.max(0, viewport.top - (mousePos.y - buffer));
			const yLower = Math.max(0, mousePos.y + buffer - (viewport.top + viewport.height));

			if (yLower) {
				shouldAlwaysUpdate = true;
				yPan -= yLower * boundsDiff * PAN_FAC;
			} else if (yUpper) {
				shouldAlwaysUpdate = true;
				yPan += yUpper * boundsDiff * PAN_FAC;
			}

			if (yLower || yUpper) {
				timelines.forEach(({ id }) => dispatch(timelineActions.setYPan(id, yPan)));
			}

			if (!shouldAlwaysUpdate && lastUsedMousePos === mousePos) {
				return;
			}

			lastUsedMousePos = mousePos;

			const initialPos = transformGlobalToTimelinePosition(initialGlobalMousePos, options);
			let pos = transformGlobalToTimelinePosition(mousePos, options).addY(yPan);

			let { x: indexShift, y: valueShift } = pos.sub(initialPos);

			if (lastShift) {
				valueShift = 0;
			}

			dispatch(
				timelineActions.setNewControlPointShift(timeline.id, {
					keyframeIndex: index,
					direction,
					indexShift,
					valueShift,
				}),
			);
		};
		requestAnimationFrame(tick);

		addListener.once("mouseup", () => {
			hasSubmitted = true;
			timelines.forEach(({ id }) => {
				dispatch(timelineActions.setYBounds(id, null));
				dispatch(timelineActions.setYPan(id, 0));
			});

			if (!hasMoved) {
				cancelAction();
				return;
			}

			const timelineSelectionState = getActionState().timelineSelection;
			timelines.forEach(({ id }) => {
				const selection = timelineSelectionState[id];
				dispatch(timelineActions.applyControlPointShift(id, selection));
			});

			submitAction("Create control points");
		});
	},
};

export const timelineHandlers = {
	onMouseDown: (
		e: React.MouseEvent,
		options: {
			compositionTimelineAreaId: string;
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { timelines } = options;

		e.preventDefault();
		const initialPos = Vec2.fromEvent(e);

		const mousePos = transformGlobalToTimelinePosition(initialPos, options);
		let getDistanceInPx: (a: Vec2, b: Vec2) => number;
		{
			const p0 = transformGlobalToTimelinePosition(Vec2.new(0, 0), options);
			const p1 = transformGlobalToTimelinePosition(Vec2.new(1, 1), options);

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
					timelineHandlers.onControlPointMouseDown(e, ti, i, "right", options);
					return;
				}

				if (cp1 && getDistanceInPx(cp1, mousePos) < MIN_DIST) {
					timelineHandlers.onControlPointMouseDown(e, ti, i + 1, "left", options);
					return;
				}
			}

			// Check whether a keyframe was clicked
			for (let i = 0; i < keyframes.length; i += 1) {
				const keyframe = keyframes[i];
				const keyframePos = Vec2.new(keyframe.index, keyframe.value);
				if (getDistanceInPx(keyframePos, mousePos) < MIN_DIST) {
					if (isKeyDown("Alt")) {
						requestAction({ history: true }, (params) => {
							actions.keyframeAltMouseDown(params, e, ti, i, initialPos, options);
						});
						return;
					}

					timelineHandlers.onKeyframeMouseDown(mousePos, ti, i, options);
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
			const initialMousePos = Vec2.fromEvent(e);

			let hasMoved = false;
			const wasShiftDown = isKeyDown("Shift");

			addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e);

				if (!hasMoved) {
					if (getDistance(initialMousePos, mousePos) < 5) {
						return;
					}

					hasMoved = true;
				}

				const dragSelectRect = rectOfTwoVecs(
					transformGlobalToTimelinePosition(initialMousePos, options),
					transformGlobalToTimelinePosition(mousePos, options),
				);

				dispatch(
					areaActions.dispatchToAreaState(
						options.compositionTimelineAreaId,
						compositionTimelineAreaActions.setFields({ dragSelectRect }),
					),
				);
			});

			addListener.once("mouseup", () => {
				if (!hasMoved) {
					timelines.forEach(({ id }) => dispatch(timelineActions.clearSelection(id)));
					submitAction("Clear timeline selection");
					return;
				}

				if (!wasShiftDown) {
					timelines.forEach(({ id }) => dispatch(timelineActions.clearSelection(id)));
				}

				const { dragSelectRect } = getAreaActionState<AreaType.CompositionTimeline>(
					options.compositionTimelineAreaId,
				);

				timelines.forEach((timeline) => {
					const keyframes = timeline.keyframes
						.filter((k) => {
							return isVecInRect(Vec2.new(k.index, k.value), dragSelectRect!);
						})
						.map((k) => k.id);
					dispatch(timelineActions.addKeyframesToSelection(timeline.id, keyframes));
				});
				dispatch(
					areaActions.dispatchToAreaState(
						options.compositionTimelineAreaId,
						compositionTimelineAreaActions.setFields({ dragSelectRect: null }),
					),
				);
				submitAction("Select keyframes");
			});
		});
	},

	onControlPointMouseDown: (
		e: React.MouseEvent,
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
		requestAction({ history: true }, (params) => {
			actions.controlPointMouseDown(
				params,
				Vec2.fromEvent(e),
				timelineIndex,
				index,
				direction,
				options,
			);
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
	) => {
		requestAction({ history: true }, (params) => {
			actions.keyframeMouseDown(params, initialMousePos, timelineIndex, index, options);
		});
	},
};
