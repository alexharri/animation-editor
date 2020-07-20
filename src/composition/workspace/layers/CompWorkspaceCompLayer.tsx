import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { CompWorkspaceCompChildren } from "~/composition/workspace/layers/CompWorkspaceCompChildren";
import { useWorkspaceLayerShouldRender } from "~/composition/workspace/useWorkspaceLayerShouldRender";
import { connectActionState } from "~/state/stateUtils";

interface OwnProps {
	compositionId: string;
	layerId: string;
}
interface StateProps {
	compositionReferenceId: string;
	layer: CompositionLayer;
}
type Props = OwnProps & StateProps;

const CompWorkspaceCompLayerComponent: React.FC<Props> = (props) => {
	const nameToProperty = useLayerNameToProperty(props.compositionId, props.layerId);
	const shouldRender = useWorkspaceLayerShouldRender(props.layer);

	if (!shouldRender) {
		return null;
	}

	const { PositionX, PositionY, Scale, Opacity, Rotation, Width, Height } = nameToProperty;

	return (
		<g
			data-layer-id={props.layerId}
			style={{
				transform: `translate(${PositionX}px, ${PositionY}px)`,
			}}
		>
			<g
				style={{
					transform: `scale(${Scale}) rotate(${Rotation}deg)`,
					transformOrigin: `${Width / 2}px ${Height / 2}px`,
				}}
			>
				<svg
					x={0}
					y={0}
					width={Width}
					height={Height}
					style={{
						opacity: Opacity,
					}}
				>
					<CompWorkspaceCompChildren compositionId={props.compositionReferenceId} />
				</svg>
			</g>
		</g>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({ compositions }, { layerId }) => {
	return {
		compositionReferenceId: compositions.compositionLayerIdToComposition[layerId],
		layer: compositions.layers[layerId],
	};
};

export const CompWorkspaceCompLayer = connectActionState(mapState)(CompWorkspaceCompLayerComponent);
