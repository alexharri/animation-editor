import React, { useState, useRef, useEffect } from "react";
import { AreaComponentProps } from "~/types/areaTypes";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { connectActionState } from "~/state/stateUtils";
import { CompTimeAreaState, compTimeAreaActions } from "~/composition/timeline/compTimeAreaReducer";
import { Composition, CompositionProperty } from "~/composition/compositionTypes";
import { splitRect, capToRange, isVecInRect } from "~/util/math";
import { RequestActionCallback, requestAction } from "~/listener/requestAction";
import { separateLeftRightMouse } from "~/util/mouse";
import { CompTimeLayer } from "~/composition/timeline/layer/CompTimeLayer";
import { ViewBounds } from "~/timeline/ViewBounds";
import { areaActions } from "~/area/state/areaActions";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { TimelineEditor } from "~/timeline/TimelineEditor";
import { CompositionState } from "~/composition/state/compositionReducer";
import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { CompTimeScrubber } from "~/composition/timeline/scrubber/CompTimeScrubber";
import styles from "~/composition/timeline/CompositionTimeline.styles";
import { TrackEditor } from "~/composition/timeline/track/TrackEditor";
import { capCompTimePanY } from "~/composition/timeline/compTimeUtils";

const s = compileStylesheetLabelled(styles);

const SEPARATOR_WIDTH = 4;

type OwnProps = AreaComponentProps<CompTimeAreaState>;
interface StateProps {
	composition: Composition;
	selection: CompositionSelectionState;
	compositionState: CompositionState;
	viewBounds: [number, number];
}
type Props = OwnProps & StateProps;

const CompositionTimelineComponent: React.FC<Props> = (props) => {
	const { composition } = props;

	const [t, setT] = useState(0.3);

	let [viewportLeft, viewportRight] = splitRect("horizontal", props, t, SEPARATOR_WIDTH);

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

	// useCompositionTimelinePlayback(props.composition.id);

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

	if (props.selection.compositionId === props.composition.id) {
		const layers = props.composition.layers.map((id) => props.compositionState.layers[id]);

		const properties: CompositionProperty[] = [];

		for (let i = 0; i < layers.length; i += 1) {
			properties.push(...getLayerCompositionProperties(layers[i].id, props.compositionState));
		}

		for (let i = 0; i < properties.length; i += 1) {
			if (!props.selection.properties[properties[i].id]) {
				continue;
			}

			if (properties[i].timelineId) {
				timelineIds.push(properties[i].timelineId);
				colors[properties[i].timelineId] = properties[i].color;
			}
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

			let [viewportLeft, viewportRight] = splitRect("horizontal", props, t, SEPARATOR_WIDTH);
			const lockY = props.areaState.graphEditorOpen
				? !isVecInRect(Vec2.fromEvent(e), viewportLeft)
				: false;

			compTimeHandlers.onWheelPan(e as any, props.areaId, {
				compositionId: props.composition.id,
				left: viewportRight.left,
				viewportWidth: viewportRight.width,
				viewportHeight: viewportRight.height,
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
							left: viewportRight.left,
							viewportWidth: viewportRight.width,
							viewportHeight: viewportRight.height,
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
					left: (e) => compTimeHandlers.onMouseDownOut(e, outRef, props.composition.id),
					right: (e) => compTimeHandlers.onRightClickOut(e, props.composition.id),
				})}
			>
				<div className={s("header")}>
					<button
						className={s("graphEditorToggle")}
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
				<div className={s("layerWrapper")} data-ct-composition-id={composition.id}>
					<div style={{ transform: `translateY(${-panY}px)` }}>
						{composition.layers.map((layerId) => {
							return (
								<CompTimeLayer
									compositionId={props.composition.id}
									id={layerId}
									key={layerId}
								/>
							);
						})}
					</div>
				</div>
			</div>
			<div
				className={s("separator")}
				style={{ width: SEPARATOR_WIDTH, left: viewportLeft.width }}
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
	{ compositions, compositionSelection },
	ownProps,
) => ({
	compositionState: compositions,
	selection: compositionSelection,
	composition: compositions.compositions[ownProps.areaState.compositionId],
	viewBounds: ownProps.areaState.viewBounds,
});

export const CompositionTimeline = connectActionState(mapStateToProps)(
	CompositionTimelineComponent,
);
