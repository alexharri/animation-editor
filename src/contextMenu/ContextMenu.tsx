import React, { useState, useEffect, useRef } from "react";
import {
	ContextMenuState,
	ContextMenuOption,
	ContextMenuListOption,
	ContextMenuActionOption,
} from "~/contextMenu/contextMenuReducer";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheet } from "~/util/stylesheets";
import { boundingRect, isVecInRect } from "~/util/math";
import styles from "~/contextMenu/ContextMenu.styles";
import { DEFAULT_CONTEXT_MENU_WIDTH, CONTEXT_MENU_OPTION_HEIGHT } from "~/constants";

const s = compileStylesheet(styles);

type Props = ContextMenuState;

const CLOSE_MENU_BUFFER = 100;
const REDUCE_STACK_BUFFER = 64;

const ContextMenuComponent: React.FC<Props> = (props) => {
	const [rect, setRect] = useState<Rect | null>(null);
	const [reduceStackRect, setReduceStackRect] = useState<Rect | null>(null);
	const [stack, setStack] = useState<
		Array<{ position: Vec2; options: ContextMenuOption[]; fromIndex: number }>
	>([]);

	const mouseOverOptionListener = useRef<number | null>(null);

	useEffect(() => {
		if (!props.isOpen) {
			setStack([]);
			return;
		}

		let position = props.position;

		for (let i = 0; i < props.options.length; i += 1) {
			if (props.options[i].default) {
				position = position.add(
					Vec2.new(
						-(DEFAULT_CONTEXT_MENU_WIDTH - 40),
						-40 + CONTEXT_MENU_OPTION_HEIGHT * i,
					),
				);
				break;
			}
		}

		setStack([{ position, options: props.options, fromIndex: -1 }]);
	}, [props.isOpen]);

	useEffect(() => {
		setTimeout(() => {
			const els = document.querySelectorAll("[data-option-list]");
			const rects: Rect[] = [];
			els.forEach((el) => rects.push(el.getBoundingClientRect()));
			setRect(boundingRect(rects));

			if (rects.length > 1) {
				let rect = rects[rects.length - 1];
				setReduceStackRect({
					top: rect.top - REDUCE_STACK_BUFFER,
					height: rect.height + REDUCE_STACK_BUFFER * 2,
					left: rect.left - 16,
					width: rect.width + REDUCE_STACK_BUFFER + 16,
				});
			} else {
				setReduceStackRect(null);
			}
		});
	}, [stack]);

	if (!props.isOpen) {
		return null;
	}

	const onMouseMove = (e: React.MouseEvent) => {
		const vec = Vec2.fromEvent(e);
		const { x, y } = vec;

		if (!rect) {
			return;
		}

		if (reduceStackRect && !isVecInRect(vec, reduceStackRect)) {
			setStack(stack.slice(0, stack.length - 1));
			return;
		}

		if (
			x < rect.left - CLOSE_MENU_BUFFER ||
			x > rect.left + rect.width + CLOSE_MENU_BUFFER ||
			y < rect.top - CLOSE_MENU_BUFFER ||
			y > rect.top + rect.height + CLOSE_MENU_BUFFER
		) {
			props.close?.();
		}
	};

	const onListMouseOver = (options: ContextMenuOption[], i: number, j: number) => {
		if (i !== stack.length - 1) {
			return;
		}

		let didRemove = false;

		const item = document.querySelector(`[data-option="${i}-${j}"]`);

		if (!item) {
			return;
		}

		const rect = item.getBoundingClientRect();

		mouseOverOptionListener.current = window.setTimeout(() => {
			setStack([
				...stack.slice(0, didRemove ? stack.length - 1 : stack.length),
				{
					fromIndex: j,
					options,
					position: Vec2.new(rect.left + rect.width, rect.top).add(Vec2.new(2, -3)),
				},
			]);
		}, 150);
	};

	const onListMouseOut = (i: number) => {
		if (i !== stack.length - 1) {
			return;
		}
		window.clearTimeout(mouseOverOptionListener.current!);
	};

	return (
		<>
			<div
				className={s("background")}
				onMouseMove={onMouseMove}
				onMouseDown={() => props.close?.()}
			/>
			{stack.map(({ options, position }, i) => {
				return (
					<div
						className={s("container")}
						style={{ left: position.x, top: position.y }}
						data-option-list={i}
						key={i}
						onMouseMove={onMouseMove}
					>
						{i === 0 && (
							<>
								<div className={s("name")}>{props.name}</div>
								<div className={s("separator")} />
							</>
						)}

						{options.map((option, j) => {
							const Icon = option.icon;

							if ((option as ContextMenuListOption).options) {
								const { options } = option as ContextMenuListOption;
								const active = stack[i + 1]?.fromIndex === j;
								const eligible = active || i === stack.length - 1;

								return (
									<div
										key={j}
										data-option={`${i}-${j}`}
										className={s("option", { active, eligible })}
										onMouseMove={(e) => e.stopPropagation()}
										onMouseOver={() => onListMouseOver(options, i, j)}
										onMouseOut={() => onListMouseOut(i)}
									>
										{Icon && (
											<i className={s("option__icon")}>
												<Icon />
											</i>
										)}
										<div className={s("option__label")}>{option.label}</div>
										{<div className={s("option__arrowRight")} />}
									</div>
								);
							}

							return (
								<button
									className={s("option", { eligible: i === stack.length - 1 })}
									key={j}
									onClick={(option as ContextMenuActionOption).onSelect}
								>
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
				);
			})}
		</>
	);
};

export const ContextMenu = connectActionState((state) => state.contextMenu)(ContextMenuComponent);
