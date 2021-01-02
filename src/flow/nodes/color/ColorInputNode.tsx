import React, { useEffect, useRef } from "react";
import { ColorPicker } from "~/components/colorPicker/ColorPicker";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { ContextMenuBaseProps, OpenCustomContextMenuOptions } from "~/contextMenu/contextMenuTypes";
import { FlowNodeBody } from "~/flow/components/FlowNodeBody";
import { FlowNodeNumberInput } from "~/flow/components/FlowNodeNumberInput";
import { FlowNodeTValueInput } from "~/flow/components/FlowNodeTValueInput";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeOutput, FlowNodeProps, FlowNodeType } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { flowActions } from "~/flow/state/flowActions";
import { NODE_HEIGHT_CONSTANTS } from "~/flow/util/flowNodeHeight";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { useNumberInputAction } from "~/hook/useNumberInputAction";
import { useGetRefRectFn, useRefRect } from "~/hook/useRefRect";
import { requestAction } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { RGBAColor, RGBColor } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

const labels = ["Red", "Green", "Blue", "Alpha"];

type OwnProps = FlowNodeProps;
interface StateProps {
	outputs: FlowNodeOutput[];
	state: FlowNodeState<FlowNodeType.color_input>;
}

type Props = OwnProps & StateProps;

const ColorInputNodeComponent: React.FC<Props> = (props) => {
	const { areaId, graphId, nodeId, outputs, state, zIndex } = props;

	const buttonRef = useRef<HTMLButtonElement>(null);
	const getButtonRect = useGetRefRectFn(buttonRef);

	const inputActions = state.color.map((_, i) =>
		useNumberInputAction({
			onChange: (value, params) => {
				const color = [...state.color] as RGBAColor;
				color[i] = value;
				params.dispatch(
					flowActions.updateNodeState<FlowNodeType.color_input>(graphId, nodeId, {
						color,
					}),
				);
				params.performDiff((diff) => diff.flowNodeState({ graphId, nodeId }));
			},
			onChangeEnd: (_type, params) => {
				params.addDiff((diff) => diff.flowNodeState({ graphId, nodeId }));
				params.submitAction("Update color input factor");
			},
		}),
	);

	const onClick = () => {
		const [r, g, b, a] = state.color;
		const rgb: RGBColor = [r, g, b];

		requestAction({ history: true }, (params) => {
			const Component: React.FC<ContextMenuBaseProps> = ({ updateRect }) => {
				const ref = useRef(null);
				const rect = useRefRect(ref);
				const latestColor = useRef(rgb);

				useEffect(() => {
					updateRect(rect!);
				}, [rect]);

				const onChange = (rgbColor: RGBColor) => {
					latestColor.current = rgbColor;

					const rgbaColor = [...rgbColor, a] as RGBAColor;

					params.dispatch(
						flowActions.updateNodeState(graphId, nodeId, { color: rgbaColor }),
					);
					params.performDiff((diff) => diff.flowNodeState({ graphId, nodeId }));
				};

				// Submit on enter
				useKeyDownEffect("Enter", (down) => {
					if (!down) {
						return;
					}

					let changed = false;

					for (let i = 0; i < rgb.length; i += 1) {
						if (rgb[i] !== latestColor.current[i]) {
							changed = true;
							break;
						}
					}

					if (!changed) {
						params.cancelAction();
						return;
					}

					params.dispatch(contextMenuActions.closeContextMenu());
					params.addDiff((diff) => diff.flowNodeState({ graphId, nodeId }));
					params.submitAction("Update color");
				});

				return (
					<div ref={ref} className={s("colorInput__colorPickerWrapper")}>
						<ColorPicker rgbColor={rgb} onChange={onChange} />
					</div>
				);
			};

			const rect = getButtonRect()!;

			const options: OpenCustomContextMenuOptions = {
				component: Component,
				props: {},
				position: Vec2.new(rect.left + rect.width + 8, rect.top + rect.height),
				alignPosition: "bottom-left",
				closeMenuBuffer: Infinity,
				close: () => params.cancelAction(),
			};
			params.dispatch(contextMenuActions.openCustomContextMenu(options));
		});
	};

	return (
		<FlowNodeBody areaId={areaId} graphId={graphId} nodeId={nodeId} zIndex={zIndex}>
			{outputs.map((output, i) => {
				return (
					<div className={s("output", { last: i === outputs.length - 1 })} key={i}>
						<div
							className={s("output__circle")}
							onMouseDown={(e) =>
								nodeHandlers.onOutputMouseDown(
									e,
									props.areaId,
									props.graphId,
									props.nodeId,
									i,
								)
							}
						/>
						<div className={s("output__name")}>{output.name}</div>
					</div>
				);
			})}
			<button
				className={s("colorInput__colorValue")}
				style={{
					background: `rgb(${state.color.slice(0, 3).join(",")})`,
					marginBottom: NODE_HEIGHT_CONSTANTS.spacing,
				}}
				onClick={onClick}
				ref={buttonRef}
			/>
			{[0, 1, 2].map((i) => (
				<FlowNodeNumberInput
					key={i}
					label={labels[i]}
					value={state.color[i]}
					onChange={inputActions[i].onChange}
					onChangeEnd={inputActions[i].onChangeEnd}
					min={0}
					max={255}
					horizontalPadding
					decimalPlaces={0}
				/>
			))}
			{[3].map((i) => (
				<FlowNodeTValueInput
					key={i}
					label={labels[i]}
					value={state.color[i]}
					onChange={inputActions[i].onChange}
					onChangeEnd={inputActions[i].onChangeEnd}
					horizontalPadding
				/>
			))}
		</FlowNodeBody>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ flowState },
	{ graphId, nodeId },
) => {
	const graph = flowState.graphs[graphId];
	const node = graph.nodes[nodeId];
	return {
		outputs: node.outputs,
		state: node.state as StateProps["state"],
	};
};

export const ColorInputNode = connectActionState(mapStateToProps)(ColorInputNodeComponent);
