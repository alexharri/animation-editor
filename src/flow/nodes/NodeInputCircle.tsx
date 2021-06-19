import React, { useContext } from "react";
import { AreaIdContext } from "~/area/util/AreaIdContext";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { ValueType } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { getValueTypeColor } from "~/value/valueLabels";

const s = compileStylesheetLabelled(({ css }) => ({
	input__circle: css`
		position: absolute;
		left: -5px;
		top: 10px;
		transform: translate(0, -50%);
		width: 9px;
		height: 9px;
		background: #b3b223;
		border-radius: 50%;
	`,
}));

interface OwnProps {
	nodeId: string;
	index: number;
	valueType: ValueType;
}
type Props = OwnProps;

export const NodeInputCircle: React.FC<Props> = (props) => {
	const { nodeId, index, valueType } = props;
	const areaId = useContext(AreaIdContext);

	return (
		<div
			className={s("input__circle")}
			onMouseDown={separateLeftRightMouse({
				left: (e) => nodeHandlers.onInputMouseDown(e, areaId, nodeId, index),
			})}
			style={{ background: getValueTypeColor(valueType) }}
		/>
	);
};
