import React from "react";
import { useActionState } from "~/hook/useActionState";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";
import { CompositionLayerProperty } from "~/composition/compositionTypes";
import { Timeline } from "~/timeline/timelineTypes";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";

const styles = ({ css }: StyleParams) => ({
	element: css`
		background: red;
		position: absolute;
	`,
});

const s = compileStylesheetLabelled(styles);

interface Props {
	compositionId: string;
	layerId: string;
}

export const CompositionWorkspaceLayer: React.FC<Props> = (props) => {
	const layer = useActionState((state) => state.compositions.layers[props.layerId]);
	const composition = useActionState(
		(state) => state.compositions.compositions[props.compositionId],
	);
	const allProperties = useActionState((state) => state.compositions.properties);

	const timelines = useActionState(
		(state) => {
			return layer.properties.reduce<{ [timelineId: string]: Timeline }>(
				(obj, propertyId) => {
					const p = allProperties[propertyId];

					if (p.timelineId) {
						obj[p.timelineId] = state.timelines[p.timelineId];
					}

					return obj;
				},
				{},
			);
		},
		{ shallow: true },
	);

	const nameToProperty = layer.properties.reduce<{ [key: string]: number }>((obj, propertyId) => {
		const p = allProperties[propertyId];

		const value = p.timelineId
			? getTimelineValueAtIndex(timelines[p.timelineId], composition.frameIndex)
			: p.value;

		obj[p.name] = value;
		return obj;
	}, {});

	const { width, height, x, y } = nameToProperty;

	return (
		<div
			className={s("element")}
			style={{ width: width, height: height, left: x, top: y }}
		></div>
	);
};
