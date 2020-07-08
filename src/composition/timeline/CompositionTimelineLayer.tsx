import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { CompositionLayer } from "~/composition/compositionTypes";
import styles from "~/composition/timeline/CompositionTimelineLayer.style";
import { CompositionTimelineLayerProperty } from "~/composition/timeline/CompositionTimelineProperty";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compositionTimelineHandlers } from "~/composition/timeline/compositionTimelineHandlers";
import { GraphIcon } from "~/components/icons/GraphIcon";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { computeLayerGraph } from "~/nodeEditor/graph/computeLayerGraph";
import { useComputeHistory } from "~/hook/useComputeHistory";
import { useActionState } from "~/hook/useActionState";
import { ComputeNodeContext } from "~/nodeEditor/graph/computeNode";
import { OpenInAreaIcon } from "~/components/icons/OpenInAreaIcon";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";

const s = compileStylesheetLabelled(styles);

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
	const { layer, graph } = props;

	const getProperties = (state: ActionState) =>
		getLayerCompositionProperties(layer.id, state.compositions);

	const { computePropertyValues } = useComputeHistory((state) => {
		const properties = getProperties(state);
		return { computePropertyValues: computeLayerGraph(properties, graph) };
	});

	const propertyToValue = useActionState((actionState) => {
		const properties = getProperties(actionState);
		const context: ComputeNodeContext = {
			computed: {},
			composition: actionState.compositions.compositions[layer.compositionId],
			layer,
			properties,
			timelines: actionState.timelines,
			timelineSelection: actionState.timelineSelection,
		};

		return computePropertyValues(context);
	});

	return (
		<>
			<div
				className={s("container")}
				onMouseDown={separateLeftRightMouse({
					right: (e) => compositionTimelineHandlers.onLayerRightClick(e, layer.id),
				})}
			>
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
				<div
					title={layer.graphId ? "Delete Layer Graph" : "Create Layer Graph"}
					className={s("graph", { active: !!layer.graphId })}
					onMouseDown={separateLeftRightMouse({
						left: (e) => compositionTimelineHandlers.onLayerGraphMouseDown(e, layer.id),
					})}
				>
					<GraphIcon />
				</div>
				{!!layer.graphId && (
					<div
						title="Open Graph in area"
						className={s("openGraphInArea", { active: true })}
						onMouseDown={separateLeftRightMouse({
							left: (e) =>
								compositionTimelineHandlers.onOpenGraphInAreaMouseDown(e, layer.id),
						})}
					>
						<OpenInAreaIcon />
					</div>
				)}
			</div>
			{layer.properties.map((id) => {
				return (
					<CompositionTimelineLayerProperty
						compositionId={props.compositionId}
						id={id}
						key={id}
						propertyToValue={propertyToValue}
						depth={0}
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
