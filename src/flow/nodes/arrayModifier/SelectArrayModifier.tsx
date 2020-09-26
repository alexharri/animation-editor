import React, { useState } from "react";
import { CompositionPropertyGroup } from "~/composition/compositionTypes";
import {
	getLayerModifierPropertyGroupId,
	getLayerPropertyGroupLabel,
} from "~/composition/util/compositionPropertyUtils";
import {
	CONTEXT_MENU_OPTION_HEIGHT,
	DEFAULT_CONTEXT_MENU_WIDTH,
	FLOW_NODE_H_PADDING_BASE,
} from "~/constants";
import { cssVariables } from "~/cssVariables";
import { NODE_HEIGHT_CONSTANTS } from "~/flow/util/flowNodeHeight";
import { useActionStateEffect } from "~/hook/useActionState";
import { connectActionState } from "~/state/stateUtils";
import { PropertyGroupName } from "~/types";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";

const styles = ({ css }: StyleParams) => ({
	wrapper: css`
		position: relative;
		margin-bottom: ${NODE_HEIGHT_CONSTANTS.spacing}px;
	`,

	select: css`
		height: ${NODE_HEIGHT_CONSTANTS.selectHeight}px;
		background: ${cssVariables.gray600};
		color: ${cssVariables.white500};
		font: 400 12px/18px ${cssVariables.fontFamily};
		border: none;
		display: block;
		width: calc(100% - ${FLOW_NODE_H_PADDING_BASE * 2}px);
		margin: 0 ${FLOW_NODE_H_PADDING_BASE};
		text-align: left;
		padding: 0 6px;
		border-radius: 4px;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow-x: hidden;
	`,

	dropdownContainer: css`
		background: ${cssVariables.dark300};
		border: 1px solid ${cssVariables.gray800};
		min-width: ${DEFAULT_CONTEXT_MENU_WIDTH}px;
		padding: 2px;
		border-radius: 4px;
	`,

	container: css`
		height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		position: relative;

		&:hover {
			background: ${cssVariables.primary500};
		}

		&:last-of-type {
			border-bottom: none;
		}
	`,

	contentContainer: css`
		height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		display: flex;
		align-items: stretch;
	`,

	activeDot: css`
		position: absolute;
		top: ${CONTEXT_MENU_OPTION_HEIGHT / 2}px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: ${cssVariables.white500};
		transform: translate(-50%, -50%);
	`,

	name: css`
		color: ${cssVariables.white500};
		font-size: 12px;
		font-weight: 400;
		line-height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		font-family: ${cssVariables.fontFamily};
		cursor: default;

		&--active {
			background-color: ${cssVariables.gray700};
		}
	`,
});

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	layerId: string;
	selectedPropertyId: string;
	onSelectProperty: (propertyId: string) => void;
}
interface StateProps {
	selectedPropertyName?: string;
}
type Props = OwnProps & StateProps;

const SelectArrayModifierComponent: React.FC<Props> = (props) => {
	const [propertyIds, setPropertyIds] = useState<string[]>([]);

	useActionStateEffect((state) => {
		const { compositionState } = state;

		const modifierGroupId = getLayerModifierPropertyGroupId(props.layerId, compositionState);
		if (!modifierGroupId) {
			return;
		}

		const modifierGroup = compositionState.properties[
			modifierGroupId
		] as CompositionPropertyGroup;

		const _propertyIds: string[] = [];

		for (let i = 0; i < modifierGroup.properties.length; i++) {
			const property = compositionState.properties[modifierGroup.properties[i]];
			if (property.name === PropertyGroupName.ArrayModifier) {
				_propertyIds.push(property.id);
			}
		}

		const shouldUpdate = (() => {
			if (_propertyIds.length !== propertyIds.length) {
				return true;
			}

			for (let i = 0; i < _propertyIds.length; i++) {
				if (_propertyIds[i] !== propertyIds[i]) {
					return true;
				}
			}

			return false;
		})();

		if (!shouldUpdate) {
			return;
		}

		setPropertyIds(_propertyIds);
	});

	return (
		<>
			<div className={s("wrapper")}>
				<select onChange={(e) => console.log(e.target.value)}>
					{propertyIds.map((propertyId, i) => (
						<option key={propertyId} value={propertyId}>
							{i}
						</option>
					))}
				</select>
			</div>
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState: compositions },
	{ selectedPropertyId },
) => ({
	selectedPropertyName:
		compositions.properties[selectedPropertyId] &&
		getLayerPropertyGroupLabel(
			compositions.properties[selectedPropertyId].name as PropertyGroupName,
		),
});

export const SelectArrayModifier = connectActionState(mapState)(SelectArrayModifierComponent);
