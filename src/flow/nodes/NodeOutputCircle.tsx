import React, { useContext } from "react";
import { AreaIdContext } from "~/area/util/AreaIdContext";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { ValueType } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { getValueTypeColor } from "~/value/valueLabels";

const s = compileStylesheetLabelled(({ css }) => ({
	output__circle: css`
		position: absolute;
		right: -5px;
		top: 50%;
		transform: translate(0, -50%);
		width: 9px;
		height: 9px;
		border-radius: 50%;
	`,
}));

interface OwnProps {
	nodeId: string;
	index: number;
	valueType: ValueType;
}
type Props = OwnProps;

export const NodeOutputCircle: React.FC<Props> = (props) => {
	const { nodeId, index, valueType } = props;
	const areaId = useContext(AreaIdContext);

	return (
		<div
			className={s("output__circle")}
			onMouseDown={(e) => nodeHandlers.onOutputMouseDown(e, areaId, nodeId, index)}
			style={{ background: getValueTypeColor(valueType) }}
		/>
	);
};
