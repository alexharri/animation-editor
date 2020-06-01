import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { separateLeftRightMouse } from "~/util/mouse";
import { NodeEditorNodeInput } from "~/nodeEditor/nodeEditorIO";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	index: number;
}
interface StateProps {
	input: NodeEditorNodeInput;
}
type Props = OwnProps & StateProps;

const NodeInputComponent: React.FC<Props> = (props) => {
	const { index, input } = props;

	return (
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
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor },
	{ graphId, nodeId, index },
) => {
	const graph = nodeEditor.graphs[graphId];
	const node = graph.nodes[nodeId];
	return {
		input: node.inputs[index],
	};
};

export const NodeInput = connectActionState(mapStateToProps)(NodeInputComponent);
