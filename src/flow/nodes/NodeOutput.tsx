import React from "react";
import { FLOW_NODE_H_PADDING_ADDITIONAL, FLOW_NODE_H_PADDING_BASE } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { FlowNodeOutput } from "~/flow/flowTypes";
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

		&--noPadding {
			padding-right: 0;
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
	index: number;
}
interface StateProps {
	last: boolean;
	output: FlowNodeOutput;
}
type Props = OwnProps & StateProps;

export const NodeOutputComponent: React.FC<Props> = (props) => {
	const { nodeId, index, last, output } = props;

	return (
		<div className={s("output", { last })}>
			<NodeOutputCircle nodeId={nodeId} index={index} valueType={output.type} />
			<div className={s("output__name")}>{output.name}</div>
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (state, ownProps) => {
	const node = state.flowState.nodes[ownProps.nodeId];
	return {
		last: ownProps.index === node.outputs.length - 1,
		output: node.outputs[ownProps.index],
	};
};

export const NodeOutput = connectActionState(mapState)(NodeOutputComponent);
