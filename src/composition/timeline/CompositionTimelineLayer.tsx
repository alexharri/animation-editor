import React from "react";
import { useStylesheet } from "~/util/stylesheets";
import { CompositionLayer } from "~/composition/compositionTypes";
import styles from "~/composition/timeline/CompositionTimelineLayer.style";
import { CompositionTimelineLayerProperty } from "~/composition/timeline/CompositionTimelineLayerProperty";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compositionTimelineHandlers } from "~/composition/timeline/compositionTimelineHandlers";
import { GraphIcon } from "~/components/icons/GraphIcon";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { computeLayerGraph } from "~/nodeEditor/graph/computeLayerGraph";
import { useComputeHistory } from "~/hook/useComputeHistory";
import { useActionState } from "~/hook/useActionState";
import { ComputeNodeContext } from "~/nodeEditor/graph/computeNode";

interface OwnProps {
	id: string;
	compositionId: string;
}
interface StateProps {
	layer: CompositionLayer;
	graph?: NodeEditorGraphState;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompositionTimelineLayerComponent: React.FC<Props> = (props) => {
	const s = useStylesheet(styles);
	const { layer, graph } = props;

	const properties = useComputeHistory((state) =>
		layer.properties.map((id) => state.compositions.properties[id]),
	);

	const { computePropertyValues } = useComputeHistory(() => {
		return { computePropertyValues: computeLayerGraph(properties, graph) };
	});

	const propertyToValue = useActionState((actionState) => {
		const context: ComputeNodeContext = {
			computed: {},
			composition: actionState.compositions.compositions[layer.compositionId],
			layer,
			properties: layer.properties.map((id) => actionState.compositions.properties[id]),
			timelines: actionState.timelines,
			timelineSelection: actionState.timelineSelection,
		};

		return computePropertyValues(context);
	});

	return (
		<>
			<div className={s("container")}>
				<div
					className={s("name", { active: props.isSelected })}
					onMouseDown={separateLeftRightMouse({
						left: (e) =>
							compositionTimelineHandlers.onLayerNameMouseDown(
								e,
								props.compositionId,
								layer.id,
							),
					})}
				>
					{layer.name}
				</div>
				<div className={s("graph")}>
					<GraphIcon />
				</div>
			</div>
			{layer.properties.map((propertyId, i) => {
				return (
					<CompositionTimelineLayerProperty
						compositionId={props.compositionId}
						id={propertyId}
						value={propertyToValue[propertyId as any]}
						key={i}
					/>
				);
			})}
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor, compositions, compositionSelection },
	{ id },
) => {
	const layer = compositions.layers[id];
	return {
		layer,
		graph: layer.graphId ? nodeEditor.graphs[layer.graphId] : undefined,
		isSelected: !!compositionSelection.layers[id],
	};
};

export const CompositionTimelineLayer = connectActionState(mapStateToProps)(
	CompositionTimelineLayerComponent,
);
