import React, { useRef } from "react";
import { NumberInput } from "~/components/common/NumberInput";
import { compositionActions } from "~/composition/compositionReducer";
import { cssVariables } from "~/cssVariables";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const FOOTER_HEIGHT = 24;

const s = compileStylesheetLabelled(({ css }) => ({
	footer: css`
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: ${FOOTER_HEIGHT}px;
		background: blue;
		display: flex;
		background: ${cssVariables.dark600};
		align-items: center;
	`,

	dimensionLabel: css`
		color: ${cssVariables.light500};
		font-family: ${cssVariables.fontFamily};
		font-size: 11px;
		line-height: 16px;
		pointer-events: none;
		margin-right: 4px;
		margin-left: 8px;

		&:first-of-type {
			margin-left: 24px;
		}
	`,
}));

interface OwnProps {
	compositionId: string;
}
interface StateProps {
	width: number;
	height: number;
	length: number;
}
type Props = OwnProps & StateProps;

const WorkspaceFooterComponent = (props: Props) => {
	const { compositionId } = props;

	const paramsRef = useRef<RequestActionParams | null>(null);
	const onValueChangeFn = useRef<((value: number) => void) | null>(null);
	const onValueChangeEndFn = useRef<(() => void) | null>(null);

	const onValueChange = (which: "width" | "height" | "length", value: number) => {
		if (onValueChangeFn.current) {
			onValueChangeFn.current(value);
			return;
		}

		requestAction({ history: true }, (params) => {
			paramsRef.current = params;

			onValueChangeFn.current = (value) => {
				params.dispatch(
					which === "length"
						? compositionActions.setCompositionLength(compositionId, value)
						: compositionActions.setCompositionDimension(compositionId, which, value),
				);
				paramsRef.current?.performDiff((diff) => diff.compositionDimensions(compositionId));
			};
			onValueChangeFn.current(value);

			onValueChangeEndFn.current = () => {
				paramsRef.current?.addDiff((diff) => diff.compositionDimensions(compositionId));
				if (which === "length") {
					paramsRef.current?.submitAction("Update composition length");
				} else {
					paramsRef.current?.submitAction("Update composition dimensions");
				}
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
		<div className={s("footer")}>
			<div className={s("dimensionLabel")}>Width</div>
			<NumberInput
				min={1}
				onChange={(value) => onValueChange("width", value)}
				onChangeEnd={onValueChangeEnd}
				value={props.width}
			/>
			<div className={s("dimensionLabel")}>Height</div>
			<NumberInput
				min={1}
				onChange={(value) => onValueChange("height", value)}
				onChangeEnd={onValueChangeEnd}
				value={props.height}
			/>
			<div className={s("dimensionLabel")}>Length</div>
			<NumberInput
				min={1}
				onChange={(value) => onValueChange("length", value)}
				onChangeEnd={onValueChangeEnd}
				value={props.length}
			/>
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState },
	{ compositionId },
) => {
	const { width, height, length } = compositionState.compositions[compositionId];

	return { width, height, length };
};

export const WorkspaceFooter = connectActionState(mapState)(WorkspaceFooterComponent);
