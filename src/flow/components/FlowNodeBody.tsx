import React from "react";
import FlowNodeBodyStyles from "~/flow/components/FlowNodeBody.styles";
import { FlowNodeError } from "~/flow/components/FlowNodeError";
import { FlowNodeType } from "~/flow/flowTypes";
import { flowSelectionFromState, getFlowNodeLabel } from "~/flow/flowUtils";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { CompositionError } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(FlowNodeBodyStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	zIndex: number;
	allowResize?: boolean;
	children: React.ReactNode;
	errors: CompositionError[];
	scale: number;
}
interface StateProps {
	type: FlowNodeType;
	left: number;
	top: number;
	width: number;
	selected: boolean;
}
type Props = OwnProps & StateProps;

const FlowNodeBodyComponent: React.FC<Props> = (props) => {
	const { nodeId, top, left, width, type, errors, allowResize = true, zIndex, scale } = props;
	const { selected } = props;

	const hasError = errors.length > 0;

	return (
		<>
			<div
				className={s("container", { selected, hasError })}
				style={{ left, top, width, zIndex }}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						nodeHandlers.mouseDown(e, props.areaId, props.graphId, props.nodeId),
					right: (e) => nodeHandlers.onRightClick(e, props.graphId, props.nodeId),
				})}
			>
				<div className={s("header", { selected })}>
					{`(${nodeId}) ` + getFlowNodeLabel(type)}
				</div>
				{props.children}
				{allowResize && (
					<div
						className={s("widthResize")}
						onMouseDown={separateLeftRightMouse({
							left: (e) =>
								nodeHandlers.onWidthResizeMouseDown(
									e,
									props.areaId,
									props.graphId,
									props.nodeId,
								),
						})}
					/>
				)}
				{errors.length > 0 && (
					<div
						className={s("error")}
						style={{
							transform: `scale(${1 / scale})`,
							top: `calc(100% + ${2 + (1 / scale) * 8}px)`,
						}}
					>
						<FlowNodeError error={errors[0].error} />
					</div>
				)}
			</div>
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ flowState, flowSelectionState },
	{ graphId, nodeId },
) => {
	const selection = flowSelectionFromState(graphId, flowSelectionState);

	const { type, width, position } = flowState.nodes[nodeId];
	const selected = !!selection.nodes[nodeId];

	const { x: left, y: top } = position;
	return { selected, left, top, type, width };
};

export const FlowNodeBody = connectActionState(mapStateToProps)(FlowNodeBodyComponent);
