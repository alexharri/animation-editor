import React, { useRef } from "react";
import { TIMELINE_LAYER_HEIGHT } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { useMemoActionState } from "~/hook/useActionState";
import { connectActionState } from "~/state/stateUtils";
import { TimelinePropertyStoreProvider } from "~/timeline/context/TimelineValueContext";
import { TimelineLayer } from "~/timeline/layer/TimelineLayer";
import { getTimelineTrackYPositions } from "~/trackEditor/trackEditorUtils";
import { hexToRGBAString } from "~/util/color/convertColor";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	layerWrapper: css`
		flex-grow: 1;
		overflow: hidden;
		position: relative;
	`,

	previewBar: css`
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: ${cssVariables.primary700};
		box-shadow: 0 0 8px 3px ${hexToRGBAString(cssVariables.primary500, 0.5)};
		pointer-events: none;
	`,
}));

interface OwnProps {
	compositionId: string;
	panY: number;
	moveLayers: {
		type: "above" | "below" | "invalid";
		layerId: string;
	} | null;
}
interface StateProps {
	layerIds: string[];
}
type Props = OwnProps & StateProps;

const TimelineLayerListComponent: React.FC<Props> = (props) => {
	const { layerIds, compositionId, panY, moveLayers } = props;

	const layerWrapper = useRef<HTMLDivElement>(null);

	const previewY = useMemoActionState(
		({ compositionState }) => {
			if (!moveLayers || moveLayers.type === "invalid") {
				return null;
			}

			const { layerId, type } = moveLayers;
			const yPosMap = getTimelineTrackYPositions(compositionId, compositionState, panY);

			if (!layerId) {
				return 0;
			}

			if (type === "above") {
				return yPosMap.layer[layerId];
			}

			const layer = compositionState.layers[layerId];

			let { collapsed, properties } = layer;

			if (layer.viewProperties.length) {
				collapsed = false;
				properties = layer.viewProperties;
			}

			if (collapsed) {
				return yPosMap.layer[layerId] + TIMELINE_LAYER_HEIGHT;
			}

			// Find last property
			function crawl(propertyId: string): number {
				const property = compositionState.properties[propertyId];

				if (property.type === "property") {
					return yPosMap.property[property.id] + TIMELINE_LAYER_HEIGHT;
				}

				if (property.type === "compound") {
					if (property.separated) {
						return (
							yPosMap.property[property.properties[property.properties.length - 1]] +
							TIMELINE_LAYER_HEIGHT
						);
					}

					return yPosMap.property[property.id] + TIMELINE_LAYER_HEIGHT;
				}

				let { collapsed, properties } = property;

				if (property.viewProperties.length) {
					properties = property.viewProperties;
					collapsed = false;
				}

				if (collapsed) {
					return yPosMap.property[property.id] + TIMELINE_LAYER_HEIGHT;
				}

				return crawl(properties[properties.length - 1]);
			}

			const value = crawl(properties[properties.length - 1]);
			return value;
		},
		[moveLayers?.layerId, moveLayers?.type],
	);

	return (
		<TimelinePropertyStoreProvider compositionId={compositionId}>
			<div
				className={s("layerWrapper")}
				ref={layerWrapper}
				data-ct-composition-id={compositionId}
			>
				<div style={{ transform: `translateY(${-panY}px)` }}>
					{layerIds.map((layerId) => {
						return (
							<TimelineLayer
								compositionId={props.compositionId}
								id={layerId}
								key={layerId}
								layerWrapper={layerWrapper}
							/>
						);
					})}
				</div>
				{typeof previewY === "number" && !isNaN(previewY) && (
					<div className={s("previewBar")} style={{ top: previewY }} />
				)}
			</div>
		</TimelinePropertyStoreProvider>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState },
	{ compositionId },
) => {
	const { layers: layerIds } = compositionState.compositions[compositionId];
	return {
		layerIds,
	};
};

export const TimelineLayerList = connectActionState(mapState)(TimelineLayerListComponent);
