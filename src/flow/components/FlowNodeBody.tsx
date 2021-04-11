import React from "react";
import { FlowNodeType } from "~/flow/flowTypes";
import { flowSelectionFromState, getFlowNodeLabel } from "~/flow/flowUtils";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	zIndex: number;
	allowResize?: boolean;
	children: React.ReactNode;
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
	const { nodeId, top, left, width, type, allowResize = true, zIndex } = props;
	const { selected } = props;

	return (
		<div
			className={s("container", { selected })}
			style={{ left, top, width, zIndex }}
			onMouseDown={separateLeftRightMouse({
				left: (e) => nodeHandlers.mouseDown(e, props.areaId, props.graphId, props.nodeId),
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
		</div>
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
