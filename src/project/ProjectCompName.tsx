import React, { useRef, useState } from "react";
import { compositionActions } from "~/composition/compositionReducer";
import { cssVariables } from "~/cssVariables";
import { isKeyCodeOf } from "~/listener/keyboard";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
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

	inputWrapper: css`
		border: 1px solid ${cssVariables.primary500};
		position: absolute;
		top: -1px;
		left: -2px;
		width: 100%;
		height: 18px;
		border-radius: 3px;
		overflow: hidden;
		background-color: ${cssVariables.dark300};
	`,

	input: css`
		width: 100%;
		height: 16px;
		color: white;
		outline: none;
		background-color: ${cssVariables.dark300};
		border: 1px solid ${cssVariables.dark300};
		font-size: 11px;
		padding: 0 3px 2px;
		border-radius: 2px;
		font-weight: 400;

		&::selection {
			color: white;
			background: ${cssVariables.primary700};
		}
	`,
}));

interface OwnProps {
	compositionId: string;
}
interface StateProps {
	name: string;
}
type Props = OwnProps & StateProps;

const ProjectCompLayerNameComponent: React.FC<Props> = (props) => {
	const { compositionId, name } = props;
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

			params.dispatch(compositionActions.setCompositionName(compositionId, value));
			params.submitAction("Rename composition");
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
				<div className={s("inputWrapper")}>
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
			</div>
		);
	}

	return (
		<div className={s("wrapper")}>
			<div className={s("name")} onDoubleClick={onDoubleClick}>
				{name}
			</div>
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState: { compositions } },
	{ compositionId },
) => {
	const { name = "Composition" } = compositions[compositionId];
	return { name };
};

export const ProjectCompLayerName = connectActionState(mapState)(ProjectCompLayerNameComponent);
