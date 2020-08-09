import React from "react";
import { CompositionProperty } from "~/composition/compositionTypes";
import { getLayerPropertyLabel } from "~/composition/util/compositionPropertyUtils";
import { useMemoActionState } from "~/hook/useActionState";
import { requestAction } from "~/listener/requestAction";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import {
	NodeEditorNodeInput,
	NodeEditorNodeOutput,
	NodeEditorNodeState,
} from "~/nodeEditor/nodeEditorIO";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { PropertyNodeSelectProperty } from "~/nodeEditor/nodes/property/PropertyNodeSelectProperty";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { NodeEditorNodeType } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
}
interface StateProps {
	graphLayerId: string;
	graphPropertyId: string;

	graphLayerPropertyIds?: string[];

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

			const properties = getActionState().compositionState.properties;
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

	const selectFromPropertyIds = useMemoActionState(
		({ compositionState }) => {
			if (props.graphPropertyId) {
				return [props.graphPropertyId];
			}

			const layer = compositionState.layers[props.graphLayerId];
			return layer.properties;
		},
		[props.graphLayerPropertyIds],
	);

	const select = props.graphLayerId ? (
		<PropertyNodeSelectProperty
			selectFromPropertyIds={selectFromPropertyIds}
			onSelectProperty={onSelectProperty}
			selectedPropertyId={props.state.propertyId}
		/>
	) : (
		<PropertyNodeSelectProperty
			selectFromPropertyIds={selectFromPropertyIds}
			onSelectProperty={onSelectProperty}
			selectedPropertyId={props.state.propertyId}
		/>
	);

	return (
		<NodeBody areaId={areaId} graphId={graphId} nodeId={nodeId}>
			{select}
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

const mapState: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor, compositionState },
	{ graphId, nodeId },
) => {
	const graph = nodeEditor.graphs[graphId];
	const node = graph.nodes[nodeId];
	const state = node.state as StateProps["state"];

	const graphLayerPropertyIds = graph.layerId
		? compositionState.layers[graph.layerId].properties
		: undefined;

	return {
		graphLayerId: graph.layerId,
		graphPropertyId: graph.propertyId,

		graphLayerPropertyIds,

		inputs: node.inputs,
		outputs: node.outputs,
		state,
	};
};

export const PropertyOutputNode = connectActionState(mapState)(PropertyOutputNodeComponent);
