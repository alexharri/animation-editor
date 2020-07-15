import React from "react";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";
import { CompositionWorkspaceLayer } from "~/composition/workspace/CompositionWorkspaceLayer";
import { connectActionState } from "~/state/stateUtils";
import { LayerType } from "~/types";
import { CompWorkspaceEllipseLayer } from "~/composition/workspace/layers/CompWorkspaceEllipseLayer";

const styles = ({ css }: StyleParams) => ({
	container: css`
		background: ${cssVariables.gray800};
		transform: translate(-50%, -50%);
	`,
});

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	compositionId: string;
}
interface StateProps {
	width: number;
	height: number;
	layerIds: string[];
	layerTypes: LayerType[];
}
type Props = OwnProps & StateProps;

const CompositionWorkspaceViewportComponent: React.FC<Props> = (props) => {
	const { width, height, layerIds, layerTypes } = props;

	return (
		<svg className={s("container")} width={width} height={height}>
			{layerIds.map((id, i) => {
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
		</svg>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({ compositions }, { compositionId }) => {
	const { width, height, layers } = compositions.compositions[compositionId];
	return {
		width,
		height,
		layerIds: layers,
		layerTypes: layers.map((id) => compositions.layers[id].type),
	};
};

export const CompositionWorkspaceViewport = connectActionState(mapState)(
	CompositionWorkspaceViewportComponent,
);
