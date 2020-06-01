import {
	transformGlobalToTimelinePosition,
	getTimelineYBoundsFromPaths,
	timelineKeyframesToPathList,
	getControlPointAsVector,
	getTimelineSelection,
} from "~/timeline/timelineUtils";
import { Timeline, TimelineKeyframeControlPoint } from "~/timeline/timelineTypes";
import {
	getDistance as _getDistance,
	capToRange,
	interpolate,
	getDistance,
	getAngleRadians,
	rotateVec2CCW,
} from "~/util/math";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { timelineActions } from "~/timeline/timelineActions";
import { isKeyDown } from "~/listener/keyboard";
import { createToTimelineViewportY, createToTimelineViewportX } from "~/timeline/renderTimeline";
import { getActionState } from "~/state/stateUtils";

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

		const paths = timelines.reduce<Array<CubicBezier | Line>>((arr, timeline) => {
			arr.push(...timelineKeyframesToPathList(timeline.keyframes));
			return arr;
		}, []);
		const yBounds = getTimelineYBoundsFromPaths(timelines, paths);

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

		let upToken: string;
		const moveToken = addListener.repeated("mousemove", (e) => {
			const mousePos = Vec2.fromEvent(e);
			if (getDistance(initialPos, mousePos) > 3) {
				removeListener(moveToken);
				removeListener(upToken);
				actions.controlPointMouseDown(
					params,
					timelineIndex,
					index,
					mousePos.x < initialPos.x ? "left" : "right",
					{
						...options,
						reflect: true,
						reflectLength: true,
					},
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
		timelineIndex: number,
		index: number,
		direction: "left" | "right",
		options: {
			reflect?: boolean;
			reflectLength?: boolean;
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { timelines, viewport, viewBounds, reflectLength = false } = options;

		const timeline = timelines[timelineIndex];

		let reflect = options.reflect;

		if (typeof reflect !== "boolean") {
			const shouldReflect = timeline.keyframes[index].reflectControlPoints;
			reflect = isKeyDown("Alt") ? !shouldReflect : shouldReflect;
		}

		const k = timeline.keyframes[index];
		const right = direction === "right";

		// If other control point doesn't exist, we can't reflect it.
		if (reflect && !(right ? k.controlPointLeft : k.controlPointRight)) {
			reflect = false;
		}

		const altDownAtMouseDown = isKeyDown("Alt");
		const k0 = timeline.keyframes[index + (right ? 0 : -1)];
		const k1 = timeline.keyframes[index + (right ? 0 : -1) + 1];
		const dist = k1.index - k0.index;
		const kDiff = k1.value - k0.value || 0.0001;

		const paths = timelines.reduce<Array<CubicBezier | Line>>((arr, timeline) => {
			arr.push(...timelineKeyframesToPathList(timeline.keyframes));
			return arr;
		}, []);
		const yBounds = getTimelineYBoundsFromPaths(timelines, paths);

		// Set bounds for all timelines
		timelines.forEach(({ id }) => {
			dispatch(timelineActions.setYBounds(id, yBounds));
			dispatch(timelineActions.setYPan(id, 0));
		});

		dispatch(timelineActions.setKeyframeReflectControlPoints(timeline.id, index, reflect));

		const setControlPoint = (dir: "left" | "right", cp: TimelineKeyframeControlPoint) => {
			dispatch(timelineActions.setKeyframeControlPoint(timeline.id, index, dir, cp));
		};

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

			const capToBoundsY = (vec: Vec2): Vec2 => {
				const newVec = vec.copy();
				newVec.y = capToRange(
					yBounds[1] + yPan - yLower * boundsDiff * PAN_FAC,
					yBounds[0] + yPan + yUpper * boundsDiff * PAN_FAC,
					newVec.y,
				);
				return newVec;
			};

			let moveVector = transformGlobalToTimelinePosition(mousePos, options)
				.addY(yPan)
				.apply(capToBoundsY);

			let tx = capToRange(0, 1, (moveVector.x - k0.index) / dist);
			const ty = (moveVector.y - k0.value) / kDiff;

			let value = kDiff * ty - (right ? 0 : kDiff);
			if (lastShift) {
				value = 0;
			}

			setControlPoint(direction, { tx, value, relativeToDistance: dist });

			// If we are not reflecting or at start/end of timeline, we are done.
			if (!reflect || !timeline.keyframes[index + (right ? -1 : 1)]) {
				return;
			}

			const _k0 = timeline.keyframes[index + (right ? -1 : 0)];
			const _k1 = timeline.keyframes[index + (right ? -1 : 0) + 1];
			const _dist = _k1.index - _k0.index;

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
			const toViewport = (vec: Vec2) => Vec2.new(toViewportX(vec.x), toViewportY(vec.y));

			const reflectAngle = () => {
				const cpl = k.controlPointLeft!;
				const cpr = k.controlPointRight!;

				const cprPos = (right
					? Vec2.new(interpolate(k0.index, k1.index, tx), k.value + value)
					: Vec2.new(interpolate(_k0.index, _k1.index, cpr.tx), k.value + cpr.value)
				).apply(toViewport);
				const cplPos = (right
					? Vec2.new(interpolate(_k0.index, _k1.index, cpl.tx), k.value + cpl.value)
					: Vec2.new(interpolate(k0.index, k1.index, tx), k.value + value)
				).apply(toViewport);

				let kpost = Vec2.new(k.index, k.value).apply(toViewport);

				// Get angle from k to cp
				const angle = getAngleRadians(kpost, right ? cprPos : cplPos);

				// Amplitude of the reflected cp
				const amplitude = getDistance(kpost, right ? cplPos : cprPos);

				const _moveVector = Vec2.new(amplitude, 0)
					.add(kpost)
					.apply((vec) => rotateVec2CCW(vec, angle - Math.PI, kpost))
					.addY(viewport.top)
					.addX(viewport.left)
					.apply((vec) => transformGlobalToTimelinePosition(vec, options))
					.addY(yPan);

				const _tx = capToRange(0, 1, (_moveVector.x - _k0.index) / _dist);
				setControlPoint(right ? "left" : "right", {
					tx: _tx,
					value: _moveVector.y - k.value,
					relativeToDistance: _dist,
				});
			};

			const reflectAngleAndAmplitude = () => {
				setControlPoint(right ? "left" : "right", {
					tx: right
						? capToRange(0, 1, 1 - tx * (dist / _dist))
						: capToRange(0, 1, (1 - tx) * (dist / _dist)),
					value: -value,
					relativeToDistance: _dist,
				});
			};

			// If reflectLength, we create the reflected cp if it doesn't exist
			if (reflectLength) {
				reflectAngleAndAmplitude();
				return;
			}

			// Reflected cp must exist for only its angle to be reflected
			if (timeline.keyframes[index][right ? "controlPointRight" : "controlPointLeft"]) {
				reflectAngle();
			}
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
			}

			submitAction("Move control point");
		});
	},
};

export const timelineHandlers = {
	onMouseDown: (
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
					timelineHandlers.onControlPointMouseDown(ti, i, "right", options);
					return;
				}

				if (cp1 && getDistanceInPx(cp1, mousePos) < MIN_DIST) {
					timelineHandlers.onControlPointMouseDown(ti, i + 1, "left", options);
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
							actions.keyframeAltMouseDown(params, ti, i, initialPos, options);
						});
						return;
					}

					timelineHandlers.onKeyframeMouseDown(mousePos, ti, i, options);
					return;
				}
			}
		}

		requestAction({ history: true }, ({ dispatch, submitAction }) => {
			timelines.forEach(({ id }) => dispatch(timelineActions.clearSelection(id)));
			submitAction("Clear timeline selection");
		});
	},

	onControlPointMouseDown: (
		timelineIndex: number,
		index: number,
		direction: "left" | "right",
		options: {
			reflect?: boolean;
			length: number;
			timelines: Timeline[];
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		requestAction({ history: true }, (params) => {
			actions.controlPointMouseDown(params, timelineIndex, index, direction, options);
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
