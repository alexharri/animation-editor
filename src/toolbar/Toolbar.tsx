import React, { useRef } from "react";
import { ConvertAnchorIcon } from "~/components/icons/ConvertAnchorIcon";
import { EllipseIcon } from "~/components/icons/EllipseIcon";
import { FillIcon } from "~/components/icons/FillIcon";
import { IntersectionIcon } from "~/components/icons/IntersectionIcon";
import { PenIcon } from "~/components/icons/PenIcon";
import { PolygonIcon } from "~/components/icons/PolygonIcon";
import { RectangleIcon } from "~/components/icons/RectangleIcon";
import { SelectionIcon } from "~/components/icons/SelectionIcon";
import { Tool, toolGroups, toolToKey, toolToLabel } from "~/constants";
import { requestAction } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { toolActions } from "~/toolbar/toolActions";
import styles from "~/toolbar/Toolbar.styles";
import { ToolState } from "~/toolbar/toolReducer";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

export const toolToIconMap = {
	[Tool.move]: SelectionIcon,
	[Tool.pen]: PenIcon,
	[Tool.editVertex]: ConvertAnchorIcon,
	[Tool.rectangle]: RectangleIcon,
	[Tool.ellipse]: EllipseIcon,
	[Tool.polygon]: PolygonIcon,
	[Tool.fill]: FillIcon,
	[Tool.intersection]: IntersectionIcon,
};

interface StateProps {
	toolState: ToolState;
}
type Props = StateProps;

const ToolbarComponent: React.FC<Props> = (props) => {
	const onGroupItemClick = useRef<((tool: Tool) => void) | null>(null);
	const group = useRef<HTMLDivElement>(null);

	const onItemClick = (tool: Tool) => {
		requestAnimationFrame(() => {
			requestAction({}, (params) => {
				params.dispatch(toolActions.setTool(tool));
				params.performDiff((diff) => diff.tool());
				params.submitAction("Set tool");
			});
		});
	};

	const onGroupClick = (index: number) => {
		requestAction({}, (params) => {
			params.dispatch(toolActions.setOpenGroupIndex(index));

			onGroupItemClick.current = (tool: Tool) => {
				params.dispatch(toolActions.setTool(tool));
				params.performDiff((diff) => diff.tool());
				params.submitAction("Set tool");
			};

			setTimeout(() => {
				params.addListener.repeated("mousedown", (e) => {
					if (
						group.current !== e.target &&
						!group.current?.contains(e.target as HTMLDivElement)
					) {
						params.cancelAction();
					}
				});
			});

			params.execOnComplete(() => {
				onGroupItemClick.current = null;
			});
		});
	};

	return (
		<div className={s("container")}>
			<div className={s("dragArea", { left: true })} />
			<div className={s("list")}>
				{toolGroups.map((tools, i) => {
					const active = props.toolState.selected === props.toolState.selectedInGroup[i];
					return (
						<div key={i} className={s("group", { active })}>
							<button
								className={s("group__visibleTool")}
								onMouseDown={() => onItemClick(props.toolState.selectedInGroup[i])}
							>
								{toolToIconMap[props.toolState.selectedInGroup[i]]()}
							</button>
							<button
								className={s("group__openDropdown", { active })}
								onMouseDown={() => onGroupClick(i)}
							/>

							{props.toolState.openGroupIndex === i ? (
								<div
									ref={group}
									className={s("dropdown")}
									data-tool-dropdown-index={i}
								>
									{tools.map(({ tool }) => (
										<button
											key={tool}
											className={s("item")}
											onClick={() => {
												if (
													typeof onGroupItemClick.current === "function"
												) {
													onGroupItemClick.current(tool);
												}
											}}
										>
											<div className={s("icon")}>{toolToIconMap[tool]()}</div>
											<span className={s("label")}>
												<div>{toolToLabel[tool]}</div>
												{toolToKey[tool] && (
													<div className={s("label__key")}>
														{toolToKey[tool]}
													</div>
												)}
											</span>
										</button>
									))}
								</div>
							) : null}
						</div>
					);
				})}
			</div>
			<div
				className={s("dragArea", { right: true })}
				onDoubleClick={() => electron.onDoubleClickDragArea()}
			/>
		</div>
	);
};

export const Toolbar = connectActionState<StateProps>(({ tool }) => ({ toolState: tool }))(
	ToolbarComponent,
);
