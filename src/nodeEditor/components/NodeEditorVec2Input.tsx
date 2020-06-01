import React from "react";
import { NumberInput } from "~/components/common/NumberInput";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { NODE_EDITOR_NODE_H_PADDING } from "~/constants";

const s = compileStylesheetLabelled(({ css }) => ({
	container: css`
		min-height: 20px;
		padding: 4px 0;

		&--horizontalPadding {
			padding-left: ${NODE_EDITOR_NODE_H_PADDING};
			padding-right: ${NODE_EDITOR_NODE_H_PADDING};
		}

		&--paddingLeft {
			padding-left: ${NODE_EDITOR_NODE_H_PADDING};
		}

		&--paddingRight {
			padding-right: ${NODE_EDITOR_NODE_H_PADDING};
		}
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

export const NodeEditorVec2Input: React.FC<Props> = (props) => {
	const { horizontalPadding = false, paddingLeft = false, paddingRight = false } = props;

	return (
		<div className={s("container", { horizontalPadding, paddingLeft, paddingRight })}>
			<NumberInput
				label="X"
				value={props.value.x}
				onChange={props.onXChange}
				onChangeEnd={props.onXChangeEnd}
				decimalPlaces={1}
				fillWidth
				fullWidth
			/>
			<NumberInput
				label="Y"
				value={props.value.y}
				onChange={props.onYChange}
				onChangeEnd={props.onYChangeEnd}
				decimalPlaces={1}
				fillWidth
				fullWidth
			/>
		</div>
	);
};
