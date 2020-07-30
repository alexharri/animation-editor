import React from "react";
import { CompWorkspaceCompLayer } from "~/composition/workspace/layers/CompWorkspaceCompLayer";
import { CompWorkspaceEllipseLayer } from "~/composition/workspace/layers/CompWorkspaceEllipseLayer";
import { CompWorkspaceRectLayer } from "~/composition/workspace/layers/CompWorkspaceRectLayer";
import { CompositionPropertyValuesProvider } from "~/shared/property/computeCompositionPropertyValues";
import { connectActionState } from "~/state/stateUtils";
import { LayerType } from "~/types";

interface OwnProps {
	compositionId: string;
	frameIndex: number;
	containerHeight: number;
	containerWidth: number;
}
interface StateProps {
	layerIds: string[];
	layerTypes: LayerType[];
}
type Props = OwnProps & StateProps;

const CompWorkspaceCompChildrenComponent: React.FC<Props> = (props) => {
	const { layerIds, layerTypes } = props;

	// const parentTransforms = useContext(AdditionalTransformContext);

	return (
		<CompositionPropertyValuesProvider
			compositionId={props.compositionId}
			frameIndex={props.frameIndex}
			containerWidth={props.containerWidth}
			containerHeight={props.containerHeight}
		>
			{layerIds.map((id, i) => {
				if (layerTypes[i] === LayerType.Composition) {
					return (
						<CompWorkspaceCompLayer
							key={id}
							compositionId={props.compositionId}
							layerId={id}
							frameIndex={props.frameIndex}
						/>
					);
				}

				if (layerTypes[i] === LayerType.Ellipse) {
					return (
						<CompWorkspaceEllipseLayer
							key={id}
							compositionId={props.compositionId}
							layerId={id}
							frameIndex={props.frameIndex}
						/>
					);
				}

				return (
					<CompWorkspaceRectLayer
						key={id}
						compositionId={props.compositionId}
						layerId={id}
						frameIndex={props.frameIndex}
					/>
				);
			})}
		</CompositionPropertyValuesProvider>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState },
	{ compositionId },
) => {
	const { layers } = compositionState.compositions[compositionId];
	return {
		layerIds: layers,
		layerTypes: layers.map((id) => compositionState.layers[id].type),
	};
};

export const CompWorkspaceCompChildren = connectActionState(mapState)(
	CompWorkspaceCompChildrenComponent,
);
