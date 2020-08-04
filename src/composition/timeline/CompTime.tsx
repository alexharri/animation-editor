import React, { useEffect, useRef, useState } from "react";
import { areaActions } from "~/area/state/areaActions";
import {
	Composition,
	CompositionProperty,
	CompositionSelection,
} from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import styles from "~/composition/timeline/CompTime.styles";
import { compTimeAreaActions, CompTimeAreaState } from "~/composition/timeline/compTimeAreaReducer";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { CompTimeLayerList } from "~/composition/timeline/CompTimeLayerList";
import { capCompTimePanY } from "~/composition/timeline/compTimeUtils";
import { CompTimeScrubber } from "~/composition/timeline/scrubber/CompTimeScrubber";
import { TrackEditor } from "~/composition/timeline/track/TrackEditor";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { COMP_TIME_SEPARATOR_WIDTH } from "~/constants";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { TimelineEditor } from "~/timeline/TimelineEditor";
import { ViewBounds } from "~/timeline/ViewBounds";
import { AreaComponentProps } from "~/types/areaTypes";
import { capToRange, isVecInRect, splitRect } from "~/util/math";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaComponentProps<CompTimeAreaState>;
interface StateProps {
	composition: Composition;
	compositionSelection: CompositionSelection;
	compositionState: CompositionState;
	viewBounds: [number, number];
}
type Props = OwnProps & StateProps;

const CompTimeComponent: React.FC<Props> = (props) => {
	const { composition } = props;

	const [t, setT] = useState(0.3);

	let [viewportLeft, viewportRight] = splitRect(
		"horizontal",
		props,
		t,
		COMP_TIME_SEPARATOR_WIDTH,
	);

	const zoomTarget = useRef<HTMLDivElement>(null);
	const panTarget = useRef<HTMLDivElement>(null);

	useKeyDownEffect("Z", (down) => {
		if (zoomTarget.current) {
			zoomTarget.current.style.display = down ? "block" : "";
		}
	});
	useKeyDownEffect("Space", (down) => {
		if (panTarget.current) {
			panTarget.current.style.display = down ? "block" : "";
		}
	});

	const onMouseDown: RequestActionCallback = (params) => {
		const { addListener, submitAction } = params;

		addListener.repeated("mousemove", (e) => {
			const pos = Vec2.fromEvent(e).subX(props.left);
			setT(capToRange(0.1, 0.8, pos.x / props.width));
		});

		addListener.once("mouseup", () => {
			submitAction();
		});
	};

	const timelineIds: string[] = [];
	const colors: Partial<{ [timelineId: string]: string }> = {};

	const layers = props.composition.layers.map((id) => props.compositionState.layers[id]);
	const properties: CompositionProperty[] = [];

	for (let i = 0; i < layers.length; i += 1) {
		properties.push(...getLayerCompositionProperties(layers[i].id, props.compositionState));
	}

	for (let i = 0; i < properties.length; i += 1) {
		if (!props.compositionSelection.properties[properties[i].id]) {
			continue;
		}

		if (properties[i].timelineId) {
			timelineIds.push(properties[i].timelineId);
			colors[properties[i].timelineId] = properties[i].color;
		}
	}

	const outRef = useRef<HTMLDivElement>(null);

	const panY = capCompTimePanY(
		props.areaState.panY,
		composition.id,
		props.height - 32,
		props.compositionState,
	);

	const wrapperRef = useRef<HTMLDivElement>(null);

	const propsRef = useRef<Props>(props);
	propsRef.current = props;

	useEffect(() => {
		if (!wrapperRef.current) {
			return;
		}

		const listener = (e: WheelEvent) => {
			const props = propsRef.current;

			e.preventDefault();

			const panY = capCompTimePanY(
				props.areaState.panY,
				composition.id,
				props.height,
				props.compositionState,
			);

			let [viewportLeft, viewportRight] = splitRect(
				"horizontal",
				props,
				t,
				COMP_TIME_SEPARATOR_WIDTH,
			);
			const lockY = props.areaState.graphEditorOpen
				? !isVecInRect(Vec2.fromEvent(e), viewportLeft)
				: false;

			compTimeHandlers.onWheelPan(e as any, props.areaId, {
				compositionId: props.composition.id,
				viewport: viewportRight,
				compositionLength: props.composition.length,
				viewBounds: props.viewBounds,
				lockY,
				panY,
			});
		};

		const el = wrapperRef.current;
		el.addEventListener("wheel", listener, { passive: false });

		return () => {
			el.removeEventListener("wheel", listener);
		};
	}, [wrapperRef.current]);

	return (
		<div className={s("wrapper")} ref={wrapperRef}>
			<div
				className={s("panTarget")}
				ref={panTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => {
						const lockY = props.areaState.graphEditorOpen
							? !isVecInRect(Vec2.fromEvent(e), viewportLeft)
							: false;
						compTimeHandlers.onPan(e, props.areaId, {
							compositionId: props.composition.id,
							viewport: viewportRight,
							compositionLength: props.composition.length,
							viewBounds: props.viewBounds,
							lockY,
							panY,
						});
					},
				})}
			/>
			<div
				className={s("left")}
				style={viewportLeft}
				ref={outRef}
				onMouseDown={separateLeftRightMouse({
					left: () => compTimeHandlers.onMouseDownOut(props.composition.id),
					right: (e) => compTimeHandlers.onRightClickOut(e, props.composition.id),
				})}
			>
				<div className={s("header")}>
					<button
						className={s("graphEditorToggle")}
						onMouseDown={(e) => e.stopPropagation()}
						onClick={() => {
							requestAction({ history: false }, (params) => {
								params.dispatch(
									areaActions.dispatchToAreaState(
										props.areaId,
										compTimeAreaActions.toggleGraphEditorOpen(),
									),
								);
								params.submitAction();
							});
						}}
					>
						Graph Editor
					</button>
				</div>
				<CompTimeLayerList
					compositionId={composition.id}
					moveLayers={props.areaState.moveLayers}
					panY={props.areaState.panY}
				/>
			</div>
			<div
				className={s("separator")}
				style={{ left: viewportLeft.width }}
				onMouseDown={separateLeftRightMouse({
					left: () => requestAction({ history: false }, onMouseDown),
				})}
			/>
			<div className={s("right")} style={viewportRight}>
				<ViewBounds
					left={viewportRight.left}
					width={viewportRight.width}
					compositionLength={props.composition.length}
					requestUpdate={(cb) => {
						requestAction({ history: false }, (params) => {
							cb({
								addListener: params.addListener,
								update: (viewBounds) => {
									params.dispatch(
										areaActions.dispatchToAreaState(
											props.areaId,
											compTimeAreaActions.setViewBounds(viewBounds),
										),
									);
								},
								submit: () => params.submitAction(),
							});
						});
					}}
					viewBounds={props.viewBounds}
				/>
				<CompTimeScrubber
					compositionId={props.composition.id}
					viewportRight={viewportRight}
					viewBounds={props.viewBounds}
				/>
				<div style={{ position: "relative" }}>
					<div
						className={s("zoomTarget")}
						ref={zoomTarget}
						onMouseDown={separateLeftRightMouse({
							left: (e) =>
								compTimeHandlers.onZoomClick(e, props.areaId, {
									viewBounds: props.viewBounds,
									left: viewportRight.left,
									width: viewportRight.width,
								}),
						})}
					/>
					{!props.areaState.graphEditorOpen && (
						<TrackEditor
							panY={props.areaState.panY}
							viewBounds={props.viewBounds}
							compositionId={props.composition.id}
							viewport={{
								width: viewportRight.width,
								height: viewportRight.height - 32,
								left: viewportRight.left,
								top: viewportRight.top + 32,
							}}
							compositionTimelineAreaId={props.areaId}
							trackDragSelectRect={props.areaState.trackDragSelectRect}
							layerIndexShift={props.areaState.layerIndexShift}
							layerLengthShift={props.areaState.layerLengthShift}
						/>
					)}
					{props.areaState.graphEditorOpen && timelineIds.length > 0 && (
						<TimelineEditor
							compositionTimelineAreaId={props.areaId}
							ids={timelineIds}
							viewport={{
								...viewportRight,
								height: viewportRight.height - 32,
								top: viewportRight.top + 32,
							}}
							colors={colors}
							viewBounds={props.viewBounds}
							length={props.composition.length}
							dragSelectRect={props.areaState.dragSelectRect}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositionState, compositionSelectionState },
	ownProps,
) => {
	const compositionSelection = getCompSelectionFromState(
		ownProps.areaState.compositionId,
		compositionSelectionState,
	);
	return {
		compositionState,
		compositionSelection,
		composition: compositionState.compositions[ownProps.areaState.compositionId],
		viewBounds: ownProps.areaState.viewBounds,
	};
};

export const CompTime = connectActionState(mapStateToProps)(CompTimeComponent);
