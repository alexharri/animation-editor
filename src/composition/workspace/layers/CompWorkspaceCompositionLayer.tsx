import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { CompWorkspaceCompChildren } from "~/composition/workspace/CompWorkspaceCompChildren";

interface OwnProps {
	compositionId: string;
	layerId: string;
}
interface StateProps {
	compositionReferenceId: string;
}
type Props = OwnProps & StateProps;

const CompWorkspaceCompositionLayerComponent: React.FC<Props> = (props) => {
	const nameToProperty = useLayerNameToProperty(props.compositionId, props.layerId);

	const { PositionX, PositionY, Scale, Opacity, Rotation, Width, Height } = nameToProperty;

	return (
		<g
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
	};
};

export const CompWorkspaceCompositionLayer = connectActionState(mapState)(
	CompWorkspaceCompositionLayerComponent,
);
