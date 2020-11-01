import React from "react";
import { GraphIcon } from "~/components/icons/GraphIcon";
import { OpenInAreaIcon } from "~/components/icons/OpenInAreaIcon";
import { compositionActions } from "~/composition/compositionReducer";
import { Layer } from "~/composition/compositionTypes";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
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
	layer: Layer;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const TimelineLayerComponent: React.FC<Props> = (props) => {
	const { layer } = props;

	const { viewProperties } = layer;
	let { collapsed, properties } = layer;

	if (viewProperties.length) {
		collapsed = false;
		properties = viewProperties;
	}

	const toggleCollapsed = () => {
		requestAction({ history: true }, (params) => {
			params.dispatch(compositionActions.setLayerCollapsed(layer.id, !collapsed));
			params.submitAction("Toggle layer collapsed");
		});
	};

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
					onClick={toggleCollapsed}
				/>
				<TimelineLayerName layerId={props.id} layerWrapper={props.layerWrapper} />
				<div className={s("graphWrapper")}>
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
				</div>
				<TimelineLayerParent layerId={props.id} />
			</div>
			{!collapsed && (
				<>
					{properties.map((id) => (
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
	const compositionSelection = compSelectionFromState(
		layer.compositionId,
		compositionSelectionState,
	);

	return {
		layer,
		isSelected: !!compositionSelection.layers[id],
	};
};

export const TimelineLayer = connectActionState(mapStateToProps)(TimelineLayerComponent);
