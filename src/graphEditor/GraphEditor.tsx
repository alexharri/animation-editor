import React, { useRef } from "react";
import { reduceCompProperties } from "~/composition/compositionUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { AreaType, TimelineColors } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { openGraphEditorContextMenu } from "~/graphEditor/graphEditorContextMenu";
import { timelineHandlers } from "~/graphEditor/graphEditorHandlers";
import { renderGraphEditor } from "~/graphEditor/renderGraphEditor";
import { useTickedRendering } from "~/hook/useTickedRendering";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { applyTimelineIndexAndValueShifts } from "~/timeline/timelineUtils";
import { separateLeftRightMouse } from "~/util/mouse";

const getTimelineIds = (compositionId: string) => {
	const { compositionState, compositionSelectionState } = getActionState();

	const compositionSelection = getCompSelectionFromState(
		compositionId,
		compositionSelectionState,
	);
	return reduceCompProperties<string[]>(
		compositionId,
		compositionState,
		(acc, property) => {
			if (property.timelineId && compositionSelection.properties[property.id]) {
				acc.push(property.timelineId);
			}
			return acc;
		},
		[],
	);
};

interface OwnProps {
	compositionId: string;
	viewport: Rect;
	areaId: string;
	viewBounds: [number, number];
	dragSelectRect: Rect | null;
}
type Props = OwnProps;

const GraphEditorComponent: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const propsRef = useRef(props);
	propsRef.current = props;

	useTickedRendering(
		{
			keyDown: {},
			shouldUpdate: (prevState, nextState) => {
				if (prevState.timelineState !== nextState.timelineState) {
					return true;
				}

				if (prevState.timelineSelectionState !== nextState.timelineSelectionState) {
					return true;
				}

				return false;
			},
			render: () => {
				const { compositionId, viewport } = propsRef.current;
				const ctx = canvasRef.current?.getContext("2d");

				if (!ctx) {
					return;
				}

				const {
					compositionState,
					compositionSelectionState,
					timelineState,
					timelineSelectionState,
				} = getActionState();

				const composition = compositionState.compositions[compositionId];

				const compositionSelection = getCompSelectionFromState(
					compositionId,
					compositionSelectionState,
				);
				const { timelineIds, colors } = reduceCompProperties<{
					timelineIds: string[];
					colors: { [propertyId: string]: string };
				}>(
					compositionId,
					compositionState,
					(acc, property) => {
						if (property.timelineId && compositionSelection.properties[property.id]) {
							acc.timelineIds.push(property.timelineId);
							acc.colors[property.timelineId] =
								property.color || TimelineColors.XPosition;
						}
						return acc;
					},
					{ timelineIds: [], colors: {} },
				);

				const timelines = timelineIds.map((timelineId) => {
					const timeline = timelineState[timelineId];
					return applyTimelineIndexAndValueShifts(
						timeline,
						timelineSelectionState[timelineId],
					);
				});

				const { dragSelectRect, viewBounds } = getAreaActionState<AreaType.Timeline>(
					props.areaId,
				);

				renderGraphEditor({
					ctx,
					length: composition.length,
					width: viewport.width,
					height: viewport.height,
					timelines,
					colors,
					viewBounds,
					timelineSelectionState,
					dragSelectRect,
				});
			},
		},
		[props],
	);

	const { viewBounds, viewport } = props;
	const { width, height } = viewport;

	const onLeftMouseDown = (e: React.MouseEvent) => {
		const { timelineState, compositionState } = getActionState();
		const timelineIds = getTimelineIds(props.compositionId);
		const timelines = timelineIds.map((id) => timelineState[id]);
		const composition = compositionState.compositions[props.compositionId];

		timelineHandlers.onMouseDown(e, {
			timelineAreaId: props.areaId,
			timelines,
			length: composition.length,
			viewBounds,
			viewport,
		});
	};

	const onRightMouseDown = (e: React.MouseEvent) => {
		const timelineIds = getTimelineIds(props.compositionId);
		openGraphEditorContextMenu(Vec2.fromEvent(e), { timelineIds });
	};

	return (
		<div style={{ background: cssVariables.gray400 }}>
			<canvas
				ref={canvasRef}
				height={height}
				width={width}
				onMouseDown={separateLeftRightMouse({
					left: onLeftMouseDown,
					right: onRightMouseDown,
				})}
			/>
		</div>
	);
};

export const GraphEditor = GraphEditorComponent;
