import React, { useState } from "react";
import { OpenCustomContextMenuOptions } from "~/contextMenu/contextMenuTypes";
import { cssZIndex } from "~/cssVariables";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const DEFAULT_CLOSE_MENU_BUFFER = 100;

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

		&--center {
			transform: translate(-50%, -50%);
		}

		&--bottomLeft {
			transform: translate(0, -100%);
		}
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

	const center = options.alignPosition === "center";
	const bottomLeft = options.alignPosition === "bottom-left";

	const onMouseMove = (e: React.MouseEvent) => {
		const vec = Vec2.fromEvent(e);
		const { x, y } = vec;

		if (!rect) {
			return;
		}

		const closeMenuBuffer = options.closeMenuBuffer ?? DEFAULT_CLOSE_MENU_BUFFER;

		if (
			x < rect.left - closeMenuBuffer ||
			x > rect.left + rect.width + closeMenuBuffer ||
			y < rect.top - closeMenuBuffer ||
			y > rect.top + rect.height + closeMenuBuffer
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
				className={s("wrapper", { center, bottomLeft })}
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
