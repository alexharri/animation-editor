import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { separateLeftRightMouse } from "~/util/mouse";
import { NodeEditorNodeInput } from "~/nodeEditor/nodeEditorIO";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { useNumberInputAction } from "~/hook/useNumberInputAction";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { NodeEditorVec2Input } from "~/nodeEditor/components/NodeEditorVec2Input";

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

const NodeVec2InputComponent: React.FC<Props> = (props) => {
	const { graphId, nodeId, index, input } = props;

	const vec = props.input.value;

	const { onChange: onXChange, onChangeEnd: onXChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			const newVec = Vec2.new(value, vec.y);
			params.dispatch(nodeEditorActions.setNodeInputValue(graphId, nodeId, index, newVec));
		},
		onChangeEnd: (_type, params) => {
			params.submitAction("Update X value");
		},
	});

	const { onChange: onYChange, onChangeEnd: onYChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			const newVec = Vec2.new(vec.x, value);
			params.dispatch(nodeEditorActions.setNodeInputValue(graphId, nodeId, index, newVec));
		},
		onChangeEnd: (_type, params) => {
			params.submitAction("Update Y value");
		},
	});

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
			{!input.pointer && (
				<>
					<NodeEditorVec2Input
						onXChange={onXChange}
						onXChangeEnd={onXChangeEnd}
						onYChange={onYChange}
						onYChangeEnd={onYChangeEnd}
						value={input.value}
						paddingRight
					/>
				</>
			)}
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

export const NodeVec2Input = connectActionState(mapStateToProps)(NodeVec2InputComponent);
