import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { isKeyDown } from "~/listener/keyboard";
import { capToRange, interpolate, getDistance } from "~/util/math";
import { animate } from "~/util/animation/animate";
import { areaActions } from "~/area/state/areaActions";
import { compositionTimelineAreaActions } from "~/composition/timeline/compositionTimelineAreaReducer";
import {
	transformGlobalToTimelineX,
	getTimelineValueAtIndex,
	createTimelineForLayerProperty,
} from "~/timeline/timelineUtils";
import { Composition, CompositionProperty } from "~/composition/compositionTypes";
import { compositionActions } from "~/composition/state/compositionReducer";
import { getActionState } from "~/state/stateUtils";
import { timelineActions } from "~/timeline/timelineActions";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { createLayerGraph } from "~/nodeEditor/graph/createLayerGraph";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { getAreaRootViewport } from "~/area/util/getAreaViewport";
import { computeAreaToViewport } from "~/area/util/areaToViewport";
import { AreaType } from "~/constants";
import { areaInitialStates } from "~/area/state/areaInitialStates";
import { getAreaToOpenTargetId } from "~/area/util/areaUtils";

const ZOOM_FAC = 0.25;

export const compositionTimelineHandlers = {
	onScrubMouseDown: (
		e: React.MouseEvent,
		options: {
			composition: Composition;
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		e.preventDefault();

		const { composition, viewport, viewBounds } = options;

		const fn: RequestActionCallback = (params) => {
			const { addListener, dispatch, submitAction } = params;

			const onMove = (e: MouseEvent | React.MouseEvent) => {
				const pos = Vec2.fromEvent(e);
				const x = transformGlobalToTimelineX(
					pos.x,
					viewBounds,
					viewport.left,
					viewport.width,
					composition.length,
				);
				dispatch(
					compositionActions.setFrameIndex(
						composition.id,
						capToRange(0, composition.length - 1, Math.round(x)),
					),
				);
			};
			addListener.repeated("mousemove", onMove);
			onMove(e);

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
	) => {
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
						compositionTimelineAreaActions.setViewBounds([
							interpolate(viewBounds[0], newBounds[0], t),
							interpolate(viewBounds[1], newBounds[1], t),
						]),
					),
				);
			}).then(() => submitAction());
		});
	},

	/**
	 * When the user Space + Mouse drags the timeline around
	 */
	onPanViewBounds: (
		e: React.MouseEvent,
		areaId: string,
		options: {
			length: number;
			viewBounds: [number, number];
			width: number;
			left: number;
		},
	) => {
		e.preventDefault();

		const fn: RequestActionCallback = ({ addListener, submitAction, dispatch }) => {
			const { viewBounds, length, width, left } = options;

			const initialPos = transformGlobalToTimelineX(
				Vec2.fromEvent(e).x,
				viewBounds,
				left,
				width,
				length,
			);
			let initialT = initialPos / length;

			addListener.repeated("mousemove", (e) => {
				const pos = transformGlobalToTimelineX(
					Vec2.fromEvent(e).x,
					viewBounds,
					left,
					width,
					length,
				);

				const t = pos / length;

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

				dispatch(
					areaActions.dispatchToAreaState(
						areaId,
						compositionTimelineAreaActions.setViewBounds(newBounds),
					),
				);
			});

			addListener.once("mouseup", () => submitAction());
		};
		requestAction({ history: false }, fn);
	},

	onPropertyKeyframeIconMouseDown: (
		compositionId: string,
		propertyId: string,
		timelineId: string,
	) => {
		const { compositions, timelines, timelineSelection } = getActionState();
		const composition = compositions.compositions[compositionId];
		const property = compositions.properties[propertyId] as CompositionProperty;

		if (timelineId) {
			// Delete timeline and make the value of the timeline at the current time
			// the value of the property
			const timeline = timelines[timelineId];
			const value = getTimelineValueAtIndex(
				composition.frameIndex,
				timeline,
				timelineSelection[timeline.id],
			);

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

	onMouseDownOut: (
		e: React.MouseEvent,
		ref: React.RefObject<HTMLDivElement>,
		compositionId: string,
	) => {
		if (e.target !== ref.current) {
			return;
		}

		e.preventDefault();
		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;
			dispatch(compositionActions.clearCompositionSelection(compositionId));
			submitAction("Clear selection");
		});
	},

	onRightClickOut: (e: React.MouseEvent, compositionId: string) => {
		const position = Vec2.fromEvent(e);

		requestAction({ history: true }, (params) => {
			const addRectLayer = () => {
				params.dispatch(compositionActions.createRectLayer(compositionId));
				params.dispatch(contextMenuActions.closeContextMenu());
				params.submitAction("Add Rect Layer");
			};

			params.dispatch(
				contextMenuActions.openContextMenu(
					"Composition Timeline",
					[
						{
							label: "Add new layer",
							options: [
								{
									label: "Rect",
									onSelect: addRectLayer,
								},
							],
						},
					],
					position,
					params.cancelAction,
				),
			);
		});
	},

	onLayerRightClick: (e: React.MouseEvent, layerId: string) => {
		const position = Vec2.fromEvent(e);

		requestAction({ history: true }, (params) => {
			const removeLayer = () => {
				const compositionState = getActionState().compositions;
				const layer = compositionState.layers[layerId];

				// Remove all timelines referenced by properties of the deleted layer.
				//
				// In the future, timelines may be referenced in more ways than just by animated
				// properties. When that is the case we will have to check for other references to
				// the timelines we're deleting.
				const timelineIdsToRemove: string[] = [];

				function crawl(propertyId: string) {
					const property = compositionState.properties[propertyId];

					if (property.type === "group") {
						property.properties.forEach(crawl);
						return;
					}

					if (property.timelineId) {
						timelineIdsToRemove.push(property.timelineId);
					}
				}
				layer.properties.forEach(crawl);

				timelineIdsToRemove.forEach((id) =>
					params.dispatch(timelineActions.removeTimeline(id)),
				);

				params.dispatch(
					compositionActions.removeLayer(layer.id),
					contextMenuActions.closeContextMenu(),
				);
				params.submitAction("Delete layer");
			};

			params.dispatch(
				contextMenuActions.openContextMenu(
					"Layer",
					[
						{
							label: "Delete",
							onSelect: removeLayer,
						},
					],
					position,
					params.cancelAction,
				),
			);
		});
	},

	onLayerNameMouseDown: (e: React.MouseEvent, compositionId: string, propertyId: string) => {
		e.preventDefault();
		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;

			if (isKeyDown("Command")) {
				dispatch(compositionActions.toggleLayerSelection(compositionId, propertyId));
				submitAction("Toggle selection");
			} else {
				dispatch(compositionActions.clearCompositionSelection(compositionId));
				dispatch(compositionActions.toggleLayerSelection(compositionId, propertyId));
				submitAction("Select property");
			}
		});
	},

	onLayerGraphMouseDown: (e: React.MouseEvent, layerId: string) => {
		e.preventDefault();

		const compositionState = getActionState().compositions;
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

	onOpenGraphInAreaMouseDown: (e: React.MouseEvent, layerId: string) => {
		e.preventDefault();

		const compositionState = getActionState().compositions;
		const layer = compositionState.layers[layerId];

		requestAction({ history: true }, (params) => {
			const { dispatch, cancelAction, submitAction, addListener } = params;

			const initialMousePos = Vec2.fromEvent(e);

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

	onPropertyNameMouseDown: (e: React.MouseEvent, compositionId: string, propertyId: string) => {
		e.preventDefault();
		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;

			if (isKeyDown("Command")) {
				dispatch(compositionActions.togglePropertySelection(compositionId, propertyId));
				submitAction("Toggle selection");
			} else {
				dispatch(compositionActions.clearCompositionSelection(compositionId));
				dispatch(compositionActions.togglePropertySelection(compositionId, propertyId));
				submitAction("Select property");
			}
		});
	},
};
