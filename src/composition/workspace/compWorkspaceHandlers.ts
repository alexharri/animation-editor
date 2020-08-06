import { CompositionProperty } from "~/composition/compositionTypes";
import { compositionActions } from "~/composition/state/compositionReducer";
import { compSelectionActions } from "~/composition/state/compositionSelectionReducer";
import {
	getTimelineIdsReferencedByComposition,
	reduceCompProperties,
	reduceLayerPropertiesAndGroups,
} from "~/composition/timeline/compTimeUtils";
import {
	didCompSelectionChange,
	getCompSelectionFromState,
} from "~/composition/util/compSelectionUtils";
import { compositionWorkspaceAreaActions } from "~/composition/workspace/compWorkspaceAreaReducer";
import { AreaType } from "~/constants";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { transformGlobalToNodeEditorPosition } from "~/nodeEditor/nodeEditorUtils";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { createViewportWheelHandlers } from "~/shared/viewport/viewportWheelHandlers";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { timelineActions } from "~/timeline/timelineActions";
import {
	createTimelineKeyframe,
	getTimelineValueAtIndex,
	splitKeyframesAtIndex,
} from "~/timeline/timelineUtils";
import { PropertyName } from "~/types";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";

export const compWorkspaceHandlers = {
	onLayerRectMouseDown: (
		e: React.MouseEvent,
		layerId: string,
		areaId: string,
		viewport: Rect,
	) => {
		const { pan, scale } = getAreaActionState<AreaType.CompositionWorkspace>(areaId);
		const actionState = getActionState();
		const {
			compositionState,
			compositionSelectionState,
			timelines,
			timelineSelection,
		} = actionState;

		const layer = compositionState.layers[layerId];
		const { compositionId } = layer;

		const composition = compositionState.compositions[compositionId];
		const compositionSelection = getCompSelectionFromState(
			compositionId,
			compositionSelectionState,
		);

		const willBeSelected = !compositionSelection.layers[layerId];
		const additiveSelection = isKeyDown("Shift") || isKeyDown("Command");

		const addLayerToSelection = (params: RequestActionParams) => {
			params.dispatch(compSelectionActions.addLayerToSelection(compositionId, layerId));
		};

		const removeLayerFromSelection = (params: RequestActionParams) => {
			params.dispatch(
				compSelectionActions.removeLayersFromSelection(compositionId, [layerId]),
			);
		};

		const clearCompositionSelection = (params: RequestActionParams) => {
			// Clear composition selection
			params.dispatch(compSelectionActions.clearCompositionSelection(compositionId));

			// Clear timeline selection of selected properties
			const timelineIds = getTimelineIdsReferencedByComposition(
				compositionId,
				compositionState,
			);
			params.dispatch(
				timelineIds.map((timelineId) => timelineActions.clearSelection(timelineId)),
			);
		};

		const deselectLayerProperties = (params: RequestActionParams) => {
			// Deselect all properties and timeline keyframes
			const propertyIds = reduceLayerPropertiesAndGroups<string[]>(
				layerId,
				compositionState,
				(acc, property) => {
					acc.push(property.id);
					return acc;
				},
				[],
			).filter((propertyId) => compositionSelection.properties[propertyId]);

			const timelineIds = propertyIds.reduce<string[]>((acc, propertyId) => {
				const property = compositionState.properties[propertyId];

				if (property.type === "property" && property.timelineId) {
					acc.push(property.timelineId);
				}

				return acc;
			}, []);

			params.dispatch(
				compSelectionActions.removePropertiesFromSelection(compositionId, propertyIds),
			);
			params.dispatch(
				timelineIds.map((timelineId) => timelineActions.clearSelection(timelineId)),
			);
		};

		const layerInitialPositions: { [layerId: string]: Vec2 } = {};
		const layerPositionPropertyIds: { [layerId: string]: [string, string] } = {};

		const doAxis = (name: PropertyName, axis: "x" | "y", i: 0 | 1) => (
			property: CompositionProperty,
		) => {
			if (property.name === name) {
				const timelineId = property.timelineId;
				const layer = compositionState.layers[property.layerId];

				const value = timelineId
					? getTimelineValueAtIndex({
							frameIndex: composition.frameIndex,
							layerIndex: layer.index,
							timeline: timelines[timelineId],
							selection: timelineSelection[timelineId],
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
			translate: (vec) => transformGlobalToNodeEditorPosition(vec, viewport, scale, pan),
			beforeMove: (params) => {
				if (!additiveSelection && willBeSelected) {
					// The selection is non-additive and the layer will be selected.
					//
					// Clear the composition selection and then add the layer to selection.
					clearCompositionSelection(params);
					addLayerToSelection(params);
					return;
				}

				if (additiveSelection && !willBeSelected) {
					// The selection is additive and the layer will NOT be selected.
					//
					// Deselect the layer and its properties.
					deselectLayerProperties(params);
					removeLayerFromSelection(params);
				} else {
					addLayerToSelection(params);
				}
			},
			mouseMove: (params, { moveVector: _moveVector, keyDown }) => {
				// Layer was deselected, do not move selected layers.
				if (additiveSelection && !willBeSelected) {
					return;
				}

				if (!didMove) {
					didMove = true;
				}

				const { timelines, compositionState, compositionSelectionState } = getActionState();
				const compositionSelection = getCompSelectionFromState(
					compositionId,
					compositionSelectionState,
				);

				const toDispatch: any[] = [];

				const layerIds = composition.layers.filter(
					(layerId) => compositionSelection.layers[layerId],
				);

				for (const layerId of layerIds) {
					const layer = compositionState.layers[layerId];
					let moveVector = _moveVector.translated.copy();

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

						const { transform } = renderValues.transforms[layer.parentLayerId];
						moveVector = moveVector
							.scale(1 / transform.scale)
							.rotate(-transform.rotation);
					}

					i: for (let i = 0; i < 2; i += 1) {
						const axis = i === 0 ? "x" : "y";

						const propertyId = layerPositionPropertyIds[layerId][i];
						const initialValue = layerInitialPositions[layerId][axis];
						const value = initialValue + moveVector[axis];

						const property = compositionState.properties[
							propertyId
						] as CompositionProperty;

						if (!property.timelineId) {
							toDispatch.push(compositionActions.setPropertyValue(propertyId, value));
							continue;
						}

						const timeline = timelines[property.timelineId];
						const keyframes = timeline.keyframes;

						const { frameIndex } = composition;

						// Frame index before first timeline keyframe
						if (frameIndex < keyframes[0].index) {
							toDispatch.push(
								timelineActions.setKeyframe(
									timeline.id,
									createTimelineKeyframe(value, frameIndex),
								),
							);
							continue i;
						}

						// Frame index after last timeline keyframe
						if (frameIndex > keyframes[keyframes.length - 1].index) {
							toDispatch.push(
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
							toDispatch.push(
								timelineActions.setKeyframe(timeline.id, {
									...keyframes[kIndex],
									value,
								}),
							);
							continue;
						}

						for (let j = 0; j < keyframes.length; j += 1) {
							if (frameIndex < keyframes[j].index) {
								continue;
							}

							const [k0, k, k1] = splitKeyframesAtIndex(
								keyframes[j],
								keyframes[j + 1],
								frameIndex,
							);
							toDispatch.push(timelineActions.setKeyframe(timeline.id, k0));
							toDispatch.push(timelineActions.setKeyframe(timeline.id, k));
							toDispatch.push(timelineActions.setKeyframe(timeline.id, k1));
						}
					}
				}

				params.dispatch(toDispatch);
			},
			mouseUp: (params) => {
				if (additiveSelection && !willBeSelected) {
					params.submitAction("Remove layer from selection");
					return;
				}

				if (didMove) {
					params.submitAction("Move selected layers");
					return;
				}

				if (!additiveSelection) {
					clearCompositionSelection(params);
					addLayerToSelection(params);
				}

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
					timelineIds.map((timelineId) => timelineActions.clearSelection(timelineId)),
				);

				params.submitAction("Clear composition selection");
			},
		);
	},

	...createViewportWheelHandlers(AreaType.NodeEditor, {
		setPan: compositionWorkspaceAreaActions.setPan,
		setScale: compositionWorkspaceAreaActions.setScale,
	}),
};
