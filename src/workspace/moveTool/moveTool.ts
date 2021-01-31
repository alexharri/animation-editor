import { compositionActions } from "~/composition/compositionReducer";
import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import { Property } from "~/composition/compositionTypes";
import {
	compUtil,
	getTimelineIdsReferencedByComposition,
	reduceCompProperties,
} from "~/composition/compositionUtils";
import {
	compSelectionFromState,
	didCompSelectionChange,
} from "~/composition/util/compSelectionUtils";
import { AreaType } from "~/constants";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { getShapeLayerSelectedPathIds, getSingleSelectedShapeLayerId } from "~/shape/shapeUtils";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { createOperation } from "~/state/operation";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { timelineActions, timelineSelectionActions } from "~/timeline/timelineActions";
import {
	createTimelineKeyframe,
	getTimelineValueAtIndex,
	splitKeyframesAtIndex,
} from "~/timeline/timelineUtils";
import { PropertyName } from "~/types";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { isVecInPoly } from "~/util/math";
import { moveToolUtil } from "~/workspace/moveTool/moveToolUtil";
import { penToolHandlers } from "~/workspace/penTool/penTool";
import {
	globalToWorkspacePosition,
	workspaceLayerBoundingBoxCorners,
} from "~/workspace/workspaceUtils";

export const moveToolHandlers = {
	onMouseDown: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		const { pan: _pan, scale, compositionId } = getAreaActionState<AreaType.Workspace>(areaId);
		const actionState = getActionState();
		const { compositionState, compositionSelectionState } = actionState;

		const selectedShapeLayer = getSingleSelectedShapeLayerId(
			compositionId,
			compositionState,
			compositionSelectionState,
		);

		if (selectedShapeLayer) {
			const layerId = selectedShapeLayer;
			const selectedPathIds = getShapeLayerSelectedPathIds(
				layerId,
				compositionState,
				compositionSelectionState,
			);

			if (selectedPathIds.length > 0 || isKeyDown("Command")) {
				penToolHandlers.moveToolMouseDown(e, selectedShapeLayer, areaId, viewport);
				return;
			}
		}

		let layerId = "";

		const pan = _pan.add(Vec2.new(viewport.width / 2, viewport.height / 2));

		const composition = compositionState.compositions[compositionId];
		const map = getCompositionRenderValues(
			actionState,
			compositionId,
			composition.frameIndex,
			{
				width: composition.width,
				height: composition.height,
			},
			{ recursive: false },
		);

		for (const currLayerId of composition.layers) {
			const corners = workspaceLayerBoundingBoxCorners(
				currLayerId,
				map,
				actionState,
				pan,
				scale,
			);
			const mousePosition = Vec2.fromEvent(e).sub(Vec2.new(viewport.left, viewport.top));

			if (!isVecInPoly(mousePosition, corners)) {
				continue;
			}

			layerId = currLayerId;
			break;
		}

		if (!layerId) {
			moveToolHandlers.onMouseDownOut(compositionId);
			return;
		}

		moveToolHandlers.onLayerMouseDown(e, layerId, areaId, viewport);
	},

	onLayerMouseDown: (e: React.MouseEvent, layerId: string, areaId: string, viewport: Rect) => {
		const { pan, scale } = getAreaActionState<AreaType.Workspace>(areaId);
		const actionState = getActionState();
		const {
			compositionState,
			compositionSelectionState,
			timelineState,
			timelineSelectionState,
		} = actionState;

		const layer = compositionState.layers[layerId];
		const { compositionId } = layer;

		const composition = compositionState.compositions[compositionId];
		const compositionSelection = compSelectionFromState(
			compositionId,
			compositionSelectionState,
		);

		const willBeSelected = !compositionSelection.layers[layerId];
		const additiveSelection = isKeyDown("Shift") || isKeyDown("Command");

		// const addLayerToSelection = (params: RequestActionParams) => {
		// 	params.dispatch(compSelectionActions.addLayerToSelection(compositionId, layerId));
		// };

		// const removeLayerFromSelection = (params: RequestActionParams) => {
		// 	params.dispatch(
		// 		compSelectionActions.removeLayersFromSelection(compositionId, [layerId]),
		// 	);
		// };

		// const clearCompositionSelection = (params: RequestActionParams) => {
		// 	// Clear composition selection
		// 	params.dispatch(compSelectionActions.clearCompositionSelection(compositionId));

		// 	// Clear timeline selection of selected properties
		// 	const timelineIds = getTimelineIdsReferencedByComposition(
		// 		compositionId,
		// 		compositionState,
		// 	);
		// 	params.dispatch(
		// 		timelineIds.map((timelineId) => timelineSelectionActions.clear(timelineId)),
		// 	);
		// };

		// const deselectLayerProperties = (params: RequestActionParams) => {
		// 	// Deselect all properties and timeline keyframes
		// 	const propertyIds = reduceLayerPropertiesAndGroups<string[]>(
		// 		layerId,
		// 		compositionState,
		// 		(acc, property) => {
		// 			acc.push(property.id);
		// 			return acc;
		// 		},
		// 		[],
		// 	).filter((propertyId) => compositionSelection.properties[propertyId]);

		// 	const timelineIds = propertyIds.reduce<string[]>((acc, propertyId) => {
		// 		const property = compositionState.properties[propertyId];

		// 		if (property.type === "property" && property.timelineId) {
		// 			acc.push(property.timelineId);
		// 		}

		// 		return acc;
		// 	}, []);

		// 	params.dispatch(
		// 		compSelectionActions.removePropertiesFromSelection(compositionId, propertyIds),
		// 	);
		// 	params.dispatch(
		// 		timelineIds.map((timelineId) => timelineSelectionActions.clear(timelineId)),
		// 	);
		// };

		const layerInitialPositions: { [layerId: string]: Vec2 } = {};
		const layerPositionPropertyIds: { [layerId: string]: [string, string] } = {};

		const doAxis = (name: PropertyName, axis: "x" | "y", i: 0 | 1) => (property: Property) => {
			if (property.name === name) {
				const timelineId = property.timelineId;
				const layer = compositionState.layers[property.layerId];

				const value = timelineId
					? getTimelineValueAtIndex({
							frameIndex: composition.frameIndex,
							layerIndex: layer.index,
							timeline: timelineState[timelineId],
							selection: timelineSelectionState[timelineId],
					  })
					: property.value;

				if (!layerInitialPositions[property.layerId]) {
					layerInitialPositions[property.layerId] = Vec2.new(0, 0);
				}

				layerInitialPositions[property.layerId][axis] = value;

				if (!layerPositionPropertyIds[property.layerId]) {
					layerPositionPropertyIds[property.layerId] = ["", ""];
				}
				layerPositionPropertyIds[property.layerId][i] = property.id;
			}
		};
		const doX = doAxis(PropertyName.PositionX, "x", 0);
		const doY = doAxis(PropertyName.PositionY, "y", 1);

		reduceCompProperties(
			compositionId,
			compositionState,
			(acc, property) => {
				doX(property);
				doY(property);
				return acc;
			},
			null,
		);

		let didMove = false;

		const renderValues = getCompositionRenderValues(
			actionState,
			compositionId,
			composition.frameIndex,
			{
				width: composition.width,
				height: composition.height,
			},
			{
				recursive: false,
			},
		);

		mouseDownMoveAction(e, {
			keys: ["Shift"],
			shouldAddToStack: [didCompSelectionChange(compositionId), () => didMove],
			translate: (vec) => globalToWorkspacePosition(vec, viewport, scale, pan),
			beforeMove: (params) => {
				const op = createOperation(params);

				if (!additiveSelection && willBeSelected) {
					// The selection is non-additive and the layer will be selected.
					//
					// Clear the composition selection and then add the layer to selection.
					moveToolUtil.clearCompositionSelection(op, compositionId);
					moveToolUtil.addLayerToSelection(op, layerId);
					op.submit();
					return;
				}

				if (additiveSelection && !willBeSelected) {
					// The selection is additive and the layer will NOT be selected.
					//
					// Deselect the layer and its properties.
					moveToolUtil.deselectLayerProperties(op, layerId);
					moveToolUtil.removeLayerFromSelection(op, layerId);
				} else {
					// Layer will be selected and the selection is additive.
					moveToolUtil.addLayerToSelection(op, layerId);
				}

				op.submit();
			},
			mouseMove: (params, { moveVector: _moveVector, keyDown }) => {
				const op = createOperation(params);

				// Layer was deselected, do not move selected layers.
				if (additiveSelection && !willBeSelected) {
					return;
				}

				if (!didMove) {
					didMove = true;
				}

				const { timelineState, compositionState, compositionSelectionState } = op.state;
				const compositionSelection = compSelectionFromState(
					compositionId,
					compositionSelectionState,
				);

				const layerIds = compUtil.getSelectedLayers(compositionId);
				op.performDiff((diff) => diff.moveLayer(layerIds));

				for (const layerId of layerIds) {
					const layer = compositionState.layers[layerId];
					let moveVector = _moveVector.normal.copy();

					if (keyDown.Shift) {
						if (Math.abs(moveVector.x) > Math.abs(moveVector.y)) {
							moveVector.y = 0;
						} else {
							moveVector.x = 0;
						}
					}

					if (layer.parentLayerId) {
						// Check if any layer in the parent chain is selected, if so skip
						function hasSelectedParent(parentLayerId: string): boolean {
							if (compositionSelection.layers[parentLayerId]) {
								return true;
							}

							const layer = compositionState.layers[parentLayerId];
							if (!layer.parentLayerId) {
								return false;
							}

							return hasSelectedParent(layer.parentLayerId);
						}

						if (hasSelectedParent(layer.parentLayerId)) {
							continue;
						}

						const transform = renderValues.transforms[layer.parentLayerId].transform;
						moveVector = transform.matrix.inverse().multiplyVec2(moveVector);
					}

					i: for (let i = 0; i < 2; i += 1) {
						const axis = i === 0 ? "x" : "y";

						const propertyId = layerPositionPropertyIds[layerId][i];
						const initialValue = layerInitialPositions[layerId][axis];
						const value = initialValue + moveVector[axis];

						const property = compositionState.properties[propertyId] as Property;

						if (!property.timelineId) {
							op.add(compositionActions.setPropertyValue(propertyId, value));
							continue;
						}

						const timeline = timelineState[property.timelineId];
						const keyframes = timeline.keyframes;

						const { frameIndex } = composition;

						// Frame index before first timeline keyframe
						if (frameIndex < keyframes[0].index) {
							op.add(
								timelineActions.setKeyframe(
									timeline.id,
									createTimelineKeyframe(value, frameIndex),
								),
							);
							continue i;
						}

						// Frame index after last timeline keyframe
						if (frameIndex > keyframes[keyframes.length - 1].index) {
							op.add(
								timelineActions.setKeyframe(
									timeline.id,
									createTimelineKeyframe(value, frameIndex),
								),
							);
							continue i;
						}

						const kIndex = keyframes.map((k) => k.index).indexOf(frameIndex);

						// Frame index exactly at a specific keyframe
						if (kIndex !== -1) {
							op.add(
								timelineActions.setKeyframe(timeline.id, {
									...keyframes[kIndex],
									value,
								}),
							);
							continue;
						}

						for (let j = 0; j < keyframes.length; j += 1) {
							if (keyframes[j].index > frameIndex) {
								continue;
							}
							if (frameIndex > keyframes[j + 1].index) {
								continue;
							}

							const [k0, k, k1] = splitKeyframesAtIndex(
								keyframes[j],
								keyframes[j + 1],
								frameIndex,
							);
							op.add(
								timelineActions.setKeyframe(timeline.id, k0),
								timelineActions.setKeyframe(timeline.id, k),
								timelineActions.setKeyframe(timeline.id, k1),
							);
						}
					}
				}

				op.submit();
			},
			mouseUp: (params, didMove) => {
				if (additiveSelection && !willBeSelected) {
					params.submitAction("Remove layer from selection");
					return;
				}

				const op = createOperation(params);

				if (didMove) {
					const layerIds = compUtil.getSelectedLayers(compositionId);
					params.addDiff((diff) => diff.moveLayer(layerIds));
					params.submitAction("Move selected layers", { allowIndexShift: true });
					return;
				}

				if (!additiveSelection) {
					moveToolUtil.clearCompositionSelection(op, compositionId);
					moveToolUtil.addLayerToSelection(op, layerId);
				}

				op.submit();
				params.submitAction("Add layer to selection");
			},
		});
	},

	onMouseDownOut: (compositionId: string): void => {
		requestAction(
			{ history: true, shouldAddToStack: didCompSelectionChange(compositionId) },
			(params) => {
				const { compositionState } = getActionState();

				params.dispatch(compSelectionActions.clearCompositionSelection(compositionId));

				const timelineIds = getTimelineIdsReferencedByComposition(
					compositionId,
					compositionState,
				);
				params.dispatch(
					timelineIds.map((timelineId) => timelineSelectionActions.clear(timelineId)),
				);

				params.submitAction("Clear composition selection");
			},
		);
	},
};
