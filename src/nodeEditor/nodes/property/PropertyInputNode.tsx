import React from "react";
import { CompositionLayer, CompositionProperty } from "~/composition/compositionTypes";
import { getLayerPropertyLabel } from "~/composition/util/compositionPropertyUtils";
import { requestAction } from "~/listener/requestAction";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import {
	NodeEditorNodeInput,
	NodeEditorNodeOutput,
	NodeEditorNodeState,
} from "~/nodeEditor/nodeEditorIO";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { NodeProps } from "~/nodeEditor/nodes/nodeEditorTypes";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { PropertyNodeSelectProperty } from "~/nodeEditor/nodes/property/PropertyNodeSelectProperty";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { NodeEditorNodeType } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = NodeProps;
interface StateProps {
	graphLayerId: string;
	graphPropertyId: string;

	compositionLayerIds: string[];
	layerPropertyIds?: string[];

	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
	state: NodeEditorNodeState<NodeEditorNodeType.property_input>;
}

type Props = OwnProps & StateProps;

function PropertyInputNodeComponent(props: Props) {
	const {
		areaId,
		graphId,
		nodeId,
		outputs,
		compositionLayerIds,
		layerPropertyIds,
		zIndex,
	} = props;

	const onSelectLayer = (layerId: string) => {
		requestAction({ history: true }, (params) => {
			params.dispatch(
				nodeEditorActions.removeReferencesToNodeInGraph(props.graphId, props.nodeId),
				nodeEditorActions.updateNodeState<NodeEditorNodeType.property_input>(
					props.graphId,
					props.nodeId,
					{ layerId, propertyId: "" },
				),
				nodeEditorActions.setNodeOutputs(props.graphId, props.nodeId, []),
			);

			params.submitAction("Update selected PropertyInputNode property");
		});
	};

	const onSelectProperty = (propertyId: string) => {
		requestAction({ history: true }, (params) => {
			params.dispatch(
				nodeEditorActions.updateNodeState<NodeEditorNodeType.property_input>(
					props.graphId,
					props.nodeId,
					{ propertyId },
				),
			);

			const properties = getActionState().compositionState.properties;
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
		<NodeBody areaId={areaId} graphId={graphId} nodeId={nodeId} zIndex={zIndex}>
			<PropertyNodeSelectProperty
				selectFromLayerIds={compositionLayerIds}
				selectFromPropertyIds={layerPropertyIds}
				onSelectProperty={onSelectProperty}
				onSelectLayer={onSelectLayer}
				selectedPropertyId={props.state.propertyId}
				selectedLayerId={props.state.layerId}
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
	{ compositionState, nodeEditor },
	{ graphId, nodeId },
) => {
	const graph = nodeEditor.graphs[graphId];
	const node = graph.nodes[nodeId];
	const state = node.state as StateProps["state"];

	let layer: CompositionLayer;

	if (graph.type === "layer_graph") {
		layer = compositionState.layers[graph.layerId];
	} else {
		const property = compositionState.properties[graph.propertyId];
		layer = compositionState.layers[property.layerId];
	}

	const composition = compositionState.compositions[layer.compositionId];

	const compositionLayerIds = composition.layers;
	const layerPropertyIds = state.layerId
		? compositionState.layers[state.layerId].properties
		: undefined;

	return {
		graphLayerId: graph.layerId,
		graphPropertyId: graph.propertyId,

		compositionLayerIds,
		layerPropertyIds,

		inputs: node.inputs,
		outputs: node.outputs,
		state,
	};
};

export const PropertyInputNode = connectActionState(mapStateToProps)(PropertyInputNodeComponent);
