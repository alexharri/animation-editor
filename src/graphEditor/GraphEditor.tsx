import React, { useRef } from "react";
import { CompoundProperty } from "~/composition/compositionTypes";
import { reduceCompProperties } from "~/composition/compositionUtils";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { AreaType, TimelineColors } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { openGraphEditorContextMenu } from "~/graphEditor/graphEditorContextMenu";
import { graphEditorHandlers } from "~/graphEditor/graphEditorHandlers";
import { renderGraphEditor } from "~/graphEditor/renderGraphEditor";
import { useGraphEditorCursor } from "~/graphEditor/useGraphEditorCursor";
import { useTickedRendering } from "~/hook/useTickedRendering";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import {
	applyTimelineIndexAndValueShifts,
	getSelectedTimelineIdsInComposition,
} from "~/timeline/timelineUtils";
import { separateLeftRightMouse } from "~/util/mouse";

interface OwnProps {
	compositionId: string;
	viewport: Rect;
	areaId: string;
}
type Props = OwnProps;

export const GraphEditor: React.FC<Props> = (props) => {
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

				const compositionSelection = compSelectionFromState(
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
						if (!property.timelineId) {
							return acc;
						}

						const compoundProperty: CompoundProperty | undefined = compositionState
							.properties[property.compoundPropertyId] as CompoundProperty;

						if (
							compositionSelection.properties[property.id] ||
							(compoundProperty &&
								!compoundProperty.separated &&
								compositionSelection.properties[compoundProperty.id])
						) {
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
					compositionLength: composition.length,
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

	const { viewport, areaId } = props;
	const { width, height } = viewport;

	const renderCursor = useGraphEditorCursor(canvasRef, { viewport, areaId });

	const onLeftMouseDown = (e: React.MouseEvent) => {
		const { compositionState, compositionSelectionState } = getActionState();
		const timelineIds = getSelectedTimelineIdsInComposition(
			props.compositionId,
			compositionState,
			compositionSelectionState,
		);

		if (timelineIds.length === 0) {
			return;
		}

		graphEditorHandlers.onMouseDown(e, {
			areaId: props.areaId,
			viewport,
		});
	};

	const onRightMouseDown = (e: React.MouseEvent) => {
		const { compositionState, compositionSelectionState } = getActionState();
		const { compositionId } = props;
		const timelineIds = getSelectedTimelineIdsInComposition(
			compositionId,
			compositionState,
			compositionSelectionState,
		);
		openGraphEditorContextMenu(Vec2.fromEvent(e), { timelineIds, compositionId });
	};

	const onMouseMove = (e: React.MouseEvent) => {
		renderCursor(e);
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
				onMouseMove={onMouseMove}
			/>
		</div>
	);
};
