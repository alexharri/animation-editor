import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
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

interface OwnProps {
	compositionId: string;
	layerId: string;
	frameIndex: number;
}
interface StateProps {
	layer: CompositionLayer;
	graph?: NodeEditorGraphState;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompWorkspaceRectLayerComponent: React.FC<Props> = (props) => {
	const { layer } = props;

	const nameToProperty = useLayerNameToProperty(props.compositionId, layer.id);
	const shouldRender = useWorkspaceLayerShouldRender(layer, props.frameIndex);

	if (!shouldRender) {
		return null;
	}

	const {
		AnchorX,
		AnchorY,
		Width,
		Height,
		PositionX,
		PositionY,
		Scale,
		Opacity,
		Rotation,
		Fill,
		StrokeWidth,
		StrokeColor,
		BorderRadius,
	} = nameToProperty;

	const fillColor = `rgba(${Fill.join(",")})`;
	const strokeColor = `rgba(${StrokeColor.join(",")})`;

	const transformStyle = getLayerTransformStyle(
		PositionX,
		PositionY,
		AnchorX,
		AnchorY,
		Rotation,
		Scale,
	);

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
			<ellipse cx={PositionX} cy={PositionY} rx={5} ry={5} style={{ fill: "cyan" }} />
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
		isSelected: !!selection.layers[layerId],
	};
};

export const CompWorkspaceRectLayer = connectActionState(mapState)(CompWorkspaceRectLayerComponent);
