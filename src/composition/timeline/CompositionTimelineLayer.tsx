import React, { useEffect } from "react";
import { useStylesheet } from "~/util/stylesheets";
import { CompositionLayer, CompositionLayerProperty } from "~/composition/compositionTypes";
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
	properties: CompositionLayerProperty[];
	graph?: NodeEditorGraphState;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompositionTimelineLayerComponent: React.FC<Props> = (props) => {
	const s = useStylesheet(styles);
	const { layer, properties, graph } = props;

	const c = useComputeHistory(() => {
		if (!graph) {
			return null;
		}

		return { fn: computeLayerGraph(layer, properties, graph) };
	});

	// console.log(c);
	const propertyToValue = useActionState((actionState) => {
		if (!graph || !c) {
			return null;
		}

		const context: ComputeNodeContext = {
			computed: {},
			composition: actionState.compositions.compositions[layer.compositionId],
			layer,
			graph,
			properties: layer.properties.map((id) => actionState.compositions.properties[id]),
			timelines: actionState.timelines,
		};

		if (typeof c.fn === "function") {
			return c.fn(context);
		}

		return null;
	});
	// const actionState = useActionState((s) => s);

	// useEffect(() => {
	// 	if (!graph || !c) {
	// 		return;
	// 	}

	// 	const context: ComputeNodeContext = {
	// 		computed: {},
	// 		composition: actionState.compositions.compositions[layer.compositionId],
	// 		layer,
	// 		graph,
	// 		properties: layer.properties.map((id) => actionState.compositions.properties[id]),
	// 		timelines: actionState.timelines,
	// 	};

	// 	if (typeof c.fn === "function") {
	// 		console.log({ result: c.fn(context) });
	// 	}
	// }, [c]);

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
						value={propertyToValue?.[propertyId as any] ?? 0}
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
		properties: layer.properties.map((id) => compositions.properties[id]),
		graph: layer.graphId ? nodeEditor.graphs[layer.graphId] : undefined,
		isSelected: !!compositionSelection.layers[id],
	};
};

export const CompositionTimelineLayer = connectActionState(mapStateToProps)(
	CompositionTimelineLayerComponent,
);
