import React from "react";
import { NumberInput } from "~/components/common/NumberInput";
import { FLOW_NODE_H_PADDING_BASE } from "~/constants";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	input: css`
		padding: 2px ${FLOW_NODE_H_PADDING_BASE}px;
	`,
}));

interface Props {
	value: Vec2;
	onXChange: (value: number) => void;
	onXChangeEnd: ((type: "relative" | "absolute") => void) | undefined;
	onYChange: (value: number) => void;
	onYChangeEnd: ((type: "relative" | "absolute") => void) | undefined;
	horizontalPadding?: boolean;
	paddingRight?: boolean;
	paddingLeft?: boolean;
}

export const FlowNodeVec2Input: React.FC<Props> = (props) => {
	return (
		<>
			<div className={s("input")}>
				<NumberInput
					label="X"
					value={props.value.x}
					onChange={props.onXChange}
					onChangeEnd={props.onXChangeEnd}
					decimalPlaces={1}
					fillWidth
					fullWidth
					flowEditor
				/>
			</div>
			<div className={s("input")}>
				<NumberInput
					label="Y"
					value={props.value.y}
					onChange={props.onYChange}
					onChangeEnd={props.onYChangeEnd}
					decimalPlaces={1}
					fillWidth
					fullWidth
					flowEditor
				/>
			</div>
		</>
	);
};
