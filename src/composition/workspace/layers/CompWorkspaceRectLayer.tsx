import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { applyIndexTransform } from "~/composition/transformUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { CompWorkspaceLayerBaseProps } from "~/composition/workspace/compWorkspaceTypes";
import { getLayerTransformStyle } from "~/composition/workspace/layers/layerTransformStyle";
import { useWorkspaceLayerShouldRender } from "~/composition/workspace/useWorkspaceLayerShouldRender";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";

const styles = ({ css }: StyleParams) => ({
	element: css`
		background: red;
		position: absolute;
	`,
});

const s = compileStylesheetLabelled(styles);

type OwnProps = CompWorkspaceLayerBaseProps;
interface StateProps {
	layer: CompositionLayer;
	graph?: NodeEditorGraphState;
	selected: boolean;
}
type Props = OwnProps & StateProps;

const CompWorkspaceRectLayerComponent: React.FC<Props> = (props) => {
	const { layer, map } = props;

	const nameToProperty = useLayerNameToProperty(map, props.compositionId, layer.id, props.index);
	const shouldRender = useWorkspaceLayerShouldRender(map.frameIndex, layer.index, layer.length);

	if (!shouldRender) {
		return null;
	}

	const { Width, Height, Opacity, Fill, StrokeWidth, StrokeColor, BorderRadius } = nameToProperty;

	const fillColor = `rgba(${Fill.join(",")})`;
	const strokeColor = `rgba(${StrokeColor.join(",")})`;

	let transform = map.transforms[props.layerId].transform[props.index];
	let { indexTransform } = map.transforms[props.layerId];

	if (indexTransform) {
		transform = applyIndexTransform(transform, indexTransform, props.index);
	}

	const transformStyle = getLayerTransformStyle(transform);

	return (
		<>
			<rect
				data-layer-id={layer.id}
				width={Width}
				height={Height}
				rx={BorderRadius}
				className={s("element")}
				style={{
					left: 0,
					top: 0,
					opacity: Opacity,
					fill: fillColor,
					strokeWidth: StrokeWidth,
					stroke: strokeColor,
					...transformStyle,
				}}
			/>
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor, compositionState, compositionSelectionState },
	{ layerId },
) => {
	const layer = compositionState.layers[layerId];
	const selection = getCompSelectionFromState(layer.compositionId, compositionSelectionState);
	return {
		layer,
		graph: layer.graphId ? nodeEditor.graphs[layer.graphId] : undefined,
		selected: !!selection.layers[layerId],
	};
};

export const CompWorkspaceRectLayer = connectActionState(mapState)(CompWorkspaceRectLayerComponent);
