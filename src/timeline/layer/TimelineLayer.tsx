import React from "react";
import { GraphIcon } from "~/components/icons/GraphIcon";
import { OpenInAreaIcon } from "~/components/icons/OpenInAreaIcon";
import { compositionActions } from "~/composition/compositionReducer";
import { CompositionLayer } from "~/composition/compositionTypes";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { requestAction } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import styles from "~/timeline/layer/TimelineLayer.style";
import { TimelineLayerName } from "~/timeline/layer/TimelineLayerName";
import { TimelineLayerParent } from "~/timeline/layer/TimelineLayerParent";
import { TimelineLayerProperty } from "~/timeline/property/TimelineProperty";
import { timelineHandlers } from "~/timeline/timelineHandlers";
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

const TimelineLayerComponent: React.FC<Props> = (props) => {
	const {
		layer,
		layer: { collapsed },
	} = props;

	return (
		<div data-ct-layer-id={props.id} style={{ position: "relative" }}>
			<div
				className={s("container")}
				onMouseDown={separateLeftRightMouse({
					right: (e) => timelineHandlers.onLayerRightClick(e, layer),
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
				<TimelineLayerName layerId={props.id} layerWrapper={props.layerWrapper} />
				<div
					title={layer.graphId ? "Delete Layer Graph" : "Create Layer Graph"}
					className={s("graph", { active: !!layer.graphId })}
					onMouseDown={separateLeftRightMouse({
						left: (e) => timelineHandlers.onLayerGraphMouseDown(e, layer.id),
					})}
				>
					<GraphIcon />
				</div>
				{!!layer.graphId && (
					<div
						title="Open Graph in area"
						className={s("openGraphInArea", { active: true })}
						onMouseDown={separateLeftRightMouse({
							left: (e) =>
								timelineHandlers.onOpenGraphInAreaMouseDown(e, layer.graphId),
						})}
					>
						<OpenInAreaIcon />
					</div>
				)}
				<TimelineLayerParent layerId={props.id} />
			</div>
			{!layer.collapsed && (
				<>
					{layer.properties.map((id) => (
						<TimelineLayerProperty
							compositionId={props.compositionId}
							id={id}
							key={id}
							depth={0}
							canBeReordered={false}
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

export const TimelineLayer = connectActionState(mapStateToProps)(TimelineLayerComponent);
