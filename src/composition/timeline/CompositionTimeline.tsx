import React, { useState, useRef } from "react";
import { AreaWindowProps } from "~/types/areaTypes";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { connectActionState } from "~/state/stateUtils";
import {
	CompositionTimelineAreaState,
	compositionTimelineAreaActions,
} from "~/composition/timeline/compositionTimelineAreaReducer";
import styles from "~/composition/timeline/CompositionTimeline.styles";
import { Composition, CompositionLayerProperty } from "~/composition/compositionTypes";
import { splitRect, capToRange } from "~/util/math";
import { RequestActionCallback, requestAction } from "~/listener/requestAction";
import { separateLeftRightMouse } from "~/util/mouse";
import { CompositionTimelineLayer } from "~/composition/timeline/CompositionTimelineLayer";
import { ViewBounds } from "~/timeline/ViewBounds";
import { areaActions } from "~/area/state/areaActions";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { compositionTimelineHandlers } from "~/composition/timeline/compositionTimelineHandlers";
import { TimelineEditor } from "~/timeline/TimelineEditor";
import { createToTimelineViewportX } from "~/timeline/renderTimeline";
import { CompositionState } from "~/composition/state/compositionReducer";
import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";

const s = compileStylesheetLabelled(styles);

const SEPARATOR_WIDTH = 4;

type OwnProps = AreaWindowProps<CompositionTimelineAreaState>;
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

	let [viewportLeft, viewportRight] = splitRect("horizontal", props.viewport, t, SEPARATOR_WIDTH);

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
		const { viewport } = props;

		addListener.repeated("mousemove", (e) => {
			const pos = Vec2.fromEvent(e).subX(viewport.left);
			setT(capToRange(0.1, 0.8, pos.x / viewport.width));
		});

		addListener.once("mouseup", () => {
			submitAction();
		});
	};

	const toTimelineX = createToTimelineViewportX({
		length: props.composition.length,
		viewBounds: props.viewBounds,
		width: viewportRight.width,
	});

	let timelineId = "";
	if (props.selection.compositionId === props.composition.id) {
		const layers = props.composition.layers.map((id) => props.compositionState.layers[id]);

		const properties: CompositionLayerProperty[] = [];

		for (let i = 0; i < layers.length; i += 1) {
			const propertyIds = layers[i].properties;
			for (let j = 0; j < propertyIds.length; j += 1) {
				if (!props.selection.properties[propertyIds[j]]) {
					continue;
				}
				properties.push(props.compositionState.properties[propertyIds[j]]);
			}
		}

		for (let i = 0; i < properties.length; i += 1) {
			if (properties[i].timelineId) {
				timelineId = properties[i].timelineId;
				break;
			}
		}
	}

	const outRef = useRef<HTMLDivElement>(null);

	return (
		<div className={s("wrapper")}>
			<div
				className={s("left")}
				style={viewportLeft}
				ref={outRef}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						compositionTimelineHandlers.onMouseDownOut(e, outRef, props.composition.id),
				})}
			>
				<div className={s("header")} />
				{composition.layers.map((layerId, i) => {
					return (
						<CompositionTimelineLayer
							compositionId={props.composition.id}
							id={layerId}
							key={i}
						/>
					);
				})}
			</div>
			<div
				className={s("separator")}
				style={{ width: SEPARATOR_WIDTH, left: viewportLeft.width }}
				onMouseDown={separateLeftRightMouse({
					left: (e) => {
						e.preventDefault();
						requestAction({ history: false }, onMouseDown);
					},
				})}
			/>
			<div className={s("right")} style={viewportRight}>
				<ViewBounds
					left={viewportRight.left}
					width={viewportRight.width}
					requestUpdate={(cb) => {
						requestAction({ history: false }, (params) => {
							cb({
								addListener: params.addListener,
								update: (viewBounds) => {
									params.dispatch(
										areaActions.dispatchToAreaState(
											props.areaId,
											compositionTimelineAreaActions.setViewBounds(
												viewBounds,
											),
										),
									);
								},
								submit: () => params.submitAction(),
							});
						});
					}}
					viewBounds={props.viewBounds}
				/>
				<div
					className={s("scrubContainer")}
					onMouseDown={separateLeftRightMouse({
						left: (e) =>
							compositionTimelineHandlers.onScrubMouseDown(e, {
								composition: props.composition,
								viewBounds: props.viewBounds,
								viewport: viewportRight,
							}),
					})}
				>
					<div
						className={s("scrubHead")}
						style={{ left: toTimelineX(props.composition.frameIndex) }}
					>
						<div className={s("scrubLine")} style={{ height: viewportRight.height }} />
					</div>
				</div>
				<div style={{ position: "relative" }}>
					<div
						className={s("zoomTarget")}
						ref={zoomTarget}
						onMouseDown={separateLeftRightMouse({
							left: (e) =>
								compositionTimelineHandlers.onZoomClick(e, props.areaId, {
									viewBounds: props.viewBounds,
									left: viewportRight.left,
									width: viewportRight.width,
								}),
						})}
					/>
					<div
						className={s("panTarget")}
						ref={panTarget}
						onMouseDown={separateLeftRightMouse({
							left: (e) =>
								compositionTimelineHandlers.onPanViewBounds(e, props.areaId, {
									left: viewportRight.left,
									width: viewportRight.width,
									length: props.composition.length,
									viewBounds: props.viewBounds,
								}),
						})}
					/>
					{timelineId && (
						<TimelineEditor
							id={timelineId}
							viewport={{
								...viewportRight,
								height: viewportRight.height - 32,
								top: viewportRight.top + 32,
							}}
							viewBounds={props.viewBounds}
							length={props.composition.length}
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
