import React from "react";
import { FLOW_NODE_H_PADDING_ADDITIONAL, FLOW_NODE_H_PADDING_BASE } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { FlowNode } from "~/flow/flowTypes";
import { NodeOutputCircle } from "~/flow/nodes/NodeOutputCircle";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	output: css`
		height: 20px;
		line-height: 20px;
		padding-right: ${FLOW_NODE_H_PADDING_BASE + FLOW_NODE_H_PADDING_ADDITIONAL}px;
		width: 100%;
		position: relative;
		z-index: 10;

		&--last {
			margin-bottom: 8px;
		}
	`,

	output__name: css`
		font-family: ${cssVariables.fontFamily};
		white-space: nowrap;
		color: ${cssVariables.white500};
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: right;
	`,
}));

interface OwnProps {
	nodeId: string;
}
interface StateProps {
	node: FlowNode;
}
type Props = OwnProps & StateProps;

export const NodeOutputsComponent: React.FC<Props> = (props) => {
	const { nodeId, node } = props;

	return (
		<>
			{node.outputs.map((output, i) => (
				<div className={s("output", { last: i === node.outputs.length - 1 })} key={i}>
					<NodeOutputCircle nodeId={nodeId} index={i} valueType={output.type} />
					<div className={s("output__name")}>{output.name}</div>
				</div>
			))}
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (state, ownProps) => {
	return { node: state.flowState.nodes[ownProps.nodeId] };
};

export const NodeOutputs = connectActionState(mapState)(NodeOutputsComponent);
