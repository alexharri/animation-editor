import React, { useRef } from "react";
import { NumberInput } from "~/components/common/NumberInput";
import { CompositionPlaybackProvider } from "~/composition/hook/useCompositionPlayback";
import { compositionActions } from "~/composition/state/compositionReducer";
import { CompositionWorkspaceAreaState } from "~/composition/workspace/compositionWorkspaceAreaReducer";
import { compositionWorkspaceHandlers } from "~/composition/workspace/compositionWorkspaceHandlers";
import styles from "~/composition/workspace/CompWorkspace.styles";
import { CompWorkspaceViewportContext } from "~/composition/workspace/CompWorkspaceViewportContext";
import { CompWorkspaceCompChildren } from "~/composition/workspace/layers/CompWorkspaceCompChildren";
import { cssVariables } from "~/cssVariables";
import { useActionState } from "~/hook/useActionState";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { computeCompositionPropertyValues } from "~/shared/property/computeCompositionPropertyValues";
import { connectActionState } from "~/state/stateUtils";
import { AreaComponentProps } from "~/types/areaTypes";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaComponentProps<CompositionWorkspaceAreaState>;
interface StateProps {
	frameIndex: number;
}
type Props = OwnProps & StateProps;

const CompositionWorkspaceComponent: React.FC<Props> = (props) => {
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
	const composition = useActionState(
		(state) => state.compositionState.compositions[compositionId],
	);

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

	const propsRef = useRef(props);
	propsRef.current = props;

	const map = useActionState((state) => {
		const composition = state.compositionState.compositions[props.areaState.compositionId];
		return computeCompositionPropertyValues(
			state,
			composition.id,
			composition.frameIndex,
			{
				width: composition.width,
				height: composition.height,
			},
			{ recursive: true },
		);
	});

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
							style={{
								background: cssVariables.gray800,
							}}
							key={props.areaState.compositionId}
						>
							<CompositionPlaybackProvider
								compositionId={props.areaState.compositionId}
							>
								<CompWorkspaceViewportContext.Provider value={{ scale }}>
									<CompWorkspaceCompChildren
										compositionId={composition.id}
										containerHeight={composition.height}
										containerWidth={composition.width}
										map={map}
									/>
								</CompWorkspaceViewportContext.Provider>
							</CompositionPlaybackProvider>
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

const mapState: MapActionState<StateProps, OwnProps> = ({ compositionState }, { areaState }) => {
	const composition = compositionState.compositions[areaState.compositionId];

	return {
		frameIndex: composition.frameIndex,
	};
};

export const CompositionWorkspace = connectActionState(mapState)(CompositionWorkspaceComponent);
