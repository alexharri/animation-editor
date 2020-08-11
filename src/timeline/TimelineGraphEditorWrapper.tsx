import React, { useMemo, useState } from "react";
import { CompositionProperty } from "~/composition/compositionTypes";
import { reduceCompProperties } from "~/composition/compositionUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { GraphEditor } from "~/graphEditor/GraphEditor";
import { useActionStateEffect } from "~/hook/useActionState";
import { connectActionState } from "~/state/stateUtils";

interface OwnProps {
	compositionId: string;
	areaId: string;
	viewport: Rect;
	viewBounds: [number, number];
	dragSelectRect: Rect | null;
}
interface StateProps {
	compositionLength: number;
}
type Props = OwnProps & StateProps;

const TimelineGraphEditorWrapperComponent: React.FC<Props> = (props) => {
	const [{ timelineIds, colors }, setIdsAndColors] = useState<{
		timelineIds: string[];
		colors: { [timelineId: string]: string };
	}>({ timelineIds: [], colors: {} });

	useActionStateEffect((state) => {
		const { compositionState, compositionSelectionState } = state;
		const selection = getCompSelectionFromState(props.compositionId, compositionSelectionState);

		const properties = reduceCompProperties<CompositionProperty[]>(
			props.compositionId,
			compositionState,
			(acc, property) => {
				if (property.timelineId && selection.properties[property.id]) {
					acc.push(property);
				}

				return acc;
			},
			[],
		);

		const shouldUpdate = (() => {
			if (properties.length !== timelineIds.length) {
				return true;
			}

			for (let i = 0; i < properties.length; i += 1) {
				if (properties[i].timelineId !== timelineIds[i]) {
					return true;
				}
			}

			return false;
		})();

		if (!shouldUpdate) {
			return;
		}

		const newTimelineIds: string[] = [];
		const colors: { [timelineId: string]: string } = {};

		for (const property of properties) {
			newTimelineIds.push(property.timelineId);
			colors[property.timelineId] = property.color!;
		}

		setIdsAndColors({ timelineIds: newTimelineIds, colors });
	});

	const viewport = useMemo(() => {
		return {
			...props.viewport,
			height: props.viewport.height - 32,
			top: props.viewport.top + 32,
		};
	}, [props.viewport]);

	if (timelineIds.length < 1) {
		return null;
	}

	return (
		<GraphEditor
			timelineAreaId={props.areaId}
			ids={timelineIds}
			viewport={{
				...viewport,
				height: viewport.height - 32,
				top: viewport.top + 32,
			}}
			colors={colors}
			viewBounds={props.viewBounds}
			length={props.compositionLength}
			dragSelectRect={props.dragSelectRect}
		/>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ compositionState }, ownProps) => {
	const composition = compositionState.compositions[ownProps.compositionId];
	return { compositionLength: composition.length };
};

export const TimelineGraphEditorWrapper = connectActionState(mapStateToProps)(
	TimelineGraphEditorWrapperComponent,
);
