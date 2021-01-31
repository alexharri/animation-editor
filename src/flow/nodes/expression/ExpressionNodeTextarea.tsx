import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
	EXPR_TEXTAREA_H_PADDING,
	EXPR_TEXTAREA_LINE_HEIGHT,
	EXPR_TEXTAREA_MIN_HEIGHT,
	EXPR_TEXTAREA_MIN_WIDTH,
	EXPR_TEXTAREA_V_PADDING,
	FLOW_NODE_H_PADDING_BASE,
} from "~/constants";
import { cssVariables } from "~/cssVariables";
import { FlowNode, FlowNodeType } from "~/flow/flowTypes";
import { getExpressionUpdateIO } from "~/flow/nodes/expression/expressionUtils";
import { flowActions } from "~/flow/state/flowActions";
import { useComputeHistory } from "~/hook/useComputeHistory";
import { isKeyCodeOf } from "~/listener/keyboard";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { ValueType } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	wrapper: css`
		position: relative;
	`,

	textarea: css`
		border: 1px solid ${cssVariables.gray700};
		border-radius: 2px;
		background: ${cssVariables.dark500};
		width: calc(100% - 16px);
		max-width: calc(100% - ${FLOW_NODE_H_PADDING_BASE * 2}px);
		margin: 0 ${FLOW_NODE_H_PADDING_BASE}px 8px;
		color: ${cssVariables.white500};
		font-size: 13px;
		font-family: ${cssVariables.fontMonospace};
		line-height: ${EXPR_TEXTAREA_LINE_HEIGHT}px;
		resize: none;
		outline: none;
		padding: ${EXPR_TEXTAREA_V_PADDING}px ${EXPR_TEXTAREA_H_PADDING}px;
		overflow: hidden;

		&:focus {
			border-color: ${cssVariables.primary500};
		}
	`,

	measureWrapper: css`
		position: absolute;
		display: flex;
		flex-direction: column;
		z-index: -1;
		opacity: 0;
	`,

	measure: css`
		line-height: 12px;
		font-size: 13px;
		font-family: ${cssVariables.fontMonospace};
		white-space: nowrap;
		margin: 0;
		color: white;
	`,
}));

interface OwnProps {
	graphId: string;
	nodeId: string;
	nodeWidth: number;
}
interface StateProps {
	textareaHeight: number;
}
type Props = OwnProps & StateProps;

const ExpressionNodeTextareaComponent: React.FC<Props> = (props) => {
	const { nodeId, graphId } = props;

	const expression = useComputeHistory((state) => {
		const node = state.flowState.nodes[props.nodeId] as FlowNode<FlowNodeType.expr>;

		return node.state.expression;
	});

	const paramsRef = useRef<RequestActionParams | null>(null);

	const onFocus = () => {
		const getExpr = (state: ActionState) => {
			const node = state.flowState.nodes[nodeId] as FlowNode<FlowNodeType.expr>;
			return node.state.expression;
		};

		const didChange = (prevState: ActionState, nextState: ActionState): boolean => {
			const exprA = getExpr(prevState);
			const exprB = getExpr(nextState);
			return exprA !== exprB;
		};

		requestAction({ history: true, shouldAddToStack: didChange }, (params) => {
			paramsRef.current = params;
			params.execOnComplete(() => {
				(document.activeElement as HTMLTextAreaElement)?.blur();
			});
		});
	};

	const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
		const params = paramsRef.current;
		paramsRef.current = null;

		if (!params || params.done()) {
			return;
		}

		const expression = e.target.value;
		params.dispatch(
			flowActions.updateNodeState<FlowNodeType.expr>(graphId, nodeId, {
				expression,
			}),
		);

		const { flowState } = getActionState();

		const toUpdate = getExpressionUpdateIO(expression, flowState, nodeId);

		const toDispatch: any[] = [
			flowActions.removeNodeInputs(graphId, nodeId, toUpdate.inputIndicesToRemove),
			flowActions.removeNodeOutputs(graphId, nodeId, toUpdate.outputIndicesToRemove),
		];

		toUpdate.inputsToAdd.forEach((input) => {
			toDispatch.push(
				flowActions.addNodeInput(graphId, nodeId, {
					name: input,
					pointer: null,
					type: ValueType.Any,
					value: 0,
				}),
			);
		});
		toUpdate.outputsToAdd.forEach((output) => {
			toDispatch.push(
				flowActions.addNodeOutput(graphId, nodeId, {
					name: output,
					type: ValueType.Any,
				}),
			);
		});

		params.dispatch(toDispatch);
		params.addDiff((diff) => diff.flowNodeExpression(nodeId));
		params.submitAction("Modify expression");
	};

	const measureWrapperRef = useRef<HTMLDivElement>(null);

	const [value, setValue] = useState(expression);
	useLayoutEffect(() => {
		const el = measureWrapperRef.current;
		const params = paramsRef.current;

		if (!el || !params) {
			return;
		}

		let w = el.offsetWidth + FLOW_NODE_H_PADDING_BASE * 2 + EXPR_TEXTAREA_H_PADDING * 2;
		let h = value.split("\n").length * EXPR_TEXTAREA_LINE_HEIGHT + EXPR_TEXTAREA_V_PADDING * 2;

		w = Math.max(EXPR_TEXTAREA_MIN_WIDTH, w);
		h = Math.max(EXPR_TEXTAREA_MIN_HEIGHT, h);

		params.dispatch(
			flowActions.setExpressionNodeTextareaHeight(graphId, nodeId, h + 8),
			flowActions.setNodeWidth(graphId, nodeId, w + 16),
		);
	}, [value]);

	useEffect(() => {
		setValue(expression);
	}, [expression]);

	return (
		<div className={s("wrapper")}>
			<div className={s("measureWrapper")} ref={measureWrapperRef}>
				{value.split("\n").map((str, i) => (
					<pre key={i} className={s("measure")}>
						{str.replace(/ /g, "\xa0")}
					</pre>
				))}
			</div>
			<textarea
				key={expression}
				defaultValue={expression}
				onChange={(e) => setValue(e.target.value)}
				className={s("textarea")}
				onMouseDown={separateLeftRightMouse({
					left: (e) => e.stopPropagation(),
				})}
				onBlur={onBlur}
				onFocus={onFocus}
				style={{ height: props.textareaHeight }}
				onKeyDown={(e) => {
					if (isKeyCodeOf("Esc", e.keyCode)) {
						paramsRef.current?.cancelAction();
						paramsRef.current = null;

						e.preventDefault();
						const textarea = e.target as HTMLTextAreaElement | null;
						if (!textarea) {
							return;
						}

						// Remove focus
						textarea.blur();

						// Reset to use the default value of expression
						textarea.removeAttribute("defaultValue");
						textarea.value = expression;
						textarea.removeAttribute("value");
						textarea.setAttribute("defaultValue", expression);
					}

					if (isKeyCodeOf("Enter", e.keyCode) && e.metaKey) {
						const textarea = e.target as HTMLTextAreaElement | null;
						if (!textarea) {
							return;
						}
						textarea.blur(); // Will trigger a submit
					}
				}}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ flowState }, { nodeId }) => {
	const node = flowState.nodes[nodeId] as FlowNode<FlowNodeType.expr>;
	return {
		textareaHeight: node.state.textareaHeight,
	};
};

export const ExpressionNodeTextarea = connectActionState(mapStateToProps)(
	ExpressionNodeTextareaComponent,
);
