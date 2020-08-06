import React from "react";
import { CompositionState } from "~/composition/state/compositionReducer";
import { getLayerArrayModifierCountPropertyId } from "~/composition/util/compositionPropertyUtils";
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
	compositionState: CompositionState;
}
type Props = OwnProps & StateProps;

const CompWorkspaceCompChildrenComponent: React.FC<Props> = (props) => {
	const { layerIds: _layerIds, layerTypes: _layerTypes } = props;

	const layerTypes = [..._layerTypes].reverse();
	const layerIds = [..._layerIds].reverse();
	const layers: React.ReactNode[] = [];

	const getLayerContent = (i: number) => {
		const layerId = layerIds[i];

		let count = 1;

		const countId = getLayerArrayModifierCountPropertyId(layerId, props.compositionState);
		if (countId) {
			count = props.map.properties[countId].rawValue;
		}

		const children: React.ReactNode[] = [];

		for (let j = 0; j < count; j += 1) {
			if (layerTypes[i] === LayerType.Composition) {
				children.push(
					<CompWorkspaceCompLayer
						key={layerId + ":" + j}
						compositionId={props.compositionId}
						layerId={layerId}
						map={props.map}
						index={j}
					/>,
				);
				continue;
			}

			if (layerTypes[i] === LayerType.Ellipse) {
				children.push(
					<CompWorkspaceEllipseLayer
						key={layerId + ":" + j}
						compositionId={props.compositionId}
						layerId={layerId}
						map={props.map}
						index={j}
					/>,
				);
				continue;
			}

			children.push(
				<CompWorkspaceRectLayer
					key={layerId + ":" + j}
					compositionId={props.compositionId}
					layerId={layerId}
					map={props.map}
					index={j}
				/>,
			);
			continue;
		}

		return <g key={layerId}>{children}</g>;
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
						index={0}
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
		compositionState,
	};
};

export const CompWorkspaceCompChildren = connectActionState(mapState)(
	CompWorkspaceCompChildrenComponent,
);
