import React from "react";
import { CompWorkspaceCompLayer } from "~/composition/workspace/layers/CompWorkspaceCompLayer";
import { CompWorkspaceEllipseLayer } from "~/composition/workspace/layers/CompWorkspaceEllipseLayer";
import { CompWorkspaceLayerGuides } from "~/composition/workspace/layers/CompWorkspaceLayerGuides";
import { CompWorkspaceRectLayer } from "~/composition/workspace/layers/CompWorkspaceRectLayer";
import { connectActionState } from "~/state/stateUtils";
import { CompositionRenderValues, LayerType } from "~/types";

interface OwnProps {
	compositionId: string;
	containerHeight: number;
	containerWidth: number;
	map: CompositionRenderValues;
}
interface StateProps {
	layerIds: string[];
	layerTypes: LayerType[];
}
type Props = OwnProps & StateProps;

const CompWorkspaceCompChildrenComponent: React.FC<Props> = (props) => {
	const { layerIds: _layerIds, layerTypes: _layerTypes } = props;

	const layerTypes = [..._layerTypes].reverse();
	const layerIds = [..._layerIds].reverse();
	const layers: React.ReactNode[] = [];

	const getLayerContent = (i: number) => {
		const layerId = layerIds[i];

		if (layerTypes[i] === LayerType.Composition) {
			return (
				<CompWorkspaceCompLayer
					key={layerId}
					compositionId={props.compositionId}
					layerId={layerId}
					map={props.map}
				/>
			);
		}

		if (layerTypes[i] === LayerType.Ellipse) {
			return (
				<CompWorkspaceEllipseLayer
					key={layerId}
					compositionId={props.compositionId}
					layerId={layerId}
					map={props.map}
				/>
			);
		}

		return (
			<CompWorkspaceRectLayer
				key={layerId}
				compositionId={props.compositionId}
				layerId={layerId}
				map={props.map}
			/>
		);
	};

	for (let i = 0; i < layerIds.length; i += 1) {
		layers.push(getLayerContent(i));
	}

	return (
		<>
			{layers}
			{!props.map.parent &&
				layerIds.map((layerId) => (
					<CompWorkspaceLayerGuides
						key={layerId}
						compositionId={props.compositionId}
						layerId={layerId}
						map={props.map}
					/>
				))}
		</>
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
