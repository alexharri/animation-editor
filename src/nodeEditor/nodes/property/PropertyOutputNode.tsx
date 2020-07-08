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
import { separateLeftRightMouse } from "~/util/mouse";

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
	state: NodeEditorNodeState<NodeEditorNodeType.property_output>;
}

type Props = OwnProps & StateProps;

function PropertyOutputNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, inputs } = props;

	const onSelectProperty = (propertyId: string) => {
		requestAction({ history: true }, (params) => {
			params.dispatch(
				nodeEditorActions.updateNodeState<NodeEditorNodeType.property_output>(
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

			const inputs = propertyIds
				.filter((id) => properties[id].type === "property")
				.map<NodeEditorNodeInput>((id) => {
					const property = properties[id] as CompositionProperty;
					return {
						name: getLayerPropertyLabel(property.name),
						type: property.valueType,
						pointer: null,
						value: null,
					};
				});

			params.dispatch(
				nodeEditorActions.updateNodeState<NodeEditorNodeType.property_output>(
					props.graphId,
					props.nodeId,
					{ propertyId },
				),
				nodeEditorActions.setNodeInputs(props.graphId, props.nodeId, inputs),
			);
			params.submitAction("Update selected PropertyOutputNode property");
		});
	};

	return (
		<NodeBody areaId={areaId} graphId={graphId} nodeId={nodeId}>
			<PropertyNodeSelectProperty
				layerId={props.layerId}
				onSelectProperty={onSelectProperty}
				selectedPropertyId={props.state.propertyId}
			/>
			{inputs.map((input, i) => {
				return (
					<div className={s("input")} key={i}>
						<div
							className={s("input__circle")}
							onMouseDown={separateLeftRightMouse({
								left: input.pointer
									? (e) =>
											nodeHandlers.onInputWithPointerMouseDown(
												e,
												props.areaId,
												props.graphId,
												props.nodeId,
												i,
											)
									: (e) =>
											nodeHandlers.onInputMouseDown(
												e,
												props.areaId,
												props.graphId,
												props.nodeId,
												i,
											),
							})}
						/>
						<div className={s("input__name")}>{input.name}</div>
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

export const PropertyOutputNode = connectActionState(mapStateToProps)(PropertyOutputNodeComponent);
