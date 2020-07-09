import React, { useRef, useEffect } from "react";
import { StyleParams, compileStylesheetLabelled } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";
import { CompositionState } from "~/composition/state/compositionReducer";
import { connectActionState, getActionState } from "~/state/stateUtils";
import {
	getLayerPropertyLabel,
	getLayerPropertyGroupLabel,
} from "~/composition/util/compositionPropertyUtils";
import { requestAction } from "~/listener/requestAction";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { OpenCustomContextMenuOptions, ContextMenuBaseProps } from "~/contextMenu/contextMenuTypes";
import { useRefRect, useGetRefRectFn } from "~/hook/useRefRect";
import {
	NODE_EDITOR_NODE_H_PADDING,
	DEFAULT_CONTEXT_MENU_WIDTH,
	CONTEXT_MENU_OPTION_HEIGHT,
	CONTEXT_MENU_OPTION_PADDING_LEFT,
} from "~/constants";
import { NODE_HEIGHT_CONSTANTS } from "~/nodeEditor/util/calculateNodeHeight";

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
		width: calc(100% - ${NODE_EDITOR_NODE_H_PADDING * 2}px);
		margin: 0 ${NODE_EDITOR_NODE_H_PADDING};
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

interface PropertyProps {
	selectedPropertyId: string;
	propertyId: string;
	onSelectProperty: (propertyId: string) => void;
	properties: CompositionState["properties"];
	depth: number;
}

const Property: React.FC<PropertyProps> = (props) => {
	const { depth, properties, propertyId, selectedPropertyId } = props;

	const property = properties[propertyId];
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
						properties={properties}
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

interface LayerProps {
	selectedLayerId: string;
	layerId: string;
	onSelectLayer: (layerId: string) => void;
	layers: CompositionState["layers"];
}

const Layer: React.FC<LayerProps> = (props) => {
	const { layerId, layers, onSelectLayer, selectedLayerId } = props;

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
				<div className={s("name")}>{layers[layerId].name}</div>
			</div>
		</div>
	);
};

interface OwnProps {
	layerId: string;
	selectedPropertyId: string;
	onSelectProperty: (propertyId: string) => void;
	selectedLayerId?: string;
	onSelectLayer?: (layerId: string) => void;
}
interface StateProps {
	layers: CompositionState["layers"];
	properties: CompositionState["properties"];
	propertyIds: string[];
}
type Props = OwnProps & StateProps;

const PropertyNodeSelectPropertyComponent: React.FC<Props> = (props) => {
	const selectPropertyRef = useRef<HTMLButtonElement>(null);
	const selectLayerRef = useRef<HTMLButtonElement>(null);

	const getSelectPropertyRect = useGetRefRectFn(selectPropertyRef);
	const getSelectLayerRect = useGetRefRectFn(selectLayerRef);

	const selectedProperty = props.properties[props.selectedPropertyId];
	const selectedLayer = props.layers[props.selectedLayerId || ""];

	const openLayerContextMenu = () => {
		requestAction({ history: false }, (params) => {
			const onSelectLayer = (layerId: string) => {
				params.cancelAction();
				props.onSelectLayer!(layerId);
			};

			const compositionState = getActionState().compositions;
			const layer = compositionState.layers[props.layerId];
			const composition = compositionState.compositions[layer.compositionId];
			const layerIds = composition.layers;

			const Component: React.FC<ContextMenuBaseProps> = ({ updateRect }) => {
				const ref = useRef(null);
				const rect = useRefRect(ref);

				useEffect(() => {
					updateRect(rect!);
				}, [rect]);

				return (
					<div className={s("dropdownContainer")} ref={ref}>
						{layerIds.map((layerId) => (
							<Layer
								layers={props.layers}
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
						{props.propertyIds.map((propertyId) => (
							<Property
								selectedPropertyId={props.selectedPropertyId}
								properties={props.properties}
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

	return (
		<>
			{typeof props.onSelectLayer === "function" && (
				<div className={s("wrapper")}>
					<button
						className={s("select")}
						onClick={openLayerContextMenu}
						onMouseDown={(e) => {
							e.stopPropagation();
							e.preventDefault();
						}}
						ref={selectLayerRef}
					>
						{selectedLayer ? selectedLayer.name : "No layer selected"}
					</button>
				</div>
			)}
			{(typeof props.onSelectLayer === "function" ? props.selectedLayerId : true) && (
				<div className={s("wrapper")}>
					<button
						className={s("select")}
						onClick={openPropertyContextMenu}
						onMouseDown={(e) => {
							e.stopPropagation();
							e.preventDefault();
						}}
						ref={selectPropertyRef}
					>
						{selectedProperty
							? selectedProperty.type === "property"
								? getLayerPropertyLabel(selectedProperty.name)
								: getLayerPropertyGroupLabel(selectedProperty.name)
							: "Not selected"}
					</button>
				</div>
			)}
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositions },
	{ selectedLayerId, layerId },
) => ({
	layers: compositions.layers,
	properties: compositions.properties,

	// `selectedLayerId` is undefined for `property_output` but a string (empty or
	// not) for `property_input`.
	propertyIds: compositions.layers[selectedLayerId ?? layerId]?.properties || [],
});

export const PropertyNodeSelectProperty = connectActionState(mapState)(
	PropertyNodeSelectPropertyComponent,
);
