import React, { useState, useEffect } from "react";
import { ContextMenuState } from "~/contextMenu/contextMenuReducer";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheet } from "~/util/stylesheets";
import styles from "~/contextMenu/ContextMenu.styles";

const s = compileStylesheet(styles);

type Props = ContextMenuState;

const buffer = 200;

const ContextMenuComponent: React.FC<Props> = props => {
	const [rect, setRect] = useState<Rect | null>(null);

	useEffect(() => {
		if (!props.isOpen) {
			return;
		}

		setTimeout(() => {
			setRect(document.getElementById("contextMenu")!.getBoundingClientRect());
		});
	}, [props.isOpen]);

	if (!props.isOpen) {
		return null;
	}

	const onMouseMove = (e: React.MouseEvent) => {
		const { x, y } = Vec2.fromEvent(e);

		if (!rect) {
			return;
		}

		if (
			x < rect.left - buffer ||
			x > rect.left + rect.width + buffer ||
			y < rect.top - buffer ||
			y > rect.top + rect.height + buffer
		) {
			props.close?.();
		}
	};

	return (
		<>
			<div
				className={s("background")}
				onMouseMove={onMouseMove}
				onMouseDown={() => props.close?.()}
			/>
			<div
				className={s("container")}
				style={{ left: props.position.x, top: props.position.y }}
				id="contextMenu"
			>
				<div className={s("name")}>{props.name}</div>
				<div className={s("separator")} />
				{props.options.map((option, i) => {
					const Icon = option.icon;

					return (
						<button className={s("option")} key={i} onClick={option.onSelect}>
							{Icon && (
								<i className={s("option__icon")}>
									<Icon />
								</i>
							)}
							<div className={s("option__label")}>{option.label}</div>
						</button>
					);
				})}
			</div>
		</>
	);
};

export const ContextMenu = connectActionState(state => state.contextMenu)(ContextMenuComponent);
