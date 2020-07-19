import {
	transformGlobalToTrackPosition,
	getTimelineSelection,
	transformGlobalToTimelineX,
} from "~/timeline/timelineUtils";
import {
	getDistance as _getDistance,
	getDistance,
	rectOfTwoVecs,
	isVecInRect,
	valueWithinMargin,
	valueWithinRange,
} from "~/util/math";
import {
	getCompTimeTrackYPositions,
	getTimelineIdsReferencedByComposition,
	getTimelineIdsReferencedByLayer,
	reduceCompProperties,
} from "~/composition/timeline/compTimeUtils";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { COMP_TIME_LAYER_HEIGHT, AreaType, COMP_TIME_TRACK_START_END_X_MARGIN } from "~/constants";
import { requestAction } from "~/listener/requestAction";
import { isKeyDown } from "~/listener/keyboard";
import { areaActions } from "~/area/state/areaActions";
import { compTimeAreaActions } from "~/composition/timeline/compTimeAreaReducer";
import { timelineActions } from "~/timeline/timelineActions";
import { compositionActions } from "~/composition/state/compositionReducer";

const actions = {
	keyframeMouseDown: (
		initialMousePosition: Vec2,
		initialX: number,
		timelineId: string,
		index: number,
		options: {
			compositionId: string;
			compositionTimelineAreaId: string;
			panY: number;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		requestAction({ history: true }, (params) => {
			const { compositions: compositionState, timelines: timelineState } = getActionState();
			const composition = compositionState.compositions[options.compositionId];

			const timelineIds = getTimelineIdsReferencedByComposition(
				options.compositionId,
				compositionState,
			);

			const { viewport, viewBounds } = options;
			const timeline = timelineState[timelineId];

			const selection = getTimelineSelection(timelineId);
			const keyframe = timeline.keyframes[index];

			const commandKeyDownAtMouseDown = isKeyDown("Command");
			const shiftKeyDownAtMouseDown = isKeyDown("Shift");

			const additiveSelection = commandKeyDownAtMouseDown || shiftKeyDownAtMouseDown;

			if (additiveSelection) {
				params.dispatch(timelineActions.toggleKeyframeSelection(timeline.id, keyframe.id));
			} else if (!selection.keyframes[keyframe.id]) {
				// If the current node is not selected, we clear the selections of all timelines
				// we are operating on.
				params.dispatch(timelineIds.map((id) => timelineActions.clearSelection(id)));
				params.dispatch(timelineActions.toggleKeyframeSelection(timeline.id, keyframe.id));
			}

			let hasMoved = false;

			params.addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e);

				if (!hasMoved) {
					if (getDistance(mousePos, initialMousePosition) < 5) {
						return;
					}
					hasMoved = true;
				}

				let moveX = transformGlobalToTimelineX(
					mousePos.x,
					viewBounds,
					viewport.left,
					viewport.width,
					composition.length,
				);

				moveX = Math.round(moveX - initialX);

				params.dispatch(
					timelineIds.map((id) => timelineActions.setIndexAndValueShift(id, moveX, 0)),
				);
			});

			params.addListener.once("mouseup", () => {
				if (!hasMoved) {
					params.submitAction("Modify selection");
					return;
				}

				params.dispatch(
					timelineIds.reduce<any[]>((arr, id) => {
						arr.push(
							timelineActions.setYBounds(id, null),
							timelineActions.setYPan(id, 0),
							timelineActions.submitIndexAndValueShift(id, getTimelineSelection(id)),
						);
						return arr;
					}, []),
				);
				params.submitAction("Move selected keyframes");
			});
		});
	},

	layerMouseDown: (
		initialMousePosition: Vec2,
		layerId: string,
		initialX: number,
		options: {
			compositionId: string;
			compositionTimelineAreaId: string;
			panY: number;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		requestAction({ history: true }, (params) => {
			const { compositions: compositionState, compositionSelection } = getActionState();
			const composition = compositionState.compositions[options.compositionId];

			const timelineIds = getTimelineIdsReferencedByComposition(
				options.compositionId,
				compositionState,
			);

			const { viewport, viewBounds } = options;

			const commandKeyDownAtMouseDown = isKeyDown("Command");
			const shiftKeyDownAtMouseDown = isKeyDown("Shift");

			const additiveSelection = commandKeyDownAtMouseDown || shiftKeyDownAtMouseDown;

			if (additiveSelection) {
				params.dispatch(compositionActions.toggleLayerSelection(composition.id, layerId));

				// If the layer is being deselected, we clear the selection of all timelines
				// referenced by that layer.
				if (compositionSelection.layers[layerId]) {
					const layerTimelineIds = getTimelineIdsReferencedByLayer(
						layerId,
						compositionState,
					);
					params.dispatch(
						layerTimelineIds.map((id) => timelineActions.clearSelection(id)),
					);
				}
			} else if (!compositionSelection.layers[layerId]) {
				// If the current layer is not selected, we clear the selections of all timelines
				// in the composition
				params.dispatch(timelineIds.map((id) => timelineActions.clearSelection(id)));
				params.dispatch(compositionActions.toggleLayerSelection(composition.id, layerId));
				params.dispatch(
					compositionActions.removeLayersFromSelection(
						composition.id,
						composition.layers.filter((id) => id !== layerId),
					),
				);
			}

			let hasMoved = false;

			params.addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e);

				if (!hasMoved) {
					if (getDistance(mousePos, initialMousePosition) < 5) {
						return;
					}
					hasMoved = true;
				}

				let moveX = transformGlobalToTimelineX(
					mousePos.x,
					viewBounds,
					viewport.left,
					viewport.width,
					composition.length,
				);

				moveX = Math.round(moveX - initialX);

				params.dispatch(
					areaActions.dispatchToAreaState(
						options.compositionTimelineAreaId,
						compTimeAreaActions.setFields({ layerIndexShift: moveX }),
					),
				);
			});

			params.addListener.once("mouseup", () => {
				if (!hasMoved) {
					params.submitAction("Modify selection");
					return;
				}

				const { layerIndexShift } = getAreaActionState<AreaType.CompositionTimeline>(
					options.compositionTimelineAreaId,
				);
				params.dispatch(
					areaActions.dispatchToAreaState(
						options.compositionTimelineAreaId,
						compTimeAreaActions.setFields({ layerIndexShift: 0 }),
					),
				);

				const compositionSelection = getActionState().compositionSelection;
				params.dispatch(
					compositionActions.applyLayerIndexShift(
						composition.id,
						layerIndexShift,
						compositionSelection,
					),
				);

				params.submitAction("Move layer(s)");
			});
		});
	},

	layerStartOrEndMouseDown: (
		which: "start" | "end",
		layerId: string,
		initialMousePosition: Vec2,
		initialX: number,
		options: {
			compositionId: string;
			compositionTimelineAreaId: string;
			panY: number;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		requestAction({ history: true }, (params) => {
			const { compositions: compositionState, compositionSelection } = getActionState();
			const composition = compositionState.compositions[options.compositionId];

			const { viewport, viewBounds } = options;

			const timelineIds = getTimelineIdsReferencedByComposition(
				options.compositionId,
				compositionState,
			);

			const commandKeyDownAtMouseDown = isKeyDown("Command");
			const shiftKeyDownAtMouseDown = isKeyDown("Shift");

			const additiveSelection = commandKeyDownAtMouseDown || shiftKeyDownAtMouseDown;

			if (additiveSelection) {
				// If the layer is not selected, add it to selection.
				//
				// If the layer is selected, do not deselect it. I don't think it's
				// natural to deselect and resize other layers in the same action.
				if (!compositionSelection.layers[layerId]) {
					params.dispatch(
						compositionActions.toggleLayerSelection(composition.id, layerId),
					);
				}
			} else if (!compositionSelection.layers[layerId]) {
				params.dispatch(timelineIds.map((id) => timelineActions.clearSelection(id)));
				params.dispatch(compositionActions.toggleLayerSelection(composition.id, layerId));
				params.dispatch(
					compositionActions.removeLayersFromSelection(
						composition.id,
						composition.layers.filter((id) => id !== layerId),
					),
				);
			}

			let hasMoved = false;

			params.addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e);

				if (!hasMoved) {
					if (getDistance(mousePos, initialMousePosition) < 5) {
						return;
					}
					hasMoved = true;
				}

				let moveX = transformGlobalToTimelineX(
					mousePos.x,
					viewBounds,
					viewport.left,
					viewport.width,
					composition.length,
				);

				moveX = Math.round(moveX - initialX);

				const layerLengthShift: [number, number] =
					which === "start" ? [moveX, 0] : [0, moveX];

				params.dispatch(
					areaActions.dispatchToAreaState(
						options.compositionTimelineAreaId,
						compTimeAreaActions.setFields({ layerLengthShift }),
					),
				);
			});

			params.addListener.once("mouseup", () => {
				if (!hasMoved) {
					params.submitAction("Select layer");
					return;
				}

				const { layerLengthShift } = getAreaActionState<AreaType.CompositionTimeline>(
					options.compositionTimelineAreaId,
				);
				params.dispatch(
					areaActions.dispatchToAreaState(
						options.compositionTimelineAreaId,
						compTimeAreaActions.setFields({ layerLengthShift: [0, 0] }),
					),
				);

				const compositionSelection = getActionState().compositionSelection;
				params.dispatch(
					compositionActions.applyLayerLengthShift(
						composition.id,
						layerLengthShift,
						compositionSelection,
					),
				);

				{
					const toDispatch: any[] = [];

					// Update affected timelines
					const {
						compositions: newCompositionState,
						compositionSelection,
					} = getActionState();

					for (let i = 0; i < composition.layers.length; i += 1) {
						const layerId = composition.layers[i];

						if (!compositionSelection.layers[layerId]) {
							continue;
						}

						const oldIndex = compositionState.layers[layerId].index;
						const newIndex = newCompositionState.layers[layerId].index;

						const shiftBy = oldIndex - newIndex;
						const timelineIds = getTimelineIdsReferencedByLayer(
							layerId,
							compositionState,
						);

						for (let j = 0; j < timelineIds.length; j += 1) {
							toDispatch.push(
								timelineActions.shiftTimelineIndex(timelineIds[j], shiftBy),
							);
						}
					}

					params.dispatch(toDispatch);
				}

				params.submitAction("Resize layer(s)");
			});
		});
	},
};

export const trackHandlers = {
	onMouseDown: (
		e: React.MouseEvent,
		options: {
			compositionId: string;
			compositionTimelineAreaId: string;
			panY: number;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
		},
	): void => {
		const initialPos = Vec2.fromEvent(e);

		const mousePos = transformGlobalToTrackPosition(initialPos, options);

		let getXDistance: (a: number, b: number) => number;
		{
			const [x0, x1] = [0, 1].map((n) =>
				transformGlobalToTimelineX(
					n,
					options.viewBounds,
					options.viewport.left,
					options.viewport.width,
					options.compositionLength,
				),
			);

			const xt = x1 - x0;

			getXDistance = (a, b) => {
				const aScaled = a * (1 / xt);
				const bScaled = b * (1 / xt);
				return Math.abs(aScaled - bScaled);
			};
		}

		const { compositions: compositionState, timelines: timelineState } = getActionState();
		const composition = compositionState.compositions[options.compositionId];

		const yPosMap = getCompTimeTrackYPositions(composition.id, compositionState, options.panY);

		const timelineIdToLayerId = reduceCompProperties<{ [timelineId: string]: string }>(
			composition.id,
			compositionState,
			(obj, property) => {
				if (property.type === "property" && property.timelineId) {
					obj[property.timelineId] = property.layerId;
				}

				return obj;
			},
			{},
		);

		hitTest: {
			const propertyIds = Object.keys(yPosMap.property);
			for (let i = 0; i < propertyIds.length; i += 1) {
				const propertyId = propertyIds[i];
				const y = yPosMap.property[propertyId];

				if (mousePos.y > y && mousePos.y < y + COMP_TIME_LAYER_HEIGHT) {
					// Mouse landed on this property track.
					//
					// Check whether a keyframe was hit.
					const property = compositionState.properties[propertyId];

					if (property.type === "property" && property.timelineId) {
						const timeline = timelineState[property.timelineId];
						const layerId = timelineIdToLayerId[timeline.id];
						const layer = compositionState.layers[layerId];

						for (let j = 0; j < timeline.keyframes.length; j += 1) {
							const k = timeline.keyframes[j];
							const kIndex = k.index + layer.index;

							if (getXDistance(kIndex, mousePos.x) < 5) {
								actions.keyframeMouseDown(
									initialPos,
									mousePos.x,
									timeline.id,
									j,
									options,
								);
								return;
							}
						}
					}

					// No chance of hitting outside of this track
					break hitTest;
				}
			}

			const layerIds = Object.keys(yPosMap.layer);
			for (let i = 0; i < layerIds.length; i += 1) {
				const layerId = layerIds[i];
				const y = yPosMap.layer[layerId];

				if (mousePos.y > y && mousePos.y < y + COMP_TIME_LAYER_HEIGHT) {
					const layer = compositionState.layers[layerId];

					if (
						getXDistance(mousePos.x, layer.index) < COMP_TIME_TRACK_START_END_X_MARGIN
					) {
						actions.layerStartOrEndMouseDown(
							"start",
							layerId,
							initialPos,
							mousePos.x,
							options,
						);
						return;
					}

					if (
						getXDistance(mousePos.x, layer.index + layer.length) <
						COMP_TIME_TRACK_START_END_X_MARGIN
					) {
						actions.layerStartOrEndMouseDown(
							"end",
							layerId,
							initialPos,
							mousePos.x,
							options,
						);
						return;
					}

					if (valueWithinRange(mousePos.x, layer.index, layer.index + layer.length)) {
						actions.layerMouseDown(initialPos, layerId, mousePos.x, options);
						return;
					}

					// No chance of hitting outside of this track
					break hitTest;
				}
			}
		}

		const timelines = getTimelineIdsReferencedByComposition(
			composition.id,
			compositionState,
		).map((timelineId) => timelineState[timelineId]);

		/**
		 * Did not select any entity on timeline.
		 *
		 * If user drags mouse, create a selection rect.
		 *
		 * If mouseup is fired without moving, clear selection.
		 */
		requestAction({ history: true }, (params) => {
			let hasMoved = false;
			const wasShiftDown = isKeyDown("Command");

			params.addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e);

				if (!hasMoved) {
					if (getDistance(initialPos, mousePos) < 5) {
						return;
					}

					hasMoved = true;
				}

				const trackDragSelectRect = rectOfTwoVecs(
					transformGlobalToTrackPosition(initialPos, options),
					transformGlobalToTrackPosition(mousePos, options),
				);

				params.dispatch(
					areaActions.dispatchToAreaState(
						options.compositionTimelineAreaId,
						compTimeAreaActions.setFields({ trackDragSelectRect }),
					),
				);
			});

			params.addListener.once("mouseup", () => {
				if (!hasMoved) {
					params.dispatch(compositionActions.clearCompositionSelection(composition.id));
					params.dispatch(
						timelines.map((timeline) => timelineActions.clearSelection(timeline.id)),
					);
					params.submitAction("Clear timeline selection");
					return;
				}

				if (!wasShiftDown) {
					params.dispatch(
						timelines.map((timeline) => timelineActions.clearSelection(timeline.id)),
					);
				}

				const { trackDragSelectRect } = getAreaActionState<AreaType.CompositionTimeline>(
					options.compositionTimelineAreaId,
				);

				params.dispatch(
					timelines.map((timeline) => {
						const layerId = timelineIdToLayerId[timeline.id];
						const layer = compositionState.layers[layerId];

						const keyframes = timeline.keyframes
							.filter((k) => {
								const x = k.index + layer.index;
								const y =
									yPosMap.timeline[timeline.id] + COMP_TIME_LAYER_HEIGHT / 2;

								return isVecInRect(Vec2.new(x, y), trackDragSelectRect!);
							})
							.map((k) => k.id);
						return timelineActions.addKeyframesToSelection(timeline.id, keyframes);
					}),
				);
				params.dispatch(
					areaActions.dispatchToAreaState(
						options.compositionTimelineAreaId,
						compTimeAreaActions.setFields({ trackDragSelectRect: null }),
					),
				);
				params.submitAction("Select keyframes");
			});
		});
	},
};
