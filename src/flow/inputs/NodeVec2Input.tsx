import React from "react";
import { FlowNodeVec2Input } from "~/flow/components/FlowNodeVec2Input";
import { flowActions } from "~/flow/flowActions";
import { FlowNodeInput } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { useNumberInputAction } from "~/hook/useNumberInputAction";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	index: number;
}
interface StateProps {
	input: FlowNodeInput;
}
type Props = OwnProps & StateProps;

const NodeVec2InputComponent: React.FC<Props> = (props) => {
	const { graphId, nodeId, index, input } = props;

	const vec = props.input.value;

	const { onChange: onXChange, onChangeEnd: onXChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			const newVec = Vec2.new(value, vec.y);
			params.dispatch(flowActions.setNodeInputValue(graphId, nodeId, index, newVec));
		},
		onChangeEnd: (_type, params) => {
			params.submitAction("Update X value");
		},
	});

	const { onChange: onYChange, onChangeEnd: onYChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			const newVec = Vec2.new(vec.x, value);
			params.dispatch(flowActions.setNodeInputValue(graphId, nodeId, index, newVec));
		},
		onChangeEnd: (_type, params) => {
			params.submitAction("Update Y value");
		},
	});

	return (
		<>
			<div className={s("input")}>
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
										index,
									)
							: (e) =>
									nodeHandlers.onInputMouseDown(
										e,
										props.areaId,
										props.graphId,
										props.nodeId,
										index,
									),
					})}
				/>
				<div className={s("input__name")}>{input.name}</div>
			</div>
			{!input.pointer && (
				<>
					<FlowNodeVec2Input
						onXChange={onXChange}
						onXChangeEnd={onXChangeEnd}
						onYChange={onYChange}
						onYChangeEnd={onYChangeEnd}
						value={input.value}
						paddingRight
					/>
				</>
			)}
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ flowState },
	{ graphId, nodeId, index },
) => {
	const graph = flowState.graphs[graphId];
	const node = graph.nodes[nodeId];
	return {
		input: node.inputs[index],
	};
};

export const NodeVec2Input = connectActionState(mapStateToProps)(NodeVec2InputComponent);
