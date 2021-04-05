import React from "react";
import { CompoundProperty, Layer, Property } from "~/composition/compositionTypes";
import {
	getLayerCompoundPropertyLabel,
	getLayerPropertyLabel,
} from "~/composition/util/compositionPropertyUtils";
import { FlowNodeBody } from "~/flow/components/FlowNodeBody";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeInput, FlowNodeOutput, FlowNodeProps, FlowNodeType } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { PropertyNodeSelectProperty } from "~/flow/nodes/property/PropertyNodeSelectProperty";
import { flowActions } from "~/flow/state/flowActions";
import { requestAction } from "~/listener/requestAction";
import { getPropertyValueType } from "~/property/propertyConstants";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { ValueType } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = FlowNodeProps;
interface StateProps {
	graphLayerId: string;
	graphPropertyId: string;

	compositionLayerIds: string[];
	layerPropertyIds?: string[];

	inputs: FlowNodeInput[];
	outputs: FlowNodeOutput[];
	state: FlowNodeState<FlowNodeType.property_input>;
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
				flowActions.removeReferencesToNodeInGraph(props.graphId, props.nodeId),
				flowActions.updateNodeState<FlowNodeType.property_input>(
					props.graphId,
					props.nodeId,
					{ layerId, propertyId: "" },
				),
				flowActions.setNodeOutputs(props.graphId, props.nodeId, []),
			);

			params.submitAction("Update selected PropertyInputNode property");
		});
	};

	const onSelectProperty = (propertyId: string) => {
		requestAction({ history: true }, (params) => {
			params.dispatch(
				flowActions.updateNodeState<FlowNodeType.property_input>(
					props.graphId,
					props.nodeId,
					{ propertyId },
				),
			);

			const properties = getActionState().compositionState.properties;
			const property = properties[propertyId];

			let outputs: FlowNodeOutput[];
			let propertyIds: string[];

			switch (property.type) {
				case "group": {
					propertyIds = property.properties;
					break;
				}
				case "compound": {
					propertyIds = [property.id, ...property.properties];
					break;
				}
				case "property": {
					propertyIds = [property.id];
					break;
				}
			}

			outputs = propertyIds
				.filter((id) => properties[id].type !== "group")
				.map<FlowNodeOutput>((id) => {
					const property = properties[id] as Property | CompoundProperty;

					if (property.type === "compound") {
						return {
							name: getLayerCompoundPropertyLabel(property.name),
							type: ValueType.Vec2,
						};
					}

					return {
						name: getLayerPropertyLabel(property.name),
						type: getPropertyValueType(property.name),
					};
				});

			params.dispatch(
				flowActions.updateNodeState<FlowNodeType.property_input>(
					props.graphId,
					props.nodeId,
					{ propertyId },
				),
				flowActions.removeReferencesToNodeInGraph(props.graphId, props.nodeId),
				flowActions.setNodeOutputs(props.graphId, props.nodeId, outputs),
			);
			params.submitAction("Update selected PropertyInputNode property");
		});
	};

	return (
		<FlowNodeBody areaId={areaId} graphId={graphId} nodeId={nodeId} zIndex={zIndex}>
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
		</FlowNodeBody>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositionState, flowState },
	{ graphId, nodeId },
) => {
	const graph = flowState.graphs[graphId];
	const node = flowState.nodes[nodeId];
	const state = node.state as StateProps["state"];

	let layer: Layer;

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
