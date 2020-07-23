import React from "react";
import { GraphIcon } from "~/components/icons/GraphIcon";
import { OpenInAreaIcon } from "~/components/icons/OpenInAreaIcon";
import { CompositionLayer } from "~/composition/compositionTypes";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import styles from "~/composition/timeline/layer/CompTimeLayer.style";
import { CompTimeLayerName } from "~/composition/timeline/layer/CompTimeLayerName";
import { CompTimeLayerPropertyToValue } from "~/composition/timeline/layer/CompTimeLayerPropertyToValue";
import { CompTimeLayerProperty } from "~/composition/timeline/property/CompTimeProperty";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	id: string;
	compositionId: string;
}
interface StateProps {
	layer: CompositionLayer;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompTimeLayerComponent: React.FC<Props> = (props) => {
	const { layer } = props;

	return (
		<div data-ct-layer-id={props.id}>
			<div
				className={s("container")}
				onMouseDown={separateLeftRightMouse({
					right: (e) => compTimeHandlers.onLayerRightClick(e, layer),
				})}
			>
				<CompTimeLayerName layerId={props.id} />
				<div
					title={layer.graphId ? "Delete Layer Graph" : "Create Layer Graph"}
					className={s("graph", { active: !!layer.graphId })}
					onMouseDown={separateLeftRightMouse({
						left: (e) => compTimeHandlers.onLayerGraphMouseDown(e, layer.id),
					})}
				>
					<GraphIcon />
				</div>
				{!!layer.graphId && (
					<div
						title="Open Graph in area"
						className={s("openGraphInArea", { active: true })}
						onMouseDown={separateLeftRightMouse({
							left: (e) => compTimeHandlers.onOpenGraphInAreaMouseDown(e, layer.id),
						})}
					>
						<OpenInAreaIcon />
					</div>
				)}
			</div>
			<CompTimeLayerPropertyToValue
				compositionId={layer.compositionId}
				layerId={layer.id}
				graphId={layer.graphId}
			>
				{layer.properties.map((id) => (
					<CompTimeLayerProperty
						compositionId={props.compositionId}
						id={id}
						key={id}
						depth={0}
					/>
				))}
			</CompTimeLayerPropertyToValue>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositionState, compositionSelectionState },
	{ id },
) => {
	const layer = compositionState.layers[id];
	const compositionSelection = getCompSelectionFromState(
		layer.compositionId,
		compositionSelectionState,
	);
	return {
		layer,
		isSelected: !!compositionSelection.layers[id],
	};
};

export const CompTimeLayer = connectActionState(mapStateToProps)(CompTimeLayerComponent);
