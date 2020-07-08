import React from "react";
import { OpenCustomContextMenuOptions } from "~/contextMenu/contextMenuTypes";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { cssZIndex } from "~/cssVariables";
import { useState } from "react";
import { connectActionState } from "~/state/stateUtils";

const CLOSE_MENU_BUFFER = 100;

const s = compileStylesheetLabelled(({ css }) => ({
	background: css`
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: ${cssZIndex.contextMenuBackground};
		cursor: default;
	`,

	wrapper: css`
		position: fixed;
		top: 0;
		left: 0;
		z-index: ${cssZIndex.contextMenu};
	`,
}));

interface StateProps {
	options: OpenCustomContextMenuOptions | null;
}
type Props = StateProps;

const CustomContextMenuComponent: React.FC<Props> = (props) => {
	const { options } = props;

	const [rect, setRect] = useState<Rect | null>();

	if (!options) {
		return null;
	}

	const onMouseMove = (e: React.MouseEvent) => {
		const vec = Vec2.fromEvent(e);
		const { x, y } = vec;

		if (!rect) {
			return;
		}

		if (
			x < rect.left - CLOSE_MENU_BUFFER ||
			x > rect.left + rect.width + CLOSE_MENU_BUFFER ||
			y < rect.top - CLOSE_MENU_BUFFER ||
			y > rect.top + rect.height + CLOSE_MENU_BUFFER
		) {
			options.close();
		}
	};

	const Component = options.component;

	return (
		<>
			<div
				className={s("background")}
				onMouseMove={onMouseMove}
				onMouseDown={() => options.close()}
			/>
			<div
				className={s("wrapper")}
				style={{ top: options.position.y, left: options.position.x }}
			>
				<Component {...options.props} updateRect={setRect} />
			</div>
		</>
	);
};

const mapState: MapActionState<StateProps> = ({ contextMenu }) => ({
	options: contextMenu.customContextMenu,
});

export const CustomContextMenu = connectActionState(mapState)(CustomContextMenuComponent);
