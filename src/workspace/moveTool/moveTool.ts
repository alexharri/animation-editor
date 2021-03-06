import { compositionActions } from "~/composition/compositionReducer";
import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import { Property } from "~/composition/compositionTypes";
import {
	compUtil,
	getTimelineIdsReferencedByComposition,
	reduceCompProperties,
} from "~/composition/compositionUtils";
import { createParentLayerViewportMatrices } from "~/composition/layer/constructLayerMatrix";
import { constructLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { getCompositionManagerByAreaId } from "~/composition/manager/compositionManager";
import { createPropertyManager } from "~/composition/manager/property/propertyManager";
import {
	compSelectionFromState,
	didCompSelectionChange,
} from "~/composition/util/compSelectionUtils";
import { AreaType } from "~/constants";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { getShapeLayerSelectedPathIds, getSingleSelectedShapeLayerId } from "~/shape/shapeUtils";
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
import { reduceIds } from "~/util/mapUtils";
import { moveToolUtil } from "~/workspace/moveTool/moveToolUtil";
import { penToolHandlers } from "~/workspace/penTool/penTool";

export const moveToolHandlers = {
	onMouseDown: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		const { compositionId } = getAreaActionState<AreaType.Workspace>(areaId);
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

		const compositionManager = getCompositionManagerByAreaId(areaId);

		if (!compositionManager) {
			throw new Error(`Did not find composition manager for area '${areaId}'.`);
		}

		const viewportMousePosition = Vec2.fromEvent(e).sub(Vec2.new(viewport.left, viewport.top));
		const layerId = compositionManager.layers.getLayerAtPoint(
			actionState,
			viewportMousePosition,
		);

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

		const mapByLayer = reduceIds(composition.layers, (layerId) => {
			return constructLayerPropertyMap(layerId, compositionState);
		});

		const propertyManager = createPropertyManager(compositionId, actionState);
		const createGlobalToNormal = (layerId: string) => {
			const matrices = createParentLayerViewportMatrices(
				actionState,
				propertyManager.getPropertyValue,
				layerId,
				scale,
			);
			const globalToNormal = (vec: Vec2) => {
				return vec
					.subXY(viewport.left, viewport.top)
					.sub(pan.addX(viewport.width / 2).addY(viewport.height / 2))
					.apply((vec) => matrices.position.applyInverse(vec));
			};
			return globalToNormal;
		};

		mouseDownMoveAction(e, {
			keys: ["Shift"],
			shouldAddToStack: [didCompSelectionChange(compositionId), () => didMove],
			beforeMove: (params) => {
				const op = createOperation(params);

				if (!additiveSelection && willBeSelected) {
					// The selection is non-additive and the layer will be selected.
					//
					// Clear the composition selection and then add the layer to selection.
					moveToolUtil.clearCompositionSelection(op, compositionId);
					moveToolUtil.addLayerToSelection(op, layerId);
					op.submit();
					params.performDiff((diff) => diff.compositionSelection(compositionId));
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
				params.performDiff((diff) => diff.compositionSelection(compositionId));
			},
			mouseMove: (params, { initialMousePosition, mousePosition }) => {
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
				op.performDiff((diff) =>
					layerIds.map((layerId) =>
						diff.modifyMultipleLayerProperties([
							mapByLayer[layerId][PropertyName.PositionX],
							mapByLayer[layerId][PropertyName.PositionY],
						]),
					),
				);

				for (const layerId of layerIds) {
					const layer = compositionState.layers[layerId];
					const globalToNormal = createGlobalToNormal(layerId);

					const n_mousePosition = globalToNormal(mousePosition.global);
					const n_initialMousePosition = globalToNormal(initialMousePosition.global);
					let toUse = n_mousePosition.sub(n_initialMousePosition);

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
					}

					i: for (let i = 0; i < 2; i += 1) {
						const axis = i === 0 ? "x" : "y";

						const propertyId = layerPositionPropertyIds[layerId][i];
						const initialValue = layerInitialPositions[layerId][axis];
						const value = initialValue + toUse[axis];

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
				params.addDiff((diff) => diff.compositionSelection(compositionId));

				if (additiveSelection && !willBeSelected) {
					params.submitAction("Remove layer from selection");
					return;
				}

				const op = createOperation(params);

				if (didMove) {
					const layerIds = compUtil.getSelectedLayers(compositionId);
					params.addDiff((diff) =>
						layerIds.map((layerId) =>
							diff.modifyMultipleLayerProperties([
								mapByLayer[layerId][PropertyName.PositionX],
								mapByLayer[layerId][PropertyName.PositionY],
							]),
						),
					);
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

				const timelineIds = getTimelineIdsReferencedByComposition(
					compositionId,
					compositionState,
				);
				params.dispatch(
					compSelectionActions.clearCompositionSelection(compositionId),
					...timelineIds.map((timelineId) => timelineSelectionActions.clear(timelineId)),
				);

				params.addDiff((diff) => diff.compositionSelection(compositionId));
				params.submitAction("Clear composition selection");
			},
		);
	},
};
