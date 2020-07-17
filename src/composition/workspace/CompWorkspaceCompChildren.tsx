import React from "react";
import { CompositionWorkspaceLayer } from "~/composition/workspace/CompositionWorkspaceLayer";
import { LayerType } from "~/types";
import { CompWorkspaceEllipseLayer } from "~/composition/workspace/layers/CompWorkspaceEllipseLayer";
import { CompWorkspaceCompLayer } from "~/composition/workspace/layers/CompWorkspaceCompLayer";
import { useComputeHistory } from "~/hook/useComputeHistory";

interface OwnProps {
	compositionId: string;
	frameIndex?: number;
}
type Props = OwnProps;

export const CompWorkspaceCompChildren: React.FC<Props> = (props) => {
	const { layerIds, layerTypes } = useComputeHistory((state) => {
		const compositionState = state.compositions;
		const { layers } = compositionState.compositions[props.compositionId];
		return {
			layerIds: layers,
			layerTypes: layers.map((id) => compositionState.layers[id].type),
		};
	});

	return (
		<>
			{layerIds.map((id, i) => {
				if (layerTypes[i] === LayerType.Composition) {
					return (
						<CompWorkspaceCompLayer
							key={id}
							compositionId={props.compositionId}
							layerId={id}
						/>
					);
				}

				if (layerTypes[i] === LayerType.Ellipse) {
					return (
						<CompWorkspaceEllipseLayer
							key={id}
							compositionId={props.compositionId}
							layerId={id}
						/>
					);
				}

				return (
					<CompositionWorkspaceLayer
						key={id}
						compositionId={props.compositionId}
						layerId={id}
					/>
				);
			})}
		</>
	);
};
