import React, { useRef, useEffect } from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { NodeEditorNodeState, NodeEditorNodeOutput } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType, RGBAColor, RGBColor } from "~/types";
import { NodeEditorNumberInput } from "~/nodeEditor/components/NodeEditorNumberInput";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { NodeEditorTValueInput } from "~/nodeEditor/components/NodeEditorTValueInput";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { useNumberInputAction } from "~/hook/useNumberInputAction";
import { requestAction } from "~/listener/requestAction";
import { ContextMenuBaseProps, OpenCustomContextMenuOptions } from "~/contextMenu/contextMenuTypes";
import { useRefRect, useGetRefRectFn } from "~/hook/useRefRect";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { ColorPicker } from "~/components/colorPicker/ColorPicker";
import { NODE_HEIGHT_CONSTANTS } from "~/nodeEditor/util/calculateNodeHeight";

const s = compileStylesheetLabelled(NodeStyles);

const labels = ["Red", "Green", "Blue", "Alpha"];

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
}
interface StateProps {
	outputs: NodeEditorNodeOutput[];
	state: NodeEditorNodeState<NodeEditorNodeType.color_input>;
}

type Props = OwnProps & StateProps;

const ColorInputNodeComponent: React.FC<Props> = (props) => {
	const { areaId, graphId, nodeId, outputs, state } = props;

	const buttonRef = useRef<HTMLButtonElement>(null);
	const getButtonRect = useGetRefRectFn(buttonRef);

	const inputActions = state.color.map((_, i) =>
		useNumberInputAction({
			onChange: (value, params) => {
				const color = [...state.color] as RGBAColor;
				color[i] = value;
				params.dispatch(
					nodeEditorActions.updateNodeState<NodeEditorNodeType.color_input>(
						graphId,
						nodeId,
						{
							color,
						},
					),
				);
			},
			onChangeEnd: (_type, params) => {
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
						nodeEditorActions.updateNodeState(graphId, nodeId, { color: rgbaColor }),
					);
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
		<NodeBody areaId={areaId} graphId={graphId} nodeId={nodeId}>
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
				<NodeEditorNumberInput
					key={i}
					label={labels[i]}
					value={state.color[i]}
					onChange={inputActions[i].onChange}
					onChangeEnd={inputActions[i].onChangeEnd}
					min={0}
					max={255}
					horizontalPadding
				/>
			))}
			{[3].map((i) => (
				<NodeEditorTValueInput
					key={i}
					label={labels[i]}
					value={state.color[i]}
					onChange={inputActions[i].onChange}
					onChangeEnd={inputActions[i].onChangeEnd}
					horizontalPadding
				/>
			))}
		</NodeBody>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor },
	{ graphId, nodeId },
) => {
	const graph = nodeEditor.graphs[graphId];
	const node = graph.nodes[nodeId];
	return {
		outputs: node.outputs,
		state: node.state as StateProps["state"],
	};
};

export const ColorInputNode = connectActionState(mapStateToProps)(ColorInputNodeComponent);
