import React, { useRef } from "react";
import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType, ValueType } from "~/types";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { useComputeHistory } from "~/hook/useComputeHistory";
import { RequestActionParams, requestAction } from "~/listener/requestAction";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { getExpressionUpdateIO } from "~/nodeEditor/nodes/expression/expressionUtils";

interface OwnProps {
	className: string;
	graphId: string;
	nodeId: string;
}
interface StateProps {
	textareaHeight: number;
}
type Props = OwnProps & StateProps;

const ExpressionNodeTextareaComponent: React.FC<Props> = (props) => {
	const { nodeId, graphId } = props;

	const expression = useComputeHistory((state) => {
		const node = state.nodeEditor.graphs[props.graphId].nodes[props.nodeId] as NodeEditorNode<
			NodeEditorNodeType.expr
		>;

		return node.state.expression;
	});

	const paramsRef = useRef<RequestActionParams | null>(null);

	const onFocus = () => {
		const getExpr = (state: ActionState) => {
			const node = state.nodeEditor.graphs[graphId].nodes[nodeId] as NodeEditorNode<
				NodeEditorNodeType.expr
			>;
			return node.state.expression;
		};

		const didChange = (prevState: ActionState, nextState: ActionState): boolean => {
			const exprA = getExpr(prevState);
			const exprB = getExpr(nextState);
			return exprA !== exprB;
		};

		requestAction({ history: true, shouldAddToStack: didChange }, (params) => {
			paramsRef.current = params;
		});
	};

	const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
		const params = paramsRef.current!;
		paramsRef.current = null;

		const expression = e.target.value;
		params.dispatch(
			nodeEditorActions.updateNodeState<NodeEditorNodeType.expr>(graphId, nodeId, {
				expression,
			}),
		);

		const graph = getActionState().nodeEditor.graphs[graphId];

		const toUpdate = getExpressionUpdateIO(expression, graph, nodeId);

		const toDispatch: any[] = [
			nodeEditorActions.removeNodeInputs(graphId, nodeId, toUpdate.inputIndicesToRemove),
			nodeEditorActions.removeNodeOutputs(graphId, nodeId, toUpdate.outputIndicesToRemove),
		];

		toUpdate.inputsToAdd.forEach((input) => {
			toDispatch.push(
				nodeEditorActions.addNodeInput(graphId, nodeId, {
					name: input,
					pointer: null,
					type: ValueType.Any,
					value: 0,
				}),
			);
		});
		toUpdate.outputsToAdd.forEach((output) => {
			toDispatch.push(
				nodeEditorActions.addNodeOutput(graphId, nodeId, {
					name: output,
					type: ValueType.Any,
				}),
			);
		});

		params.dispatch(toDispatch);
		params.submitAction("Modify expression");
	};

	return (
		<textarea
			key={expression}
			defaultValue={expression}
			className={props.className}
			onMouseDown={(e) => e.stopPropagation()}
			onBlur={onBlur}
			onFocus={onFocus}
			style={{ height: props.textareaHeight }}
		/>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor },
	{ graphId, nodeId },
) => {
	const graph = nodeEditor.graphs[graphId];
	const node = graph.nodes[nodeId] as NodeEditorNode<NodeEditorNodeType.expr>;
	return {
		textareaHeight: node.state.textareaHeight,
	};
};

export const ExpressionNodeTextarea = connectActionState(mapStateToProps)(
	ExpressionNodeTextareaComponent,
);
