import React, { useRef } from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { AreaWindowProps } from "~/types/areaTypes";
import styles from "~/vectorEditor/VectorEditor.styles";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaWindowProps<any>;
type Props = OwnProps;

const VectorEditorComponent: React.FC<Props> = (props) => {
	const canvas = useRef<HTMLCanvasElement>(null);

	const { viewport } = props;

	return (
		<>
			<canvas
				width={viewport.width}
				height={viewport.height}
				ref={canvas}
				className={s("canvas")}
			/>
		</>
	);
};

export const VectorEditor = connectActionState(() => ({}))(VectorEditorComponent);
