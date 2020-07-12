import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { CompositionLayer } from "~/composition/compositionTypes";
import styles from "~/composition/timeline/layer/CompTimeLayer.style";
import { CompTimeLayerProperty } from "~/composition/timeline/property/CompTimeProperty";
import { CompTimeLayerName } from "~/composition/timeline/layer/CompTimeLayerName";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { GraphIcon } from "~/components/icons/GraphIcon";
import { OpenInAreaIcon } from "~/components/icons/OpenInAreaIcon";
import { CompTimeLayerPropertyToValue } from "~/composition/timeline/layer/CompTimeLayerPropertyToValue";

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
		<>
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
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositions, compositionSelection },
	{ id },
) => {
	const layer = compositions.layers[id];
	return {
		layer,
		isSelected: !!compositionSelection.layers[id],
	};
};

export const CompTimeLayer = connectActionState(mapStateToProps)(CompTimeLayerComponent);
