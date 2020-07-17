import React from "react";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";
import { CompositionWorkspaceLayer } from "~/composition/workspace/CompositionWorkspaceLayer";
import { connectActionState } from "~/state/stateUtils";
import { LayerType } from "~/types";
import { CompWorkspaceEllipseLayer } from "~/composition/workspace/layers/CompWorkspaceEllipseLayer";
import { CompWorkspaceCompLayer } from "~/composition/workspace/layers/CompWorkspaceCompLayer";

const styles = ({ css }: StyleParams) => ({
	container: css`
		background: ${cssVariables.gray800};
		transform: translate(-50%, -50%);
	`,
});

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	compositionId: string;
	width: number;
	height: number;
	top: number;
	left: number;
}
interface StateProps {
	layerIds: string[];
	layerTypes: LayerType[];
}
type Props = OwnProps & StateProps;

const CompositionWorkspaceViewportComponent: React.FC<Props> = (props) => {
	const { top, left, width, height, layerIds, layerTypes } = props;

	return (
		<svg
			className={s("container")}
			width={width}
			height={height}
			x={left}
			y={top}
			style={{ transform: `translate(${left}px, ${top}px)` }}
		>
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
		</svg>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({ compositions }, { compositionId }) => {
	const { layers } = compositions.compositions[compositionId];
	return {
		layerIds: layers,
		layerTypes: layers.map((id) => compositions.layers[id].type),
	};
};

export const CompositionWorkspaceViewport = connectActionState(mapState)(
	CompositionWorkspaceViewportComponent,
);
