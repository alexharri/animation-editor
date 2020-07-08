import React from "react";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import {
	NodeEditorNodeState,
	NodeEditorNodeInput,
	NodeEditorNodeOutput,
} from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { PropertyNodeSelectProperty } from "~/nodeEditor/nodes/property/PropertyNodeSelectProperty";
import { requestAction } from "~/listener/requestAction";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { CompositionProperty } from "~/composition/compositionTypes";
import { getLayerPropertyLabel } from "~/composition/util/compositionPropertyUtils";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
}
interface StateProps {
	layerId: string;
	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
	state: NodeEditorNodeState<NodeEditorNodeType.property_input>;
}

type Props = OwnProps & StateProps;

function PropertyInputNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, outputs } = props;

	const onSelectProperty = (propertyId: string) => {
		requestAction({ history: true }, (params) => {
			params.dispatch(
				nodeEditorActions.updateNodeState<NodeEditorNodeType.property_input>(
					props.graphId,
					props.nodeId,
					{ propertyId },
				),
			);

			const properties = getActionState().compositions.properties;
			let propertyIds: string[];

			const property = properties[propertyId];
			if (property.type === "group") {
				propertyIds = property.properties;
			} else {
				propertyIds = [property.id];
			}

			const outputs = propertyIds
				.filter((id) => properties[id].type === "property")
				.map<NodeEditorNodeOutput>((id) => {
					const property = properties[id] as CompositionProperty;
					return {
						name: getLayerPropertyLabel(property.name),
						type: property.valueType,
					};
				});

			params.dispatch(
				nodeEditorActions.updateNodeState<NodeEditorNodeType.property_input>(
					props.graphId,
					props.nodeId,
					{ propertyId },
				),
				nodeEditorActions.removeReferencesToNodeInGraph(props.graphId, props.nodeId),
				nodeEditorActions.setNodeOutputs(props.graphId, props.nodeId, outputs),
			);
			params.submitAction("Update selected PropertyInputNode property");
		});
	};

	return (
		<NodeBody areaId={areaId} graphId={graphId} nodeId={nodeId}>
			<PropertyNodeSelectProperty
				layerId={props.layerId}
				onSelectProperty={onSelectProperty}
				selectedPropertyId={props.state.propertyId}
			/>
			{outputs.map((output, i) => {
				return (
					<div className={s("output", { last: i === outputs.length - 1 })} key={i}>
						<div
							className={s("output__circle")}
							onMouseDown={(e) =>
								nodeHandlers.onOutputMouseDown(
									e,
									props.areaId,
									props.graphId,
									props.nodeId,
									i,
								)
							}
						/>
						<div className={s("output__name")}>{output.name}</div>
					</div>
				);
			})}
		</NodeBody>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor },
	{ graphId, nodeId },
) => {
	const graph = nodeEditor.graphs[graphId];
	const node = graph.nodes[nodeId];
	return {
		layerId: graph.layerId,
		inputs: node.inputs,
		outputs: node.outputs,
		state: node.state as StateProps["state"],
	};
};

export const PropertyInputNode = connectActionState(mapStateToProps)(PropertyInputNodeComponent);
