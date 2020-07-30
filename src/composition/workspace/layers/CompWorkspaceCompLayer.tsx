import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { CompWorkspaceCompChildren } from "~/composition/workspace/layers/CompWorkspaceCompChildren";
import { getLayerTransformStyle } from "~/composition/workspace/layers/layerTransformStyle";
import { useWorkspaceLayerShouldRender } from "~/composition/workspace/useWorkspaceLayerShouldRender";
import { connectActionState } from "~/state/stateUtils";
import { AffineTransform } from "~/types";

export const AdditionalTransformContext = React.createContext<AffineTransform[]>([]);

interface OwnProps {
	compositionId: string;
	layerId: string;
	frameIndex: number;
}
interface StateProps {
	compositionReferenceId: string;
	layer: CompositionLayer;
}
type Props = OwnProps & StateProps;

const CompWorkspaceCompLayerComponent: React.FC<Props> = (props) => {
	const nameToProperty = useLayerNameToProperty(props.compositionId, props.layerId);
	const shouldRender = useWorkspaceLayerShouldRender(props.layer, props.frameIndex);

	if (!shouldRender) {
		return null;
	}

	const { PositionX, PositionY, Scale, Opacity, Rotation, AnchorX, AnchorY } = nameToProperty;

	const transformStyle = getLayerTransformStyle(
		PositionX,
		PositionY,
		AnchorX,
		AnchorY,
		Rotation,
		Scale,
	);

	return (
		<>
			<g
				data-layer-id={props.layerId}
				style={{
					opacity: Opacity,
					...transformStyle,
				}}
			>
				<CompWorkspaceCompChildren
					compositionId={props.compositionReferenceId}
					frameIndex={props.frameIndex}
					containerWidth={nameToProperty.Width}
					containerHeight={nameToProperty.Height}
				/>
			</g>
			<ellipse
				cx={PositionX}
				cy={PositionY}
				rx={5}
				ry={5}
				style={{
					fill: "cyan",
				}}
			/>
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({ compositionState }, { layerId }) => {
	return {
		compositionReferenceId: compositionState.compositionLayerIdToComposition[layerId],
		layer: compositionState.layers[layerId],
	};
};

export const CompWorkspaceCompLayer = connectActionState(mapState)(CompWorkspaceCompLayerComponent);
