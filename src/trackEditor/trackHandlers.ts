import { compositionActions } from "~/composition/compositionReducer";
import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import { CompoundProperty, Layer, Property } from "~/composition/compositionTypes";
import {
	getTimelineIdsReferencedByComposition,
	getTimelineIdsReferencedByLayer,
	reduceCompProperties,
	reduceVisibleCompProperties,
} from "~/composition/compositionUtils";
import {
	compSelectionFromState,
	didCompSelectionChange,
} from "~/composition/util/compSelectionUtils";
import { AreaType, TIMELINE_LAYER_HEIGHT, TIMELINE_TRACK_START_END_X_MARGIN } from "~/constants";
import { isKeyDown } from "~/listener/keyboard";
import { createOperation } from "~/state/operation";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { timelineActions, timelineSelectionActions } from "~/timeline/timelineActions";
import { timelineAreaActions } from "~/timeline/timelineAreaReducer";
import {
	getTimelineSelection,
	graphEditorGlobalToNormal,
	trackEditorGlobalToNormal,
} from "~/timeline/timelineUtils";
import { getTimelineTrackYPositions } from "~/trackEditor/trackEditorUtils";
import { LayerType } from "~/types";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import {
	capToRange,
	distanceFromTranslatedX,
	isVecInRect,
	rectOfTwoVecs,
	valueWithinRange,
} from "~/util/math";

const actions = {
	keyframeMouseDown: (
		e: React.MouseEvent,
		timelineId: string,
		index: number,
		options: {
			compositionId: string;
			timelineAreaId: string;
			panY: number;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { compositionState, timelineState } = getActionState();

		const { compositionId } = options;
		const timelineIds = getTimelineIdsReferencedByComposition(compositionId, compositionState);

		const properties = reduceCompProperties<Property[]>(
			compositionId,
			compositionState,
			(acc, property) => {
				if (property.timelineId) {
					acc.push(property);
				}
				return acc;
			},
			[],
		);

		const timeline = timelineState[timelineId];
		const property = properties.find((p) => p.timelineId === timelineId)!;

		const commandKeyDownAtMouseDown = isKeyDown("Command");
		const shiftKeyDownAtMouseDown = isKeyDown("Shift");
		const additiveSelection = commandKeyDownAtMouseDown || shiftKeyDownAtMouseDown;

		mouseDownMoveAction(e, {
			keys: [],
			translateX: (value) => graphEditorGlobalToNormal(value, options),
			beforeMove: (params) => {
				const keyframe = timeline.keyframes[index];

				const selection = getTimelineSelection(timelineId);

				if (additiveSelection) {
					params.dispatch(
						timelineSelectionActions.toggleKeyframe(timeline.id, keyframe.id),
					);
				} else if (!selection.keyframes[keyframe.id]) {
					params.dispatch(timelineIds.map((id) => timelineSelectionActions.clear(id)));
					params.dispatch(
						timelineSelectionActions.toggleKeyframe(timeline.id, keyframe.id),
						compSelectionActions.clearCompositionSelection(compositionId),
						compSelectionActions.addLayerToSelection(compositionId, property.layerId),
						compSelectionActions.addPropertyToSelection(compositionId, property.id),
					);
				}
			},
			mouseMove: (params, { moveVector }) => {
				const moveX = Math.round(moveVector.normal.x);

				params.dispatch(
					timelineIds.map((id) => timelineActions.setIndexAndValueShift(id, moveX, 0)),
				);
			},
			mouseUp: (params, hasMoved) => {
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
				params.submitAction("Move selected keyframes", { allowIndexShift: true });
			},
			moveTreshold: 5,
		});
	},

	compoundKeyframesMouseDown: (
		e: React.MouseEvent,
		klist: Array<{ timelineId: string; keyframeIndex: number }>,
		options: {
			compositionId: string;
			timelineAreaId: string;
			panY: number;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { compositionState, timelineState } = getActionState();

		const { compositionId } = options;
		const timelineIds = getTimelineIdsReferencedByComposition(compositionId, compositionState);

		const properties = reduceCompProperties<Property[]>(
			compositionId,
			compositionState,
			(acc, property) => {
				if (property.timelineId) {
					acc.push(property);
				}
				return acc;
			},
			[],
		);

		const commandKeyDownAtMouseDown = isKeyDown("Command");
		const shiftKeyDownAtMouseDown = isKeyDown("Shift");
		const additiveSelection = commandKeyDownAtMouseDown || shiftKeyDownAtMouseDown;

		mouseDownMoveAction(e, {
			keys: [],
			translateX: (value) => graphEditorGlobalToNormal(value, options),
			beforeMove: (params) => {
				const anyNotSelected = klist.some(({ keyframeIndex, timelineId }) => {
					const timeline = timelineState[timelineId];
					const k = timeline.keyframes[keyframeIndex];
					const selection = getTimelineSelection(timelineId);
					return !selection.keyframes[k.id];
				});

				const op = createOperation(params);

				if (!additiveSelection && anyNotSelected) {
					op.add(
						compSelectionActions.clearCompositionSelection(compositionId),
						...timelineIds.map((id) => timelineSelectionActions.clear(id)),
					);
				}

				for (const { timelineId, keyframeIndex } of klist) {
					const timeline = timelineState[timelineId];
					const keyframe = timeline.keyframes[keyframeIndex];

					if (additiveSelection) {
						op.add(
							anyNotSelected
								? timelineSelectionActions.addKeyframes(timeline.id, [keyframe.id])
								: timelineSelectionActions.removeKeyframes(timeline.id, [
										keyframe.id,
								  ]),
						);
					} else if (anyNotSelected) {
						const property = properties.find((p) => p.timelineId === timelineId)!;

						op.add(
							timelineSelectionActions.addKeyframes(timeline.id, [keyframe.id]),
							compSelectionActions.addLayerToSelection(
								compositionId,
								property.layerId,
							),
							compSelectionActions.addPropertyToSelection(compositionId, property.id),
							compSelectionActions.addPropertyToSelection(
								compositionId,
								property.compoundPropertyId,
							),
						);
					}
				}

				params.dispatch(op.actions);
			},
			mouseMove: (params, { moveVector }) => {
				const moveX = Math.round(moveVector.normal.x);

				params.dispatch(
					timelineIds.map((id) => timelineActions.setIndexAndValueShift(id, moveX, 0)),
				);
			},
			mouseUp: (params, hasMoved) => {
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
				params.submitAction("Move selected keyframes", { allowIndexShift: true });
			},
			moveTreshold: 5,
		});
	},

	layerMouseDown: (
		e: React.MouseEvent,
		layerId: string,
		options: {
			compositionId: string;
			timelineAreaId: string;
			panY: number;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { compositionState, compositionSelectionState } = getActionState();
		const composition = compositionState.compositions[options.compositionId];
		let compositionSelection = compSelectionFromState(
			composition.id,
			compositionSelectionState,
		);

		let leftMax = -Infinity;
		let rightMax = Infinity;
		let layerIds: string[] = [];
		const layerToIndex: Record<string, number> = {};
		const compositionLayerToPlaybackIndex: Record<string, number> = {};

		mouseDownMoveAction(e, {
			keys: [],
			translateX: (value) => graphEditorGlobalToNormal(value, options),
			beforeMove: (params) => {
				const timelineIds = getTimelineIdsReferencedByComposition(
					options.compositionId,
					compositionState,
				);

				const commandKeyDownAtMouseDown = isKeyDown("Command");
				const shiftKeyDownAtMouseDown = isKeyDown("Shift");

				const additiveSelection = commandKeyDownAtMouseDown || shiftKeyDownAtMouseDown;

				if (additiveSelection) {
					params.dispatch(
						compSelectionActions.toggleLayerSelection(composition.id, layerId),
					);

					// If the layer is being deselected, we clear the selection of all timelines
					// referenced by that layer.
					if (compositionSelection.layers[layerId]) {
						const layerTimelineIds = getTimelineIdsReferencedByLayer(
							layerId,
							compositionState,
						);
						params.dispatch(
							layerTimelineIds.map((id) => timelineSelectionActions.clear(id)),
						);
					}
				} else if (!compositionSelection.layers[layerId]) {
					// If the current layer is not selected, we clear the selections of all timelines
					// in the composition
					params.dispatch(timelineIds.map((id) => timelineSelectionActions.clear(id)));
					params.dispatch(
						compSelectionActions.toggleLayerSelection(composition.id, layerId),
					);
					params.dispatch(
						compSelectionActions.removeLayersFromSelection(
							composition.id,
							composition.layers.filter((id) => id !== layerId),
						),
					);
				}

				compositionSelection = compSelectionFromState(
					composition.id,
					getActionState().compositionSelectionState,
				);

				layerIds = Object.keys(compositionSelection.layers);

				const updateMax = (index: number, length: number) => {
					leftMax = Math.max(leftMax, -index);
					rightMax = Math.min(rightMax, composition.length - (index + length));
				};

				for (const layerId of layerIds) {
					const layer = compositionState.layers[layerId];
					layerToIndex[layerId] = layer.index;
					updateMax(layer.index, layer.length);

					if (layer.type === LayerType.Composition) {
						compositionLayerToPlaybackIndex[layerId] = layer.playbackStartsAtIndex;
					}
				}
			},
			mouseMove: (params, { moveVector }) => {
				const moveX = capToRange(leftMax, rightMax, Math.round(moveVector.normal.x));

				const op = createOperation(params);

				for (const layerId of layerIds) {
					const layer = compositionState.layers[layerId];
					const index = moveX + layerToIndex[layerId];
					op.add(compositionActions.setLayerIndex(layerId, index));

					if (layer.type === LayerType.Composition) {
						const index = moveX + compositionLayerToPlaybackIndex[layerId];
						op.add(compositionActions.setLayerPlaybackIndex(layerId, index));
					}
				}
				params.dispatch(op.actions);
				params.performDiff((diff) =>
					diff.frameIndex(composition.id, composition.frameIndex),
				);
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved) {
					params.submitAction("Modify selection");
					return;
				}

				params.addDiff((diff) => diff.frameIndex(composition.id, composition.frameIndex));
				params.submitAction("Move layers", { allowIndexShift: true });
			},
		});
	},

	layerStartOrEndMouseDown: (
		which: "start" | "end",
		e: React.MouseEvent,
		layerId: string,
		options: {
			compositionId: string;
			timelineAreaId: string;
			panY: number;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		const { compositionState, compositionSelectionState } = getActionState();
		const composition = compositionState.compositions[options.compositionId];
		let compositionSelection = compSelectionFromState(
			composition.id,
			compositionSelectionState,
		);

		let leftMax = -Infinity;
		let rightMax = Infinity;
		let layerIds: string[] = [];
		const layersAtStart: Record<string, Layer> = {};
		const layerLastIndex: Record<string, number> = {};

		mouseDownMoveAction(e, {
			baseDiff: (diff) => diff.frameIndex(composition.id, composition.frameIndex),
			keys: [],
			translateX: (value) => graphEditorGlobalToNormal(value, options),
			beforeMove: (params) => {
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
							compSelectionActions.toggleLayerSelection(composition.id, layerId),
						);
					}
				} else if (!compositionSelection.layers[layerId]) {
					params.dispatch(timelineIds.map((id) => timelineSelectionActions.clear(id)));
					params.dispatch(
						compSelectionActions.toggleLayerSelection(composition.id, layerId),
					);
					params.dispatch(
						compSelectionActions.removeLayersFromSelection(
							composition.id,
							composition.layers.filter((id) => id !== layerId),
						),
					);
				}

				compositionSelection = compSelectionFromState(
					composition.id,
					getActionState().compositionSelectionState,
				);

				layerIds = Object.keys(compositionSelection.layers);
				for (const layerId of layerIds) {
					const layer = compositionState.layers[layerId];
					if (which === "start") {
						leftMax = Math.max(leftMax, -layer.index);
						rightMax = Math.min(rightMax, layer.length - 1);
					} else {
						leftMax = Math.max(leftMax, -(layer.length - 1));
						rightMax = Math.min(
							rightMax,
							composition.length - (layer.index + layer.length),
						);
					}
					layersAtStart[layerId] = layer;
					layerLastIndex[layerId] = layer.index;

					if (layer.type === LayerType.Composition) {
						if (which === "start") {
							leftMax = Math.max(leftMax, layer.playbackStartsAtIndex - layer.index);
						} else {
							const compositionId =
								compositionState.compositionLayerIdToComposition[layer.id];
							const composition = compositionState.compositions[compositionId];
							rightMax = Math.min(
								rightMax,
								composition.length -
									layer.length -
									(layer.index - layer.playbackStartsAtIndex),
							);
						}
					}
				}
			},
			mouseMove: (params, { moveVector }) => {
				const moveX = capToRange(leftMax, rightMax, Math.round(moveVector.normal.x));
				const start = which === "start";

				const op = createOperation(params);

				for (const layerId of layerIds) {
					const index = layersAtStart[layerId].index + moveX * (start ? 1 : 0);
					const length = layersAtStart[layerId].length + moveX * (start ? -1 : 1);

					op.add(compositionActions.setLayerIndexAndLength(layerId, index, length));

					const indexDelta = layerLastIndex[layerId] - index;
					layerLastIndex[layerId] = index;

					const timelineIds = getTimelineIdsReferencedByLayer(layerId, compositionState);
					for (const timelineId of timelineIds) {
						op.add(timelineActions.shiftTimelineIndex(timelineId, indexDelta));
					}
				}
				params.dispatch(op.actions);
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved) {
					params.submitAction("Select layer");
					return;
				}
				params.submitAction("Resize layers", { allowIndexShift: true });
			},
		});
	},
};

export const trackHandlers = {
	onMouseDown: (
		e: React.MouseEvent,
		options: {
			compositionId: string;
			timelineAreaId: string;
			panY: number;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
		},
	): void => {
		const posTranslated = trackEditorGlobalToNormal(Vec2.fromEvent(e), options);

		const { compositionState, timelineState } = getActionState();
		const composition = compositionState.compositions[options.compositionId];

		const yPosMap = getTimelineTrackYPositions(composition.id, compositionState, options.panY);

		const timelineIdToLayerId = reduceCompProperties<{ [timelineId: string]: string }>(
			composition.id,
			compositionState,
			(obj, property) => {
				if (property.timelineId) {
					obj[property.timelineId] = property.layerId;
				}
				return obj;
			},
			{},
		);

		hitTest: {
			const globalXDistance = (a: number, b: number): number => {
				return distanceFromTranslatedX(a, b, (value) =>
					graphEditorGlobalToNormal(value, options),
				);
			};

			for (const propertyId in yPosMap.property) {
				const y = yPosMap.property[propertyId];

				if (valueWithinRange(posTranslated.y, y, y + TIMELINE_LAYER_HEIGHT)) {
					// Mouse landed on this property track. Check whether a keyframe was hit.
					const property = compositionState.properties[propertyId];

					if (property.type === "group") {
						break hitTest;
					}

					if (property.type === "compound") {
						const klist: Array<{ timelineId: string; keyframeIndex: number }> = [];

						for (const propertyId of property.properties) {
							const { timelineId } = compositionState.properties[
								propertyId
							] as Property;

							if (!timelineId) {
								continue;
							}

							const timeline = timelineState[timelineId];
							const layerId = timelineIdToLayerId[timeline.id];
							const layer = compositionState.layers[layerId];

							for (let i = 0; i < timeline.keyframes.length; i += 1) {
								const keyframeIndex = timeline.keyframes[i].index + layer.index;

								if (globalXDistance(keyframeIndex, posTranslated.x) < 5) {
									klist.push({ timelineId, keyframeIndex: i });
								}
							}
						}

						if (klist.length) {
							actions.compoundKeyframesMouseDown(e, klist, options);
							return;
						}

						break hitTest;
					}

					if (!property.timelineId) {
						break hitTest;
					}

					const timeline = timelineState[property.timelineId];
					const layerId = timelineIdToLayerId[timeline.id];
					const layer = compositionState.layers[layerId];

					for (let i = 0; i < timeline.keyframes.length; i += 1) {
						const keyframeIndex = timeline.keyframes[i].index + layer.index;

						if (globalXDistance(keyframeIndex, posTranslated.x) < 5) {
							actions.keyframeMouseDown(e, timeline.id, i, options);
							return;
						}
					}

					// No chance of hitting outside of this track
					break hitTest;
				}
			}

			for (const layerId in yPosMap.layer) {
				const y = yPosMap.layer[layerId];

				if (valueWithinRange(posTranslated.y, y, y + TIMELINE_LAYER_HEIGHT)) {
					const layer = compositionState.layers[layerId];

					const MARGIN = TIMELINE_TRACK_START_END_X_MARGIN;

					if (globalXDistance(posTranslated.x, layer.index) < MARGIN) {
						actions.layerStartOrEndMouseDown("start", e, layerId, options);
						return;
					}

					if (globalXDistance(posTranslated.x, layer.index + layer.length) < MARGIN) {
						actions.layerStartOrEndMouseDown("end", e, layerId, options);
						return;
					}

					let index = layer.index;
					let length = layer.length;

					if (layer.type === LayerType.Composition) {
						index = layer.playbackStartsAtIndex;
						const compositionId =
							compositionState.compositionLayerIdToComposition[layer.id];
						const composition = compositionState.compositions[compositionId];
						length = composition.length;
					}

					if (valueWithinRange(posTranslated.x, index, index + length)) {
						actions.layerMouseDown(e, layerId, options);
						return;
					}

					// No chance of hitting outside of this track
					break hitTest;
				}
			}
		}

		// User did not click any entity.
		//
		// If the user drags and moves, create a selection rect. Otherwise
		// clear the selection
		const additiveSelection = isKeyDown("Command") || isKeyDown("Shift");

		mouseDownMoveAction(e, {
			keys: [],
			shouldAddToStack: didCompSelectionChange(options.compositionId),
			translate: (vec) => trackEditorGlobalToNormal(vec, options),
			beforeMove: () => {},
			mouseMove: (params, { mousePosition, initialMousePosition }) => {
				const trackDragSelectRect = rectOfTwoVecs(
					mousePosition.normal,
					initialMousePosition.normal,
				);

				params.dispatchToAreaState(
					options.timelineAreaId,
					timelineAreaActions.setFields({ trackDragSelectRect }),
				);
			},
			mouseUp: (params, hasMoved) => {
				const timelines = getTimelineIdsReferencedByComposition(
					composition.id,
					compositionState,
				).map((timelineId) => timelineState[timelineId]);

				if (!hasMoved) {
					params.dispatch(compSelectionActions.clearCompositionSelection(composition.id));
					params.dispatch(
						timelines.map((timeline) => timelineSelectionActions.clear(timeline.id)),
					);
					params.submitAction("Clear timeline selection");
					return;
				}

				const { trackDragSelectRect } = getAreaActionState<AreaType.Timeline>(
					options.timelineAreaId,
				);

				const timelineToPropertyId = reduceVisibleCompProperties<{
					[timelineId: string]: string;
				}>(
					options.compositionId,
					compositionState,
					(obj, property) => {
						if (property.timelineId) {
							obj[property.timelineId] = property.id;
						}

						return obj;
					},
					{},
				);

				const affectedTimelines = timelines
					.map<{ timelineId: string; keyframeIds: string[] }>((timeline) => {
						const layerId = timelineIdToLayerId[timeline.id];
						const layer = compositionState.layers[layerId];

						const keyframes = timeline.keyframes
							.filter((k) => {
								const x = k.index + layer.index;
								const y = yPosMap.timeline[timeline.id] + TIMELINE_LAYER_HEIGHT / 2;

								return isVecInRect(Vec2.new(x, y), trackDragSelectRect!);
							})
							.map((k) => k.id);

						return {
							timelineId: timeline.id,
							keyframeIds: keyframes,
						};
					})
					.filter((item) => item.keyframeIds.length > 0);

				// Clear first if selection is not additive
				if (!additiveSelection) {
					params.dispatch(
						timelines.map((timeline) => timelineSelectionActions.clear(timeline.id)),
					);
					params.dispatch(compSelectionActions.clearCompositionSelection(composition.id));
				}

				// Add keyframes to selection
				params.dispatch(
					affectedTimelines.map(({ timelineId, keyframeIds }) => {
						return timelineSelectionActions.addKeyframes(timelineId, keyframeIds);
					}),
				);

				// Select all affected properties
				const affectedPropertyIds: string[] = [];

				affectedTimelines.forEach(({ timelineId }) => {
					const property = compositionState.properties[
						timelineToPropertyId[timelineId]
					] as Property;

					if (property.compoundPropertyId) {
						const compound = compositionState.properties[
							property.compoundPropertyId
						] as CompoundProperty;
						if (!compound.separated) {
							affectedPropertyIds.push(compound.id);
							return;
						}
					}

					affectedPropertyIds.push(property.id);
				});
				params.dispatch(
					affectedPropertyIds.map((propertyId) => {
						return compSelectionActions.addPropertyToSelection(
							options.compositionId,
							propertyId,
						);
					}),
				);

				// Select all affected layers
				const affectedLayerIds = [
					...new Set<string>(
						affectedPropertyIds.map((propertyId) => {
							const property = compositionState.properties[propertyId] as Property;
							return property.layerId;
						}),
					),
				];
				params.dispatch(
					affectedLayerIds.map((layerId) => {
						return compSelectionActions.addLayerToSelection(
							options.compositionId,
							layerId,
						);
					}),
				);

				params.dispatchToAreaState(
					options.timelineAreaId,
					timelineAreaActions.setFields({ trackDragSelectRect: null }),
				);
				params.submitAction("Select keyframes");
			},
		});
	},
};
