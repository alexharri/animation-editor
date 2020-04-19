import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import styles from "~/timeline/ViewBounds.styles";
import { separateLeftRightMouse } from "~/util/mouse";
import { viewBoundsHandlers } from "~/timeline/timelineViewBoundsHandlers";
import { addListener } from "~/listener/addListener";

const s = compileStylesheetLabelled(styles);

export interface ViewBoundsProps {
	left: number;
	width: number;
	viewBounds: [number, number];
	requestUpdate: (
		callback: (params: {
			addListener: typeof addListener;
			update: (viewBounds: [number, number]) => void;
			submit: () => void;
		}) => void,
	) => void;
}

export const ViewBounds: React.FC<ViewBoundsProps> = (props) => {
	const { viewBounds, width } = props;

	const left = width * viewBounds[0];
	const right = width * (1 - viewBounds[1]);

	return (
		<div className={s("viewBounds")}>
			<div
				className={s("viewBounds__inner")}
				style={{
					left: `${left}px`,
					right: `${right}px`,
				}}
				onMouseDown={separateLeftRightMouse({
					left: (e) => viewBoundsHandlers.onMoveViewBounds(e, props),
				})}
			>
				<div
					className={s("viewBounds__handle", { left: true })}
					style={{ left: Math.max(0, 6 - left) }}
					onMouseDown={separateLeftRightMouse({
						left: (e) => viewBoundsHandlers.onLeftHandleMouseDown(e, props),
					})}
				/>
				<div
					className={s("viewBounds__handle", { right: true })}
					style={{ right: Math.max(0, 6 - right) }}
					onMouseDown={separateLeftRightMouse({
						left: (e) => viewBoundsHandlers.onRightHandleMouseDown(e, props),
					})}
				/>
			</div>
		</div>
	);
};
