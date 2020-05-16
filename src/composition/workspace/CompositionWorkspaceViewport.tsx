import React from "react";
import { useActionState } from "~/hook/useActionState";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";
import { CompositionWorkspaceLayer } from "~/composition/workspace/CompositionWorkspaceLayer";

const styles = ({ css }: StyleParams) => ({
	container: css`
		background: ${cssVariables.gray800};
		transform: translate(-50%, -50%);
	`,
});

const s = compileStylesheetLabelled(styles);

interface Props {
	compositionId: string;
}

export const CompositionWorkspaceViewport: React.FC<Props> = (props) => {
	const composition = useActionState(
		(state) => state.compositions.compositions[props.compositionId],
	);

	const layerIds = composition.layers;

	return (
		<div
			className={s("container")}
			style={{ width: composition.width, height: composition.height }}
		>
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
