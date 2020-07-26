import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { useWorkspaceLayerShouldRender } from "~/composition/workspace/useWorkspaceLayerShouldRender";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { connectActionState } from "~/state/stateUtils";
import { rotateVec2CCW } from "~/util/math";
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
	compWidth: number;
	compHeight: number;
}
interface StateProps {
	layer: CompositionLayer;
	graph?: NodeEditorGraphState;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompWorkspaceRectLayerComponent: React.FC<Props> = (props) => {
	const { layer, compWidth, compHeight } = props;

	const nameToProperty = useLayerNameToProperty(props.compositionId, layer.id);
	const shouldRender = useWorkspaceLayerShouldRender(layer);

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

	let i = Vec2.new(1, 0);
	let j = Vec2.new(0, 1);

	const rRad = Rotation;

	// Apply rotation
	i = i.apply((vec) => rotateVec2CCW(vec, rRad));
	j = j.apply((vec) => rotateVec2CCW(vec, rRad));

	// Apply scale
	i = i.scale(Scale);
	j = j.scale(Scale);

	const transformStyle = `matrix(${i.x}, ${i.y}, ${j.x}, ${j.y}, ${PositionX - AnchorX}, ${
		PositionY - AnchorY
	})`;

	return (
		<>
			<svg
				width={compWidth}
				height={compHeight}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					transform: transformStyle,
					transformOrigin: `${AnchorX}px ${AnchorY}px`,
					overflow: "visible",
				}}
			>
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
					}}
				/>
			</svg>
			<svg
				width={compWidth}
				height={compHeight}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					overflow: "visible",
				}}
			>
				<ellipse
					cx={PositionX}
					cy={PositionY}
					rx={5}
					ry={5}
					style={{
						fill: "cyan",
					}}
				/>
			</svg>
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
