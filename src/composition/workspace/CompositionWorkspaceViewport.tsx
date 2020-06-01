import React from "react";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";
import { CompositionWorkspaceLayer } from "~/composition/workspace/CompositionWorkspaceLayer";
import { connectActionState } from "~/state/stateUtils";

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
}
type Props = OwnProps & StateProps;

const CompositionWorkspaceViewportComponent: React.FC<Props> = (props) => {
	const { width, height, layerIds } = props;

	return (
		<div className={s("container")} style={{ width, height }}>
			{layerIds.map((id) => (
				<CompositionWorkspaceLayer
					key={id}
					compositionId={props.compositionId}
					layerId={id}
				/>
			))}
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({ compositions }, { compositionId }) => {
	const { width, height, layers } = compositions.compositions[compositionId];
	return {
		width,
		height,
		layerIds: layers,
	};
};

export const CompositionWorkspaceViewport = connectActionState(mapState)(
	CompositionWorkspaceViewportComponent,
);
