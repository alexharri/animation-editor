import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { CompWorkspaceLayerBaseProps } from "~/composition/workspace/compWorkspaceTypes";
import { CompWorkspaceCompChildren } from "~/composition/workspace/layers/CompWorkspaceCompChildren";
import { useWorkspaceLayerShouldRender } from "~/composition/workspace/useWorkspaceLayerShouldRender";
import { connectActionState } from "~/state/stateUtils";
import { AffineTransform } from "~/types";

export const AdditionalTransformContext = React.createContext<AffineTransform[]>([]);

type OwnProps = CompWorkspaceLayerBaseProps;
interface StateProps {
	compositionReferenceId: string;
	layer: CompositionLayer;
	selected: boolean;
}
type Props = OwnProps & StateProps;

const CompWorkspaceCompLayerComponent: React.FC<Props> = (props) => {
	const { layer, map } = props;

	const nameToProperty = useLayerNameToProperty(map, props.compositionId, layer.id);
	const shouldRender = useWorkspaceLayerShouldRender(map.frameIndex, layer.index, layer.length);

	if (!shouldRender) {
		return null;
	}

	const { Opacity } = nameToProperty;

	return (
		<>
			<g data-layer-id={props.layerId} style={{ opacity: Opacity }}>
				<CompWorkspaceCompChildren
					compositionId={props.compositionReferenceId}
					containerWidth={nameToProperty.Width}
					containerHeight={nameToProperty.Height}
					map={map.compositionLayers[props.layerId]}
				/>
			</g>
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState, compositionSelectionState },
	{ layerId },
) => {
	const layer = compositionState.layers[layerId];
	const selection = getCompSelectionFromState(layer.compositionId, compositionSelectionState);
	return {
		compositionReferenceId: compositionState.compositionLayerIdToComposition[layerId],
		layer,
		selected: !!selection.layers[layerId],
	};
};

export const CompWorkspaceCompLayer = connectActionState(mapState)(CompWorkspaceCompLayerComponent);
