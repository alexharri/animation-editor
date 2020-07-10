import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { CompositionLayer } from "~/composition/compositionTypes";
import styles from "~/composition/timeline/CompTimeLayer.style";
import { CompTimeLayerProperty } from "~/composition/timeline/CompTimeProperty";
import { CompTimeLayerName } from "~/composition/timeline/layer/CompTimeLayerName";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { GraphIcon } from "~/components/icons/GraphIcon";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { computeLayerGraph } from "~/nodeEditor/graph/computeLayerGraph";
import { useComputeHistory } from "~/hook/useComputeHistory";
import { useActionState } from "~/hook/useActionState";
import { ComputeNodeContext } from "~/nodeEditor/graph/computeNode";
import { OpenInAreaIcon } from "~/components/icons/OpenInAreaIcon";

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

const CompTimeLayerComponent: React.FC<Props> = (props) => {
	const { layer, graph } = props;

	const { computePropertyValues } = useComputeHistory(() => {
		return { computePropertyValues: computeLayerGraph(graph) };
	});

	const propertyToValue = useActionState((actionState) => {
		const context: ComputeNodeContext = {
			computed: {},
			compositionId: props.compositionId,
			layerId: props.id,
			compositionState: actionState.compositions,
			timelines: actionState.timelines,
			timelineSelection: actionState.timelineSelection,
		};

		return computePropertyValues(context, graph && actionState.nodeEditor.graphs[graph.id]);
	});

	return (
		<>
			<div
				className={s("container")}
				onMouseDown={separateLeftRightMouse({
					right: (e) => compTimeHandlers.onLayerRightClick(e, layer),
				})}
			>
				<CompTimeLayerName layerId={props.id} />
				<div
					title={layer.graphId ? "Delete Layer Graph" : "Create Layer Graph"}
					className={s("graph", { active: !!layer.graphId })}
					onMouseDown={separateLeftRightMouse({
						left: (e) => compTimeHandlers.onLayerGraphMouseDown(e, layer.id),
					})}
				>
					<GraphIcon />
				</div>
				{!!layer.graphId && (
					<div
						title="Open Graph in area"
						className={s("openGraphInArea", { active: true })}
						onMouseDown={separateLeftRightMouse({
							left: (e) => compTimeHandlers.onOpenGraphInAreaMouseDown(e, layer.id),
						})}
					>
						<OpenInAreaIcon />
					</div>
				)}
			</div>
			{layer.properties.map((id) => {
				return (
					<CompTimeLayerProperty
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

export const CompTimeLayer = connectActionState(mapStateToProps)(CompTimeLayerComponent);
