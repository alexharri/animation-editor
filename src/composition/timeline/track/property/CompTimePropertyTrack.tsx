import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { connectActionState } from "~/state/stateUtils";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import CompTimePropertyTrackStyles from "~/composition/timeline/track/property/CompTimePropertyTrack.styles";
import { Timeline } from "~/timeline/timelineTypes";
import { TRACK_KEYFRAME_HEIGHT as W } from "~/constants";
import { cssVariables } from "~/cssVariables";

const d = `
    M ${W / 2},0
    L ${W},${W / 2}
    L ${W / 2},${W}
    L 0,${W / 2}
    L ${W / 2},0
`;

const KeyframeIcon: React.FC<{ selected: boolean }> = ({ selected }) => (
	<svg
		width={W}
		height={W}
		viewBox={`0 0 ${W} ${W}`}
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d={d} fill={cssVariables.light500} />
		<g style={{ transform: "scale(0.6)", transformOrigin: "50% 50%" }}>
			<path d={d} fill={cssVariables.gray800} />
		</g>
	</svg>
);

const s = compileStylesheetLabelled(CompTimePropertyTrackStyles);

interface OwnProps {
	propertyId: string;
	startIndex: number;
	compositionLength: number;
	toTimelineX: (value: number) => number;
}
interface StateProps {
	property: CompositionProperty | CompositionPropertyGroup;
	timeline?: Timeline;
}
type Props = OwnProps & StateProps;

const CompTimePropertyTrackComponent: React.FC<Props> = (props) => {
	const { startIndex, compositionLength, property } = props;

	const x0 = props.toTimelineX(startIndex);
	const x1 = props.toTimelineX(startIndex + compositionLength);

	const left = x0;
	const width = x1 - x0;

	if (property.type === "group") {
		const { properties } = property;

		return (
			<>
				<div className={s("wrapper")} style={{ left, width }} />
				{!property.collapsed &&
					properties.map((id) => (
						<CompTimePropertyTrack
							propertyId={id}
							key={id}
							startIndex={props.startIndex}
							compositionLength={props.compositionLength}
							toTimelineX={props.toTimelineX}
						/>
					))}
			</>
		);
	}

	const { timeline } = props;

	return (
		<div style={{ position: "relative" }}>
			<div className={s("wrapper")} style={{ left, width }} />
			{timeline &&
				timeline.keyframes.map((k) => {
					const left = Math.floor(props.toTimelineX(k.index + startIndex));
					return (
						<div
							key={k.id}
							className={s("keyframe")}
							style={{ transform: `translateX(${left - W / 2}px)` }}
						>
							<KeyframeIcon />
						</div>
					);
				})}
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositions, timelines },
	{ propertyId },
) => {
	const property = compositions.properties[propertyId];

	const timeline =
		property.type === "property" && property.timelineId
			? timelines[property.timelineId]
			: undefined;

	return {
		property,
		timeline,
	};
};

export const CompTimePropertyTrack = connectActionState(mapStateToProps)(
	CompTimePropertyTrackComponent,
);
