import React from "react";
import { CompoundProperty, Property, PropertyGroup } from "~/composition/compositionTypes";
import {
	getLayerCompoundPropertyLabel,
	getLayerPropertyLabel,
} from "~/composition/util/compositionPropertyUtils";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeInput, FlowNodeOutput, FlowNodeProps, FlowNodeType } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { PropertyNodeSelectProperty } from "~/flow/nodes/property/PropertyNodeSelectProperty";
import { flowActions } from "~/flow/state/flowActions";
import { useMemoActionState } from "~/hook/useActionState";
import { requestAction } from "~/listener/requestAction";
import { getPropertyValueType } from "~/property/propertyConstants";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { PropertyGroupName, ValueType } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = FlowNodeProps;
interface StateProps {
	graphLayerId: string;
	graphPropertyId: string;

	graphLayerPropertyIds?: string[];

	inputs: FlowNodeInput[];
	outputs: FlowNodeOutput[];
	state: FlowNodeState<FlowNodeType.property_output>;
}

type Props = OwnProps & StateProps;

function PropertyOutputNodeComponent(props: Props) {
	const { inputs } = props;

	const onSelectProperty = (propertyId: string) => {
		requestAction({ history: true }, (params) => {
			params.dispatch(
				flowActions.updateNodeState<FlowNodeType.property_output>(
					props.graphId,
					props.nodeId,
					{ propertyId },
				),
			);

			const properties = getActionState().compositionState.properties;
			const property = properties[propertyId];

			let inputs: FlowNodeInput[];

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

			inputs = propertyIds
				.filter((id) => properties[id].type !== "group")
				.map<FlowNodeInput>((id) => {
					const property = properties[id] as Property | CompoundProperty;

					if (property.type === "compound") {
						return {
							name: getLayerCompoundPropertyLabel(property.name),
							type: ValueType.Vec2,
							pointer: null,
							value: null,
						};
					}

					return {
						name: getLayerPropertyLabel(property.name),
						type: getPropertyValueType(property.name),
						pointer: null,
						value: null,
					};
				});

			params.dispatch(
				flowActions.updateNodeState<FlowNodeType.property_output>(
					props.graphId,
					props.nodeId,
					{ propertyId },
				),
				flowActions.setNodeInputs(props.graphId, props.nodeId, inputs),
			);
			params.submitAction("Update selected PropertyOutputNode property");
		});
	};

	const selectFromPropertyIds = useMemoActionState(
		({ compositionState }) => {
			if (props.graphPropertyId) {
				const group = compositionState.properties[props.graphPropertyId] as PropertyGroup;
				const names = group.properties.map(
					(propertyId) => compositionState.properties[propertyId].name,
				);
				const index = names.indexOf(PropertyGroupName.Transform);
				const transformGroupPropertyId = group.properties[index];

				return [transformGroupPropertyId];
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
		<>
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
		</>
	);
}

const mapState: MapActionState<StateProps, OwnProps> = (
	{ flowState, compositionState },
	{ graphId, nodeId },
) => {
	const graph = flowState.graphs[graphId];
	const node = flowState.nodes[nodeId];
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
