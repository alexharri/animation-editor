import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import {
	getNodeEditorNodeDefaultInputs,
	getNodeEditorNodeDefaultOutputs,
	NodeEditorNodeIO,
} from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";
import { DEFAULT_NODE_EDITOR_NODE_WIDTH } from "~/constants";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	type: NodeEditorNodeType;
	io?: NodeEditorNodeIO;
	position: Vec2;
}

type Props = OwnProps;

export function NodePreview(props: Props) {
	const { io } = props;
	const { x: left, y: top } = props.position;

	const type = props.type as NodeEditorNodeType.empty;

	const inputs = io?.inputs || getNodeEditorNodeDefaultInputs(type);
	const outputs = io?.outputs || getNodeEditorNodeDefaultOutputs(type);

	return (
		<div
			className={s("container")}
			style={{ left, top, width: DEFAULT_NODE_EDITOR_NODE_WIDTH, opacity: 0.5 }}
		>
			<div className={s("header")}>{type}</div>
			{outputs.map((output, i) => {
				return (
					<div key={i} className={s("output", { last: i === outputs.length - 1 })}>
						<div className={s("output__circle")} />
						<div className={s("output__name")}>{output.name}</div>
					</div>
				);
			})}
			{inputs.map((input, i) => {
				return (
					<div key={i} className={s("input")}>
						<div className={s("input__circle")} />
						<div className={s("input__name")}>{input.name}</div>
					</div>
				);
			})}
		</div>
	);
}
