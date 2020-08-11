import React from "react";
import { VIEW_BOUNDS_HANDLE_WIDTH } from "~/constants";
import { addListener } from "~/listener/addListener";
import styles from "~/timeline/TimelineViewBounds.styles";
import { viewBoundsHandlers } from "~/timeline/timelineViewBoundsHandlers";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

export interface TimelineViewBoundsProps {
	left: number;
	width: number;
	viewBounds: [number, number];
	compositionLength: number;
	requestUpdate: (
		callback: (params: {
			addListener: typeof addListener;
			update: (viewBounds: [number, number]) => void;
			submit: () => void;
		}) => void,
	) => void;
}

export const TimelineViewBounds: React.FC<TimelineViewBoundsProps> = (props) => {
	const { viewBounds, width: renderWidth } = props;

	const canvasWidth = renderWidth - VIEW_BOUNDS_HANDLE_WIDTH * 2;

	const left = canvasWidth * viewBounds[0] + VIEW_BOUNDS_HANDLE_WIDTH;
	const right = canvasWidth * (1 - viewBounds[1]) + VIEW_BOUNDS_HANDLE_WIDTH;

	return (
		<div className={s("viewBounds")}>
			<div
				className={s("viewBounds__inner")}
				style={{ left, right }}
				onMouseDown={separateLeftRightMouse({
					left: (e) => viewBoundsHandlers.onMoveViewBounds(e, props),
				})}
			>
				<div
					className={s("viewBounds__handle", { left: true })}
					style={{ left: Math.max(0, VIEW_BOUNDS_HANDLE_WIDTH - left) }}
					onMouseDown={separateLeftRightMouse({
						left: (e) => viewBoundsHandlers.onLeftHandleMouseDown(e, props),
					})}
				/>
				<div
					className={s("viewBounds__handle", { right: true })}
					style={{ right: Math.max(0, VIEW_BOUNDS_HANDLE_WIDTH - right) }}
					onMouseDown={separateLeftRightMouse({
						left: (e) => viewBoundsHandlers.onRightHandleMouseDown(e, props),
					})}
				/>
			</div>
		</div>
	);
};
