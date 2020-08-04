import React from "react";
import { GraphIcon } from "~/components/icons/GraphIcon";
import { OpenInAreaIcon } from "~/components/icons/OpenInAreaIcon";
import { CompositionLayer } from "~/composition/compositionTypes";
import { compositionActions } from "~/composition/state/compositionReducer";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import styles from "~/composition/timeline/layer/CompTimeLayer.style";
import { CompTimeLayerName } from "~/composition/timeline/layer/CompTimeLayerName";
import { CompTimeLayerParent } from "~/composition/timeline/layer/CompTimeLayerParent";
import { CompTimeLayerProperty } from "~/composition/timeline/property/CompTimeProperty";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { requestAction } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	id: string;
	compositionId: string;
	layerWrapper: React.RefObject<HTMLDivElement>;
}
interface StateProps {
	layer: CompositionLayer;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompTimeLayerComponent: React.FC<Props> = (props) => {
	const {
		layer,
		layer: { collapsed },
	} = props;

	return (
		<div data-ct-layer-id={props.id} style={{ position: "relative" }}>
			<div
				className={s("container")}
				onMouseDown={separateLeftRightMouse({
					right: (e) => compTimeHandlers.onLayerRightClick(e, layer),
				})}
			>
				<div
					className={s("collapsedArrow", { open: !collapsed })}
					onMouseDown={(e) => e.stopPropagation()}
					onClick={() => {
						requestAction({ history: true }, (params) => {
							params.dispatch(
								compositionActions.setLayerCollapsed(layer.id, !collapsed),
							);
							params.submitAction("Toggle layer collapsed");
						});
					}}
				/>
				<CompTimeLayerName layerId={props.id} layerWrapper={props.layerWrapper} />
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
				<CompTimeLayerParent layerId={props.id} />
			</div>
			{!layer.collapsed && (
				<>
					{layer.properties.map((id) => (
						<CompTimeLayerProperty
							compositionId={props.compositionId}
							id={id}
							key={id}
							depth={0}
						/>
					))}
				</>
			)}
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
