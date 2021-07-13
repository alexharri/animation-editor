import { areaActions } from "~/area/state/areaActions";
import { areaInitialStates } from "~/area/state/areaInitialStates";
import { dragOpenArea } from "~/area/util/dragOpenArea";
import { compositionActions } from "~/composition/compositionReducer";
import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import { CompoundProperty, Layer, Property } from "~/composition/compositionTypes";
import {
	getTimelineIdsReferencedByComposition,
	reduceLayerPropertiesAndGroups,
} from "~/composition/compositionUtils";
import {
	compSelectionFromState,
	didCompSelectionChange,
} from "~/composition/util/compSelectionUtils";
import {
	AreaType,
	TIMELINE_BETWEEN_LAYERS,
	TIMELINE_ITEM_HEIGHT,
	TIMELINE_LAYER_HEIGHT,
} from "~/constants";
import { createArrayModifierFlowGraph, createLayerFlowGraph } from "~/flow/graph/createFlowGraph";
import { flowActions } from "~/flow/state/flowActions";
import { isKeyDown } from "~/listener/keyboard";
import {
	requestAction,
	RequestActionCallback,
	RequestActionParams,
	ShouldAddToStackFn,
} from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { timelineOperations } from "~/timeline/operations/timelineOperations";
import { timelineActions, timelineSelectionActions } from "~/timeline/timelineActions";
import { timelineAreaActions } from "~/timeline/timelineAreaReducer";
import { createTimelineContextMenu } from "~/timeline/timelineContextMenu";
import {
	createTimelineForLayerProperty,
	getTimelineValueAtIndex,
	graphEditorGlobalToNormal,
} from "~/timeline/timelineUtils";
import {
	getTimelineLayerListHeight,
	getTimelineTrackYPositions,
} from "~/trackEditor/trackEditorUtils";
import { PropertyGroupName } from "~/types";
import { Area } from "~/types/areaTypes";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { animate } from "~/util/animation/animate";
import { capToRange, interpolate } from "~/util/math";

const ZOOM_FAC = 0.4;

export const timelineHandlers = {
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

		let frameIndex = composition.frameIndex;

		const fn: RequestActionCallback = (params) => {
			const onMove = (e?: MouseEvent) => {
				const pos = e ? Vec2.fromEvent(e) : initialPosition;
				const x = graphEditorGlobalToNormal(pos.x, options);
				frameIndex = capToRange(0, composition.length - 1, Math.round(x));
				params.dispatch(compositionActions.setFrameIndex(composition.id, frameIndex));
				params.performDiff((diff) => diff.frameIndex(compositionId, frameIndex));
			};
			params.addListener.repeated("mousemove", onMove);
			onMove();

			params.addListener.once("mouseup", () => {
				params.addDiff((diff) => diff.frameIndex(compositionId, frameIndex));
				params.submitAction("Move scrubber");
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
						timelineAreaActions.setViewBounds([
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

			const [x0, x1] = [0, e.deltaX].map((x) => graphEditorGlobalToNormal(x, options));

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
					timelineAreaActions.setViewBounds(newBounds),
				),
			];

			if (!options.lockY) {
				const yChange = e.deltaY;
				let yPan = options.panY + yChange;

				yPan = Math.min(
					yPan,
					getTimelineLayerListHeight(compositionId, compositionState) -
						(TIMELINE_ITEM_HEIGHT + 32 + 2),
				);
				yPan = Math.max(0, yPan);

				toDispatch.push(
					areaActions.dispatchToAreaState(areaId, timelineAreaActions.setPanY(yPan)),
				);
			}

			dispatch(toDispatch);
			submitAction();
		});
	},

	onWheelZoom: (
		e: WheelEvent,
		areaId: string,
		impact = 1,
		options: { viewBounds: [number, number]; width: number; left: number },
	): void => {
		const { deltaY } = e;

		const fac = interpolate(1, -deltaY < 0 ? 1.15 : 0.85, capToRange(0, 2, impact));

		const { viewBounds, width, left } = options;

		const mousePos = Vec2.fromEvent(e).subX(left);
		const t = mousePos.x / width;

		if (t < 0) {
			// User is pinch zooming on layer list. We just ignore this.
			return;
		}

		const remove = Math.abs(viewBounds[0] - viewBounds[1]) * (1 - fac);
		let newBounds: [number, number] = [
			viewBounds[0] + remove * t,
			viewBounds[1] - remove * (1 - t),
		];

		if (newBounds[0] < 0 && newBounds[1] > 1) {
			newBounds = [0, 1];
		} else if (newBounds[0] < 0) {
			newBounds[1] = Math.min(1, newBounds[1] + Math.abs(newBounds[0]));
			newBounds[0] = 0;
		} else if (newBounds[1] > 1) {
			newBounds[0] = Math.max(0, newBounds[0] - (newBounds[1] - 1));
			newBounds[1] = 1;
		}

		requestAction({ history: false }, ({ dispatch, submitAction }) => {
			dispatch(
				areaActions.dispatchToAreaState(
					areaId,
					timelineAreaActions.setViewBounds(newBounds),
				),
			);
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
		const { viewBounds, compositionLength, compositionId } = options;

		const initialMousePosition = Vec2.fromEvent(e);
		const initialPos = graphEditorGlobalToNormal(initialMousePosition.x, options);

		const fn: RequestActionCallback = ({ addListener, submitAction, dispatch }) => {
			const compositionState = getActionState().compositionState;

			let initialT = initialPos / compositionLength;

			addListener.repeated("mousemove", (e) => {
				const mousePosition = Vec2.fromEvent(e);
				const pos = graphEditorGlobalToNormal(mousePosition.x, options);

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
						timelineAreaActions.setViewBounds(newBounds),
					),
				];

				if (!options.lockY) {
					const yChange = initialMousePosition.y - mousePosition.y;
					let yPan = options.panY + yChange;

					yPan = Math.min(
						yPan,
						getTimelineLayerListHeight(compositionId, compositionState) -
							(TIMELINE_ITEM_HEIGHT + 32 + 2),
					);
					yPan = Math.max(0, yPan);

					toDispatch.push(
						areaActions.dispatchToAreaState(areaId, timelineAreaActions.setPanY(yPan)),
					);
				}

				dispatch(toDispatch);
			});

			addListener.once("mouseup", () => submitAction());
		};
		requestAction({ history: false }, fn);
	},

	onCompoundPropertyKeyframeIconMouseDown: (e: React.MouseEvent, compoundPropertyId: string) => {
		e.stopPropagation();

		const {
			compositionState,
			timelineState,
			timelineSelectionState: timelineSelection,
		} = getActionState();

		const property = compositionState.properties[compoundPropertyId] as CompoundProperty;
		const composition = compositionState.compositions[property.compositionId];
		const layer = compositionState.layers[property.layerId];

		const properties = property.properties.map(
			(id) => compositionState.properties[id],
		) as Property[];

		let anyHasTimeline = false;

		for (const property of properties) {
			if (property.timelineId) {
				anyHasTimeline = true;
				break;
			}
		}

		requestAction({ history: true }, (params) => {
			const { submitAction } = params;
			const op = createOperation(params);
			op.addDiff((diff) => diff.propertyStructure(layer.id));

			for (const property of properties) {
				if (anyHasTimeline) {
					if (!property.timelineId) {
						continue;
					}

					const timeline = timelineState[property.timelineId];
					const value = getTimelineValueAtIndex({
						timeline,
						frameIndex: composition.frameIndex,
						layerIndex: layer.index,
						selection: timelineSelection[timeline.id],
					});

					op.add(
						timelineActions.removeTimeline(property.timelineId),
						compositionActions.setPropertyValue(property.id, value),
						compositionActions.setPropertyTimelineId(property.id, ""),
					);
					continue;
				}

				const timeline = createTimelineForLayerProperty(
					property.value,
					composition.frameIndex,
				);
				op.add(
					timelineActions.setTimeline(timeline.id, timeline),
					compositionActions.setPropertyTimelineId(property.id, timeline.id),
				);
			}

			op.submit();

			if (anyHasTimeline) {
				submitAction("Remove timelines from properties");
			} else {
				submitAction("Add timelines to properties");
			}
		});
	},

	onPropertyKeyframeIconMouseDown: (e: React.MouseEvent, propertyId: string): void => {
		e.stopPropagation();

		const { compositionState } = getActionState();

		const property = compositionState.properties[propertyId] as Property;
		const { timelineId } = property;

		if (timelineId) {
			// Delete timeline and make the value of the timeline at the current time
			// the value of the property

			requestAction({ history: true }, (params) => {
				const op = createOperation(params);
				timelineOperations.removeTimelineFromProperty(op, propertyId);
				op.submit();
				params.addDiff((diff) => diff.propertyStructure(property.layerId));
				params.submitAction("Remove timeline from property");
			});
			return;
		}

		// Create timeline with a single keyframe at the current time
		requestAction({ history: true }, (params) => {
			const op = createOperation(params);
			timelineOperations.addTimelineToProperty(op, propertyId);
			op.submit();
			params.addDiff((diff) => diff.propertyStructure(property.layerId));
			params.submitAction("Add timeline to property");
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
				params.addDiff((diff) => diff.compositionSelection(compositionId));
				params.submitAction("Clear timeline selection");
			},
		);
	},

	onRightClickOut: (e: React.MouseEvent, compositionId: string): void => {
		const position = Vec2.fromEvent(e);
		createTimelineContextMenu(position, { compositionId });
	},

	onLayerRightClick: (e: React.MouseEvent, layer: Layer): void => {
		const position = Vec2.fromEvent(e);
		createTimelineContextMenu(position, {
			compositionId: layer.compositionId,
			layerId: layer.id,
		});
	},

	onLayerNameMouseDown: (
		e: React.MouseEvent,
		areaId: string,
		compositionId: string,
		layerId: string,
		layerWrapper: React.RefObject<HTMLDivElement>,
	): void => {
		e.stopPropagation();

		const areaState = getAreaActionState<AreaType.Timeline>(areaId);

		const { compositionState, compositionSelectionState } = getActionState();

		const composition = compositionState.compositions[compositionId];
		const compositionSelection = compSelectionFromState(
			compositionId,
			compositionSelectionState,
		);
		const willBeSelected = !compositionSelection.layers[layerId];
		const additiveSelection = isKeyDown("Shift") || isKeyDown("Command");

		const rect = layerWrapper.current!.getBoundingClientRect();

		const yPosMap = getTimelineTrackYPositions(compositionId, compositionState, areaState.panY);

		const getInsertBelowLayerIndex = (
			mousePosGlobal: Vec2,
		): { type: "above" | "below" | "invalid"; layerId: string } | null => {
			const compositionSelection = compSelectionFromState(
				compositionId,
				getActionState().compositionSelectionState,
			);

			const mousePos = mousePosGlobal.sub(Vec2.new(rect.left, rect.top));

			for (let i = 0; i < composition.layers.length; i += 1) {
				const l0y = yPosMap.layer[composition.layers[i]];
				const l1y = yPosMap.layer[composition.layers[i + 1]] ?? Infinity;

				if (mousePos.y < l0y || mousePos.y > l1y + TIMELINE_BETWEEN_LAYERS) {
					continue;
				}

				const distl0 = mousePos.y - l0y;
				const distl1 = l1y - mousePos.y;

				let j = distl0 < distl1 ? i : i + 1;

				for (; j >= 0; j--) {
					const layerId = composition.layers[j];
					const l0y = yPosMap.layer[layerId];
					const l1y = yPosMap.layer[composition.layers[j + 1]] ?? Infinity;

					if (l0y < mousePos.y && mousePos.y < l1y + TIMELINE_BETWEEN_LAYERS) {
						if (compositionSelection.layers[layerId]) {
							return {
								layerId,
								type: "invalid",
							};
						}

						const distl0 = mousePos.y - l0y;
						const distl1 = yPosMap.layer[composition.layers[j + 1]]
							? l1y - mousePos.y
							: l0y + TIMELINE_LAYER_HEIGHT - mousePos.y;

						return {
							layerId,
							type: distl0 > distl1 ? "below" : "above",
						};
					}
				}
			}

			return { layerId: "", type: "below" }; // Insert at 0
		};

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
				timelineIds.map((timelineId) => timelineSelectionActions.clear(timelineId)),
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
				timelineIds.map((timelineId) => timelineSelectionActions.clear(timelineId)),
			);
		};

		const didLayerOrderChange: ShouldAddToStackFn = (a, b) => {
			const layersA = a.compositionState.compositions[compositionId].layers;
			const layersB = b.compositionState.compositions[compositionId].layers;

			for (let i = 0; i < layersA.length; i += 1) {
				if (layersA[i] !== layersB[i]) {
					return true;
				}
			}

			return false;
		};

		mouseDownMoveAction(e, {
			keys: [],
			shouldAddToStack: [didCompSelectionChange(compositionId), didLayerOrderChange],
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
				}
			},
			mouseMove: (params, { mousePosition }) => {
				// Layer was deselected, do not move selected layers.
				if (additiveSelection && !willBeSelected) {
					return;
				}

				params.dispatchToAreaState(
					areaId,
					timelineAreaActions.setFields({
						moveLayers: getInsertBelowLayerIndex(mousePosition.global),
					}),
				);
			},
			mouseUp: (params) => {
				if (additiveSelection && !willBeSelected) {
					params.submitAction("Remove layer from selection");
					return;
				}

				const { moveLayers } = getAreaActionState<AreaType.Timeline>(areaId);

				if (moveLayers) {
					// Clear `moveLayers`
					params.dispatchToAreaState(
						areaId,
						timelineAreaActions.setFields({ moveLayers: null }),
					);

					if (moveLayers.type === "invalid") {
						params.addDiff((diff) => diff.compositionSelection(compositionId));
						params.submitAction("Add layer to selection");
						return;
					}

					const { compositionSelectionState } = getActionState();

					params.dispatch(
						compositionActions.moveLayers(
							compositionId,
							moveLayers as { layerId: string; type: "above" | "below" },
							compositionSelectionState,
						),
					);
					params.submitAction("Move layers", { allowIndexShift: true });
					return;
				}

				if (!additiveSelection) {
					clearCompositionSelection(params);
				}

				addLayerToSelection(params);

				params.addDiff((diff) => diff.compositionSelection(compositionId));
				params.submitAction("Add layer to selection");
				// See if we are moving layer to an eligible target
			},
		});
	},

	onPropertyGraphMouseDown: (e: React.MouseEvent, propertyId: string): void => {
		e.stopPropagation();

		const { flowState, compositionState } = getActionState();
		const property = compositionState.properties[propertyId];

		if (property.name !== PropertyGroupName.ArrayModifier) {
			throw new Error("Only ArrayModifier property groups may have an associated graph");
		}

		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;

			// If graph exists, delete it. If not, create one.
			if (property.graphId) {
				dispatch(compositionActions.setPropertyGraphId(propertyId, ""));
				dispatch(flowActions.removeGraph(property.graphId));
				submitAction("Remove array modifier graph");
				return;
			}

			const { graph, node } = createArrayModifierFlowGraph(propertyId, flowState);

			dispatch(
				compositionActions.setPropertyGraphId(propertyId, graph.id),
				flowActions.setGraph(graph),
				flowActions.setNode(node),
			);
			submitAction("Create array modifier graph");
		});
	},

	onLayerGraphMouseDown: (e: React.MouseEvent, layerId: string): void => {
		e.stopPropagation();

		const { flowState, compositionState } = getActionState();
		const layer = compositionState.layers[layerId];

		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;

			// If graph exists, delete it. If not, create one.
			if (layer.graphId) {
				dispatch(compositionActions.setLayerGraphId(layerId, ""));
				dispatch(flowActions.removeGraph(layer.graphId));
				submitAction("Remove layer graph");
				return;
			}

			const { graph, node } = createLayerFlowGraph(layerId, flowState);

			dispatch(
				compositionActions.setLayerGraphId(layerId, graph.id),
				flowActions.setGraph(graph),
				flowActions.setNode(node),
			);
			submitAction("Create layer graph");
		});
	},

	onOpenGraphInAreaMouseDown: (e: React.MouseEvent, graphId: string): void => {
		const area: Area<AreaType.FlowEditor> = {
			type: AreaType.FlowEditor,
			state: { ...areaInitialStates[AreaType.FlowEditor], graphId },
		};
		dragOpenArea(e, { area });
	},

	onPropertyNameMouseDown: (
		e: React.MouseEvent,
		compositionId: string,
		propertyId: string,
	): void => {
		e.stopPropagation();

		const { compositionState, compositionSelectionState, timelineState } = getActionState();
		const compositionSelection = compSelectionFromState(
			compositionId,
			compositionSelectionState,
		);
		const property = compositionState.properties[propertyId];

		const additiveSelection = isKeyDown("Command") || isKeyDown("Shift");

		requestAction(
			{ history: true, shouldAddToStack: didCompSelectionChange(compositionId) },
			(params) => {
				const op = createOperation(params);

				if (!additiveSelection) {
					// Clear other properties and timeline keyframes
					op.add(compSelectionActions.clearCompositionSelection(compositionId));

					const timelineIds = getTimelineIdsReferencedByComposition(
						compositionId,
						compositionState,
					);
					op.add(...timelineIds.map((id) => timelineSelectionActions.clear(id)));
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
						op.add(
							compSelectionActions.removeLayersFromSelection(compositionId, [
								property.layerId,
							]),
						);
					}

					// Remove property and timeline keyframes from selection
					op.add(
						compSelectionActions.removePropertiesFromSelection(compositionId, [
							propertyId,
						]),
					);

					if (property.type === "property" && property.timelineId) {
						op.add(timelineSelectionActions.clear(property.timelineId));
					} else if (property.type === "compound") {
						for (const propertyId of property.properties) {
							const p = compositionState.properties[propertyId] as Property;

							if (!p.timelineId) {
								continue;
							}

							op.add(timelineSelectionActions.clear(p.timelineId));
						}
					}
				} else {
					// Add property and timeline keyframes to selection
					op.add(compSelectionActions.addPropertyToSelection(compositionId, propertyId));
					op.add(
						compSelectionActions.addLayerToSelection(compositionId, property.layerId),
					);

					if (property.type === "property" && property.timelineId) {
						const timeline = timelineState[property.timelineId];
						const keyframeIds = timeline.keyframes.map((k) => k.id);
						op.add(timelineSelectionActions.addKeyframes(timeline.id, keyframeIds));
					} else if (property.type === "compound") {
						for (const propertyId of property.properties) {
							const p = compositionState.properties[propertyId] as Property;

							if (!p.timelineId) {
								continue;
							}

							const timeline = timelineState[p.timelineId];
							const keyframeIds = timeline.keyframes.map((k) => k.id);
							op.add(timelineSelectionActions.addKeyframes(timeline.id, keyframeIds));
						}
					}
				}

				op.submit();
				params.addDiff((diff) => diff.compositionSelection(property.compositionId));
				params.submitAction("Select property");
			},
		);
	},

	moveModifierInList: (modifierPropertyId: string, moveBy: -1 | 1) => {
		requestAction({ history: true }, (params) => {
			const { compositionState } = getActionState();
			const property = compositionState.properties[modifierPropertyId];

			params.dispatch(compositionActions.moveModifier(modifierPropertyId, moveBy));
			params.addDiff((diff) => diff.modifierOrder(property.layerId));
			params.submitAction("Move modifier");
		});
	},

	toggleMaintainPropertyProportions: (propertyId: string) => {
		requestAction({ history: true }, (params) => {
			const { compositionState } = getActionState();
			const property = compositionState.properties[propertyId] as CompoundProperty;

			const maintainProportions = !property.maintainProportions;

			params.dispatch(
				compositionActions.setPropertyMaintainProportions(propertyId, maintainProportions),
			);
			params.submitAction("Toggle maintain proportions");
		});
	},
};
