import React, { useRef, useState } from "react";
import { compositionActions } from "~/composition/state/compositionReducer";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { cssVariables } from "~/cssVariables";
import { isKeyCodeOf } from "~/listener/keyboard";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	wrapper: css`
		width: 98px;
		margin-right: 4px;
		height: 16px;
		position: relative;
	`,

	name: css`
		font-size: 11px;
		color: #bbb;
		line-height: 16px;
		padding: 0 3px;
		border-radius: 3px;
		cursor: default;
		overflow-x: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		&--active {
			background-color: ${cssVariables.gray700};
		}
	`,

	input: css`
		width: 100%;
		position: absolute;
		top: -1px;
		left: 0;
		height: 18px;
		color: white;
		outline: none;
		background-color: ${cssVariables.dark300};
		border: 1px solid ${cssVariables.primary400};
		font-size: 11px;
		padding: 0 3px;
		padding-top: 1px;
		padding-bottom: 1px;
		border-radius: 3px;
		font-weight: 400;

		&::selection {
			color: white;
			background: ${cssVariables.primary700};
		}
	`,
}));

interface OwnProps {
	layerId: string;
}
interface StateProps {
	name: string;
	selected: boolean;
	compositionId: string;
}
type Props = OwnProps & StateProps;

const CompTimeLayerNameComponent: React.FC<Props> = (props) => {
	const { name } = props;
	const inputRef = useRef<HTMLInputElement>(null);

	const [renaming, setRenaming] = useState(false);
	const paramsRef = useRef<RequestActionParams | null>(null);

	const onDoubleClick = () => {
		requestAction({ history: true }, (params) => {
			paramsRef.current = params;
			setRenaming(true);
		});
	};

	if (renaming) {
		const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			e.target.select();
		};

		const onBlur = () => {
			const params = paramsRef.current!;
			paramsRef.current = null;

			setRenaming(false);

			const value = inputRef.current?.value || "";

			if (!value || value === name) {
				params.cancelAction();
				return;
			}

			params.dispatch(compositionActions.setLayerName(props.layerId, value));
			params.submitAction("Rename layer");
		};

		const onKeyDown = (e: React.KeyboardEvent) => {
			if (isKeyCodeOf("Esc", e.keyCode)) {
				inputRef.current?.blur();
				return;
			}

			if (isKeyCodeOf("Enter", e.keyCode)) {
				inputRef.current?.blur();
				return;
			}
		};

		return (
			<div className={s("wrapper")}>
				<input
					className={s("input")}
					ref={inputRef}
					autoFocus
					onFocus={onFocus}
					onBlur={onBlur}
					onKeyDown={onKeyDown}
					defaultValue={name}
				/>
			</div>
		);
	}

	return (
		<div className={s("wrapper")}>
			<div
				className={s("name", { active: props.selected })}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						compTimeHandlers.onLayerNameMouseDown(
							e,
							props.compositionId,
							props.layerId,
						),
				})}
				onDoubleClick={onDoubleClick}
			>
				{name}
			</div>
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState: { layers }, compositionSelectionState },
	{ layerId },
) => {
	const layer = layers[layerId];
	const compositionSelection = getCompSelectionFromState(
		layer.compositionId,
		compositionSelectionState,
	);

	return {
		name: layer.name,
		selected: !!compositionSelection.layers[layerId],
		compositionId: layer.compositionId,
	};
};

export const CompTimeLayerName = connectActionState(mapState)(CompTimeLayerNameComponent);
