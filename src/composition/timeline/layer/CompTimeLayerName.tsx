import React, { useContext, useRef, useState } from "react";
import { AreaIdContext } from "~/area/util/AreaIdContext";
import { compositionActions } from "~/composition/state/compositionReducer";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { reduceLayerPropertiesAndGroups } from "~/composition/timeline/compTimeUtils";
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
		overflow-y: hidden;

		&--active {
			background-color: ${cssVariables.gray700};
		}

		&--propertySelected {
			padding: 0 1px;
			background-color: ${cssVariables.gray400};
			border: 2px solid ${cssVariables.gray700};
			line-height: 12px;
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
	layerWrapper: React.RefObject<HTMLDivElement>;
}
interface StateProps {
	name: string;
	selected: boolean;
	compositionId: string;
	isAnyPropertySelected: boolean;
}
type Props = OwnProps & StateProps;

const CompTimeLayerNameComponent: React.FC<Props> = (props) => {
	const { name } = props;
	const inputRef = useRef<HTMLInputElement>(null);

	const [renaming, setRenaming] = useState(false);
	const paramsRef = useRef<RequestActionParams | null>(null);

	const areaId = useContext(AreaIdContext);

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
				className={s("name", {
					active: props.selected,
					propertySelected: props.isAnyPropertySelected,
				})}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						compTimeHandlers.onLayerNameMouseDown(
							e,
							areaId,
							props.compositionId,
							props.layerId,
							props.layerWrapper,
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
	{ compositionState, compositionSelectionState },
	{ layerId },
) => {
	const layer = compositionState.layers[layerId];
	const compositionSelection = getCompSelectionFromState(
		layer.compositionId,
		compositionSelectionState,
	);

	const isAnyPropertySelected = reduceLayerPropertiesAndGroups<boolean>(
		layerId,
		compositionState,
		(acc, property) => {
			return acc || !!compositionSelection.properties[property.id];
		},
		false,
	);

	return {
		name: layer.name,
		selected: !!compositionSelection.layers[layerId],
		compositionId: layer.compositionId,
		isAnyPropertySelected,
	};
};

export const CompTimeLayerName = connectActionState(mapState)(CompTimeLayerNameComponent);
