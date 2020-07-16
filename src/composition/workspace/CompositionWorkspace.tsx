import React, { useRef } from "react";
import { AreaComponentProps } from "~/types/areaTypes";
import { CompositionWorkspaceAreaState } from "~/composition/workspace/compositionWorkspaceAreaReducer";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import styles from "~/composition/workspace/CompositionWorkspace.styles";
import { compositionWorkspaceHandlers } from "~/composition/workspace/compositionWorkspaceHandlers";
import { separateLeftRightMouse } from "~/util/mouse";
import { NumberInput } from "~/components/common/NumberInput";
import { RequestActionParams, requestAction } from "~/listener/requestAction";
import { compositionActions } from "~/composition/state/compositionReducer";
import { useActionState } from "~/hook/useActionState";
import { CompWorkspaceCompChildren } from "~/composition/workspace/CompWorkspaceCompChildren";
import { cssVariables } from "~/cssVariables";

const s = compileStylesheetLabelled(styles);

type Props = AreaComponentProps<CompositionWorkspaceAreaState>;

export const CompositionWorkspace: React.FC<Props> = (props) => {
	const clickCaptureTarget = useRef<HTMLDivElement>(null);
	const panTarget = useRef<HTMLDivElement>(null);
	const zoomTarget = useRef<HTMLDivElement>(null);

	const pan = props.areaState.pan;
	const scale = props.areaState.scale;

	useKeyDownEffect("Space", (down) => {
		if (panTarget.current) {
			panTarget.current.style.display = down ? "block" : "";
		}
	});
	useKeyDownEffect("Z", (down) => {
		if (zoomTarget.current) {
			zoomTarget.current.style.display = down ? "block" : "";
		}
	});
	useKeyDownEffect("Alt", (down) => {
		if (zoomTarget.current) {
			zoomTarget.current.style.cursor = down ? "zoom-out" : "zoom-in";
		}
	});

	const paramsRef = useRef<RequestActionParams | null>(null);
	const onValueChangeFn = useRef<((value: number) => void) | null>(null);
	const onValueChangeEndFn = useRef<(() => void) | null>(null);

	const { compositionId } = props.areaState;
	const composition = useActionState((state) => state.compositions.compositions[compositionId]);

	const onValueChange = (which: "width" | "height", value: number) => {
		if (onValueChangeFn.current) {
			onValueChangeFn.current(value);
			return;
		}

		requestAction({ history: true }, (params) => {
			paramsRef.current = params;

			onValueChangeFn.current = (value) => {
				params.dispatch(
					compositionActions.setCompositionDimension(compositionId, which, value),
				);
			};
			onValueChangeFn.current(value);

			onValueChangeEndFn.current = () => {
				paramsRef.current?.submitAction("Update composition dimensions");
			};
		});
	};

	const onValueChangeEnd = () => {
		onValueChangeEndFn.current?.();

		paramsRef.current = null;
		onValueChangeFn.current = null;
		onValueChangeEndFn.current = null;
	};

	return (
		<>
			<div className={s("header")}></div>
			<div className={s("container")}>
				<div
					style={{
						transform: `translate(${pan.x + props.width / 2}px, ${
							pan.y + props.height / 2
						}px)`,
					}}
				>
					<div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
						<svg
							className={s("svg")}
							width={composition.width}
							height={composition.height}
							style={{ background: cssVariables.gray800 }}
						>
							<CompWorkspaceCompChildren compositionId={composition.id} />
						</svg>
					</div>
				</div>
				<div className={s("clickCaptureTarget")} ref={clickCaptureTarget} />
				<div
					className={s("panTarget")}
					ref={panTarget}
					onMouseDown={separateLeftRightMouse({
						left: (e) => compositionWorkspaceHandlers.onPanStart(e, props.areaId),
					})}
				/>
				<div
					className={s("zoomTarget")}
					ref={zoomTarget}
					onMouseDown={separateLeftRightMouse({
						left: (e) => compositionWorkspaceHandlers.onZoomClick(e, props.areaId),
					})}
				/>
			</div>
			<div className={s("footer")}>
				<div className={s("dimensionLabel")}>Width</div>
				<NumberInput
					min={1}
					onChange={(value) => onValueChange("width", value)}
					onChangeEnd={onValueChangeEnd}
					value={composition.width}
				/>
				<div className={s("dimensionLabel")}>Height</div>
				<NumberInput
					min={1}
					onChange={(value) => onValueChange("height", value)}
					onChangeEnd={onValueChangeEnd}
					value={composition.height}
				/>
			</div>
		</>
	);
};
