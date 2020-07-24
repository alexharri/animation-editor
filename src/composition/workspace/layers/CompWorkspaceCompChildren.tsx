import React from "react";
import { CompWorkspaceCompLayer } from "~/composition/workspace/layers/CompWorkspaceCompLayer";
import { CompWorkspaceEllipseLayer } from "~/composition/workspace/layers/CompWorkspaceEllipseLayer";
import { CompWorkspaceRectLayer } from "~/composition/workspace/layers/CompWorkspaceRectLayer";
import { useComputeHistory } from "~/hook/useComputeHistory";
import { LayerType } from "~/types";

interface OwnProps {
	compositionId: string;
	frameIndex?: number;
}
type Props = OwnProps;

export const CompWorkspaceCompChildren: React.FC<Props> = (props) => {
	const { layerIds, layerTypes } = useComputeHistory((state) => {
		const { compositionState } = state;
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
					<CompWorkspaceRectLayer
						key={id}
						compositionId={props.compositionId}
						layerId={id}
					/>
				);
			})}
		</>
	);
};
