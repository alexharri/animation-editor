import { areaActions } from "~/area/state/areaActions";
import { areaInitialStates } from "~/area/state/areaInitialStates";
import { computeAreaToViewport } from "~/area/util/areaToViewport";
import { getAreaToOpenTargetId } from "~/area/util/areaUtils";
import { getAreaRootViewport } from "~/area/util/getAreaViewport";
import { CompositionLayer, CompositionProperty } from "~/composition/compositionTypes";
import { compositionActions } from "~/composition/state/compositionReducer";
import { compositionSelectionActions } from "~/composition/state/compositionSelectionReducer";
import { compTimeAreaActions } from "~/composition/timeline/compTimeAreaReducer";
import { createCompTimeContextMenu } from "~/composition/timeline/compTimeContextMenu";
import {
	getCompTimeLayerListHeight,
	getTimelineIdsReferencedByComposition,
	reduceLayerPropertiesAndGroups,
} from "~/composition/timeline/compTimeUtils";
import {
	didCompSelectionChange,
	getCompSelectionFromState,
} from "~/composition/util/compSelectionUtils";
import { AreaType } from "~/constants";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { createLayerGraph } from "~/nodeEditor/graph/createLayerGraph";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { getActionState } from "~/state/stateUtils";
import { timelineActions } from "~/timeline/timelineActions";
import {
	createTimelineForLayerProperty,
	getTimelineValueAtIndex,
	transformGlobalToTimelineX,
} from "~/timeline/timelineUtils";
import { animate } from "~/util/animation/animate";
import { capToRange, getDistance, interpolate } from "~/util/math";

const ZOOM_FAC = 0.25;

export const compTimeHandlers = {
	onScrubMouseDown: (
		e: React.MouseEvent,
		options: {
			compositionId: string;
			viewBounds: [number, number];
			viewport: Rect;
			compositionLength: number;
		},
	): void => {
		const { compositionId } = options;

		const composition = getActionState().compositionState.compositions[compositionId];

		const initialPosition = Vec2.fromEvent(e);

		const fn: RequestActionCallback = (params) => {
			const { addListener, dispatch, submitAction } = params;

			const onMove = (e?: MouseEvent) => {
				const pos = e ? Vec2.fromEvent(e) : initialPosition;
				const x = transformGlobalToTimelineX(pos.x, options);
				dispatch(
					compositionActions.setFrameIndex(
						composition.id,
						capToRange(0, composition.length - 1, Math.round(x)),
					),
				);
			};
			addListener.repeated("mousemove", onMove);
			onMove();

			addListener.once("mouseup", () => {
				submitAction("Move scrubber");
			});
		};
		requestAction({ history: true }, fn);
	},

	onZoomClick: (
		e: React.MouseEvent,
		areaId: string,
		options: {
			viewBounds: [number, number];
			width: number;
			left: number;
		},
	): void => {
		const { viewBounds, width, left } = options;

		const mousePos = Vec2.fromEvent(e).subX(left);
		const t = mousePos.x / width;

		let newBounds: [number, number];

		if (isKeyDown("Alt")) {
			const add = Math.abs(viewBounds[0] - viewBounds[1]) * ZOOM_FAC;
			newBounds = [
				capToRange(0, 1, viewBounds[0] - add * t),
				capToRange(0, 1, viewBounds[1] + add * (1 - t)),
			];
		} else {
			const remove = Math.abs(viewBounds[0] - viewBounds[1]) * ZOOM_FAC;
			newBounds = [viewBounds[0] + remove * t, viewBounds[1] - remove * (1 - t)];
		}

		requestAction({ history: false }, ({ dispatch, submitAction }) => {
			animate({ duration: 0 }, (t) => {
				dispatch(
					areaActions.dispatchToAreaState(
						areaId,
						compTimeAreaActions.setViewBounds([
							interpolate(viewBounds[0], newBounds[0], t),
							interpolate(viewBounds[1], newBounds[1], t),
						]),
					),
				);
			}).then(() => submitAction());
		});
	},

	onWheelPan: (
		e: WheelEvent,
		areaId: string,
		options: {
			compositionId: string;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
			panY: number;
			lockY: boolean;
		},
	): void => {
		const { viewBounds, compositionLength, compositionId } = options;

		requestAction({ history: false }, ({ submitAction, dispatch }) => {
			const compositionState = getActionState().compositionState;

			const [x0, x1] = [0, e.deltaX].map((x) => transformGlobalToTimelineX(x, options));

			const xt0 = x0 / compositionLength;
			const xt1 = x1 / compositionLength;

			const tChange = (xt0 - xt1) * -1;

			const rightShiftMax = 1 - viewBounds[1];
			const leftShiftMax = -viewBounds[0];

			let newBounds = [viewBounds[0], viewBounds[1]] as [number, number];
			if (tChange > rightShiftMax) {
				newBounds[1] = 1;
				newBounds[0] += rightShiftMax;
			} else if (tChange < leftShiftMax) {
				newBounds[0] = 0;
				newBounds[1] += leftShiftMax;
			} else {
				newBounds[0] += tChange;
				newBounds[1] += tChange;
			}

			const toDispatch: any[] = [
				areaActions.dispatchToAreaState(
					areaId,
					compTimeAreaActions.setViewBounds(newBounds),
				),
			];

			if (!options.lockY) {
				const yChange = e.deltaY;
				let yPan = options.panY + yChange;

				yPan = Math.min(
					yPan,
					getCompTimeLayerListHeight(compositionId, compositionState) -
						options.viewport.height,
				);
				yPan = Math.max(0, yPan);

				toDispatch.push(
					areaActions.dispatchToAreaState(areaId, compTimeAreaActions.setPanY(yPan)),
				);
			}

			dispatch(toDispatch);
			submitAction();
		});
	},

	/**
	 * When the user Space + Mouse drags the timeline around
	 */
	onPan: (
		e: React.MouseEvent,
		areaId: string,
		options: {
			compositionId: string;
			compositionLength: number;
			viewBounds: [number, number];
			viewport: Rect;
			panY: number;
			lockY: boolean;
		},
	): void => {
		const { viewBounds, compositionLength, viewport, compositionId } = options;

		const initialMousePosition = Vec2.fromEvent(e);
		const initialPos = transformGlobalToTimelineX(initialMousePosition.x, options);

		const fn: RequestActionCallback = ({ addListener, submitAction, dispatch }) => {
			const compositionState = getActionState().compositionState;

			let initialT = initialPos / compositionLength;

			addListener.repeated("mousemove", (e) => {
				const mousePosition = Vec2.fromEvent(e);
				const pos = transformGlobalToTimelineX(mousePosition.x, options);

				const t = pos / compositionLength;

				const tChange = (t - initialT) * -1;

				const rightShiftMax = 1 - viewBounds[1];
				const leftShiftMax = -viewBounds[0];

				let newBounds = [viewBounds[0], viewBounds[1]] as [number, number];
				if (tChange > rightShiftMax) {
					newBounds[1] = 1;
					newBounds[0] += rightShiftMax;
				} else if (tChange < leftShiftMax) {
					newBounds[0] = 0;
					newBounds[1] += leftShiftMax;
				} else {
					newBounds[0] += tChange;
					newBounds[1] += tChange;
				}

				const toDispatch: any[] = [
					areaActions.dispatchToAreaState(
						areaId,
						compTimeAreaActions.setViewBounds(newBounds),
					),
				];

				if (!options.lockY) {
					const yChange = initialMousePosition.y - mousePosition.y;
					let yPan = options.panY + yChange;

					yPan = Math.min(
						yPan,
						getCompTimeLayerListHeight(compositionId, compositionState) -
							viewport.height,
					);
					yPan = Math.max(0, yPan);

					toDispatch.push(
						areaActions.dispatchToAreaState(areaId, compTimeAreaActions.setPanY(yPan)),
					);
				}

				dispatch(toDispatch);
			});

			addListener.once("mouseup", () => submitAction());
		};
		requestAction({ history: false }, fn);
	},

	onPropertyKeyframeIconMouseDown: (
		compositionId: string,
		propertyId: string,
		timelineId: string,
	): void => {
		const { compositionState, timelines, timelineSelection } = getActionState();
		const composition = compositionState.compositions[compositionId];
		const property = compositionState.properties[propertyId] as CompositionProperty;
		const layer = compositionState.layers[property.layerId];

		if (timelineId) {
			// Delete timeline and make the value of the timeline at the current time
			// the value of the property
			const timeline = timelines[timelineId];
			const value = getTimelineValueAtIndex({
				timeline,
				frameIndex: composition.frameIndex,
				layerIndex: layer.index,
				selection: timelineSelection[timeline.id],
			});

			requestAction({ history: true }, ({ dispatch, submitAction }) => {
				dispatch(
					timelineActions.removeTimeline(timelineId),
					compositionActions.setPropertyValue(propertyId, value),
					compositionActions.setPropertyTimelineId(propertyId, ""),
				);
				submitAction("Remove timeline from property");
			});
			return;
		}

		// Create timeline with a single keyframe at the current time
		requestAction({ history: true }, ({ dispatch, submitAction }) => {
			const timeline = createTimelineForLayerProperty(property.value, composition.frameIndex);
			dispatch(
				timelineActions.setTimeline(timeline.id, timeline),
				compositionActions.setPropertyTimelineId(propertyId, timeline.id),
			);
			submitAction("Add timeline to property");
		});
	},

	onMouseDownOut: (compositionId: string): void => {
		requestAction(
			{ history: true, shouldAddToStack: didCompSelectionChange(compositionId) },
			(params) => {
				const { dispatch, submitAction } = params;
				dispatch(compositionSelectionActions.clearCompositionSelection(compositionId));
				submitAction("Clear selection");
			},
		);
	},

	onRightClickOut: (e: React.MouseEvent, compositionId: string): void => {
		const position = Vec2.fromEvent(e);
		createCompTimeContextMenu(position, { compositionId });
	},

	onLayerRightClick: (e: React.MouseEvent, layer: CompositionLayer): void => {
		const position = Vec2.fromEvent(e);
		createCompTimeContextMenu(position, {
			compositionId: layer.compositionId,
			layerId: layer.id,
		});
	},

	onLayerNameMouseDown: (e: React.MouseEvent, compositionId: string, layerId: string): void => {
		e.stopPropagation();

		requestAction(
			{ history: true, shouldAddToStack: didCompSelectionChange(compositionId) },
			(params) => {
				const { compositionState, compositionSelectionState } = getActionState();

				const compositionSelection = getCompSelectionFromState(
					compositionId,
					compositionSelectionState,
				);
				const willBeSelected = !compositionSelection.layers[layerId];

				const additiveSelection = isKeyDown("Shift") || isKeyDown("Command");

				if (!additiveSelection) {
					params.dispatch(
						compositionSelectionActions.clearCompositionSelection(compositionId),
					);
				} else if (!willBeSelected) {
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
						compositionSelectionActions.removePropertiesFromSelection(
							compositionId,
							propertyIds,
						),
					);
					params.dispatch(
						timelineIds.map((timelineId) => timelineActions.clearSelection(timelineId)),
					);
				}

				if (additiveSelection && !willBeSelected) {
					params.dispatch(
						compositionSelectionActions.removeLayersFromSelection(compositionId, [
							layerId,
						]),
					);
					params.submitAction("Remove layer from selection");
					return;
				}

				params.dispatch(
					compositionSelectionActions.addLayerToSelection(compositionId, layerId),
				);
				params.submitAction("Select layer");
			},
		);
	},

	onLayerGraphMouseDown: (e: React.MouseEvent, layerId: string): void => {
		e.stopPropagation();

		const compositionState = getActionState().compositionState;
		const layer = compositionState.layers[layerId];

		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;

			// If graph exists, delete it. If not, create one.
			if (layer.graphId) {
				dispatch(compositionActions.setLayerGraphId(layerId, ""));
				dispatch(nodeEditorActions.removeGraph(layer.graphId));
				submitAction("Remove layer graph");
				return;
			}

			const graph = createLayerGraph(layerId);

			dispatch(compositionActions.setLayerGraphId(layerId, graph.id));
			dispatch(nodeEditorActions.setGraph(graph));
			submitAction("Create layer graph");
		});
	},

	onOpenGraphInAreaMouseDown: (e: React.MouseEvent, layerId: string): void => {
		const initialMousePos = Vec2.fromEvent(e);

		const compositionState = getActionState().compositionState;
		const layer = compositionState.layers[layerId];

		requestAction({ history: true }, (params) => {
			const { dispatch, cancelAction, submitAction, addListener } = params;

			let hasMoved = false;
			let mousePos!: Vec2;

			addListener.repeated("mousemove", (e) => {
				mousePos = Vec2.fromEvent(e);

				if (!hasMoved) {
					if (getDistance(initialMousePos, mousePos) > 5) {
						hasMoved = true;
					} else {
						return;
					}
				}

				dispatch(
					areaActions.setFields({
						areaToOpen: {
							position: mousePos,
							area: {
								type: AreaType.NodeEditor,
								state: {
									...areaInitialStates[AreaType.NodeEditor],
									graphId: layer.graphId,
									compositionId: layer.compositionId,
								},
							},
						},
					}),
				);
			});

			addListener.once("mouseup", () => {
				if (!hasMoved) {
					cancelAction();
					return;
				}

				// Check whether the mouse is over an area other than the one we started at.

				const areaState = getActionState().area;
				const viewport = getAreaRootViewport();
				const areaToViewport = computeAreaToViewport(
					areaState.layout,
					areaState.rootId,
					viewport,
				);

				let areaId = getAreaToOpenTargetId(mousePos, areaState, areaToViewport);

				if (!areaId) {
					// Mouse is not over any area, cancel

					cancelAction();
					return;
				}

				dispatch(
					areaActions.setAreaType(areaId, AreaType.NodeEditor, {
						...areaInitialStates[AreaType.NodeEditor],
						graphId: layer.graphId,
					}),
				);
				dispatch(areaActions.setFields({ areaToOpen: null }));
				submitAction("Open graph in area");
			});
		});
	},

	onPropertyNameMouseDown: (
		e: React.MouseEvent,
		compositionId: string,
		propertyId: string,
	): void => {
		e.stopPropagation();

		const { compositionState, compositionSelectionState, timelines } = getActionState();
		const compositionSelection = getCompSelectionFromState(
			compositionId,
			compositionSelectionState,
		);
		const property = compositionState.properties[propertyId];

		const additiveSelection = isKeyDown("Command") || isKeyDown("Shift");

		requestAction(
			{ history: true, shouldAddToStack: didCompSelectionChange(compositionId) },
			(params) => {
				if (!additiveSelection) {
					// Clear other properties and timeline keyframes
					params.dispatch(
						compositionSelectionActions.clearCompositionSelection(compositionId),
					);

					const timelineIds = getTimelineIdsReferencedByComposition(
						compositionId,
						compositionState,
					);
					params.dispatch(timelineIds.map((id) => timelineActions.clearSelection(id)));
				}

				const willBeSelected = !compositionSelection.properties[propertyId];

				if (additiveSelection && !willBeSelected) {
					// Check whether this property is the only selected property
					// of the layer
					const selectedPropertyIds = reduceLayerPropertiesAndGroups<string[]>(
						property.layerId,
						compositionState,
						(acc, property) => {
							acc.push(property.id);
							return acc;
						},
						[],
					).filter((propertyId) => compositionSelection.properties[propertyId]);

					if (selectedPropertyIds.length === 1 && selectedPropertyIds[0] === propertyId) {
						// Only selected property of layer is being deselected.
						//
						// Deselect the layer
						params.dispatch(
							compositionSelectionActions.removeLayersFromSelection(compositionId, [
								property.layerId,
							]),
						);
					}

					// Remove property and timeline keyframes from selection
					params.dispatch(
						compositionSelectionActions.removePropertiesFromSelection(compositionId, [
							propertyId,
						]),
					);

					if (property.type === "property" && property.timelineId) {
						params.dispatch(timelineActions.clearSelection(property.timelineId));
					}
				} else {
					// Add property and timeline keyframes to selection
					params.dispatch(
						compositionSelectionActions.addPropertyToSelection(
							compositionId,
							propertyId,
						),
					);
					params.dispatch(
						compositionSelectionActions.addLayerToSelection(
							compositionId,
							property.layerId,
						),
					);

					if (property.type === "property" && property.timelineId) {
						const timeline = timelines[property.timelineId];
						const keyframeIds = timeline.keyframes.map((k) => k.id);
						params.dispatch(
							timelineActions.addKeyframesToSelection(timeline.id, keyframeIds),
						);
					}
				}

				params.submitAction("Select property");
			},
		);
	},
};
