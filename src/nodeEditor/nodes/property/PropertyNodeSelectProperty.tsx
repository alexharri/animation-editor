import React, { useEffect, useRef } from "react";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import {
	getLayerPropertyGroupLabel,
	getLayerPropertyLabel,
} from "~/composition/util/compositionPropertyUtils";
import {
	CONTEXT_MENU_OPTION_HEIGHT,
	CONTEXT_MENU_OPTION_PADDING_LEFT,
	DEFAULT_CONTEXT_MENU_WIDTH,
	NODE_H_PADDING_ADDITIONAL,
	NODE_H_PADDING_BASE,
} from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { ContextMenuBaseProps, OpenCustomContextMenuOptions } from "~/contextMenu/contextMenuTypes";
import { cssVariables } from "~/cssVariables";
import { useGetRefRectFn, useRefRect } from "~/hook/useRefRect";
import { requestAction } from "~/listener/requestAction";
import { NODE_HEIGHT_CONSTANTS } from "~/nodeEditor/util/calculateNodeHeight";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
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
		width: calc(100% - ${NODE_H_PADDING_BASE * 2}px);
		margin: 0 ${NODE_H_PADDING_BASE};
		text-align: left;
		padding: 0 ${NODE_H_PADDING_ADDITIONAL};
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

interface PropertyOwnProps {
	selectedPropertyId: string;
	propertyId: string;
	onSelectProperty: (propertyId: string) => void;
	depth: number;
}
interface PropertyStateProps {
	property: CompositionProperty | CompositionPropertyGroup;
}
type PropertyProps = PropertyOwnProps & PropertyStateProps;

const PropertyComponent: React.FC<PropertyProps> = (props) => {
	const { depth, property, propertyId, selectedPropertyId } = props;

	const onClick = () => props.onSelectProperty(propertyId);
	const depthLeft = 16 * depth;

	const activeDot = propertyId === selectedPropertyId && (
		<div
			className={s("activeDot")}
			style={{ left: CONTEXT_MENU_OPTION_PADDING_LEFT / 2 + depthLeft + 4 }}
		/>
	);

	if (property.type === "group") {
		return (
			<>
				<div className={s("container")} onClick={onClick}>
					{activeDot}
					<div
						className={s("contentContainer")}
						style={{ marginLeft: CONTEXT_MENU_OPTION_PADDING_LEFT + depthLeft }}
					>
						<div className={s("name")}>{getLayerPropertyGroupLabel(property.name)}</div>
					</div>
				</div>
				{property.properties.map((propertyId) => (
					<Property
						selectedPropertyId={selectedPropertyId}
						propertyId={propertyId}
						onSelectProperty={props.onSelectProperty}
						depth={depth + 1}
						key={propertyId}
					/>
				))}
			</>
		);
	}

	return (
		<div className={s("container")} onClick={onClick}>
			{activeDot}
			<div
				className={s("contentContainer")}
				style={{ marginLeft: CONTEXT_MENU_OPTION_PADDING_LEFT + depthLeft }}
			>
				<div className={s("name")}>{getLayerPropertyLabel(property.name)}</div>
			</div>
		</div>
	);
};

const mapPropertyState: MapActionState<PropertyStateProps, PropertyOwnProps> = (
	{ compositionState },
	{ propertyId },
) => ({
	property: compositionState.properties[propertyId],
});

const Property = connectActionState(mapPropertyState)(PropertyComponent);

interface LayerOwnProps {
	selectedLayerId: string;
	layerId: string;
	onSelectLayer: (layerId: string) => void;
}
interface LayerStateProps {
	name: string;
}
type LayerProps = LayerOwnProps & LayerStateProps;

const LayerComponent: React.FC<LayerProps> = (props) => {
	const { layerId, name, onSelectLayer, selectedLayerId } = props;

	const activeDot = layerId === selectedLayerId && (
		<div
			className={s("activeDot")}
			style={{ left: CONTEXT_MENU_OPTION_PADDING_LEFT / 2 + 4 }}
		/>
	);

	return (
		<div className={s("container")} onClick={() => onSelectLayer(layerId)}>
			{activeDot}
			<div
				className={s("contentContainer")}
				style={{ marginLeft: CONTEXT_MENU_OPTION_PADDING_LEFT }}
			>
				<div className={s("name")}>{name}</div>
			</div>
		</div>
	);
};

const mapLayerState: MapActionState<LayerStateProps, LayerOwnProps> = (
	{ compositionState },
	{ layerId },
) => ({
	name: compositionState.layers[layerId].name,
});

const Layer = connectActionState(mapLayerState)(LayerComponent);

interface OwnProps {
	selectFromLayerIds?: string[];
	selectFromPropertyIds?: string[];

	selectedPropertyId: string;
	onSelectProperty: (propertyId: string) => void;
	selectedLayerId?: string;
	onSelectLayer?: (layerId: string) => void;
}
interface StateProps {
	selectedPropertyName?: string;
	selectedLayerName?: string;
}
type Props = OwnProps & StateProps;

const PropertyNodeSelectPropertyComponent: React.FC<Props> = (props) => {
	const selectPropertyRef = useRef<HTMLButtonElement>(null);
	const selectLayerRef = useRef<HTMLButtonElement>(null);

	const getSelectPropertyRect = useGetRefRectFn(selectPropertyRef);
	const getSelectLayerRect = useGetRefRectFn(selectLayerRef);

	const openLayerContextMenu = () => {
		requestAction({ history: false }, (params) => {
			const onSelectLayer = (layerId: string) => {
				params.cancelAction();
				props.onSelectLayer!(layerId);
			};

			const Component: React.FC<ContextMenuBaseProps> = ({ updateRect }) => {
				const ref = useRef(null);
				const rect = useRefRect(ref);

				useEffect(() => {
					updateRect(rect!);
				}, [rect]);

				return (
					<div className={s("dropdownContainer")} ref={ref}>
						{props.selectFromLayerIds!.map((layerId) => (
							<Layer
								layerId={layerId}
								selectedLayerId={props.selectedLayerId!}
								onSelectLayer={onSelectLayer}
								key={layerId}
							/>
						))}
					</div>
				);
			};

			const selectRect = getSelectLayerRect()!;

			const options: OpenCustomContextMenuOptions = {
				component: Component,
				props: {},
				position: Vec2.new(selectRect.left, selectRect.top),
				close: () => params.cancelAction(),
			};
			params.dispatch(contextMenuActions.openCustomContextMenu(options));
		});
	};

	const openPropertyContextMenu = () => {
		requestAction({ history: false }, (params) => {
			const onSelectProperty = (propertyId: string) => {
				params.cancelAction();
				props.onSelectProperty(propertyId);
			};

			const Component: React.FC<ContextMenuBaseProps> = ({ updateRect }) => {
				const ref = useRef(null);
				const rect = useRefRect(ref);

				useEffect(() => {
					updateRect(rect!);
				}, [rect]);

				return (
					<div className={s("dropdownContainer")} ref={ref}>
						{props.selectFromPropertyIds!.map((propertyId) => (
							<Property
								selectedPropertyId={props.selectedPropertyId}
								propertyId={propertyId}
								depth={0}
								key={propertyId}
								onSelectProperty={onSelectProperty}
							/>
						))}
					</div>
				);
			};

			const selectRect = getSelectPropertyRect()!;

			const options: OpenCustomContextMenuOptions = {
				component: Component,
				props: {},
				position: Vec2.new(selectRect.left, selectRect.top),
				close: () => params.cancelAction(),
			};
			params.dispatch(contextMenuActions.openCustomContextMenu(options));
		});
	};

	const shouldSelectLayer = !!(
		typeof props.onSelectLayer === "function" && props.selectFromLayerIds
	);

	return (
		<>
			{shouldSelectLayer && (
				<div className={s("wrapper")}>
					<button
						className={s("select")}
						onClick={openLayerContextMenu}
						onMouseDown={separateLeftRightMouse({
							left: (e) => e.stopPropagation(),
						})}
						ref={selectLayerRef}
					>
						{props.selectedLayerName || "No layer selected"}
					</button>
				</div>
			)}
			{(shouldSelectLayer ? props.selectedLayerId : true) && (
				<div className={s("wrapper")}>
					<button
						className={s("select")}
						onClick={openPropertyContextMenu}
						onMouseDown={separateLeftRightMouse({
							left: (e) => e.stopPropagation(),
						})}
						ref={selectPropertyRef}
					>
						{props.selectedPropertyName || "Not selected"}
					</button>
				</div>
			)}
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState },
	{ selectedLayerId, selectedPropertyId },
) => {
	let selectedPropertyName: string | undefined;

	if (selectedPropertyId) {
		const property = compositionState.properties[selectedPropertyId];
		selectedPropertyName =
			property.type === "property"
				? getLayerPropertyLabel(property.name)
				: getLayerPropertyGroupLabel(property.name);
	}

	return {
		selectedLayerName: selectedLayerId && compositionState.layers[selectedLayerId].name,
		selectedPropertyName,
	};
};

export const PropertyNodeSelectProperty = connectActionState(mapState)(
	PropertyNodeSelectPropertyComponent,
);
