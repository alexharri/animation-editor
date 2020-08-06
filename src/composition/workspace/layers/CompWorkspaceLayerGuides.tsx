import React, { useContext } from "react";
import { AreaIdContext } from "~/area/util/AreaIdContext";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { compWorkspaceHandlers } from "~/composition/workspace/compWorkspaceHandlers";
import { CompWorkspaceLayerBaseProps } from "~/composition/workspace/compWorkspaceTypes";
import { CompWorkspaceViewportContext } from "~/composition/workspace/CompWorkspaceViewportContext";
import { getLayerTransformStyle } from "~/composition/workspace/layers/layerTransformStyle";
import { useWorkspaceLayerShouldRender } from "~/composition/workspace/useWorkspaceLayerShouldRender";
import { connectActionState } from "~/state/stateUtils";
import { AffineTransform, LayerType } from "~/types";
import { rotateVec2CCW } from "~/util/math";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const color = "rgb(89 142 243)";

const s = compileStylesheetLabelled(({ css }) => ({
	interactionLayer: css`
		stroke: ${color};
		position: absolute;
		left: 0;
		top: 0;
		fill: transparent;
		opacity: 0;

		&:hover {
			opacity: 1;
		}
	`,
}));

export const AdditionalTransformContext = React.createContext<AffineTransform[]>([]);

interface GuideProps {
	positionX: number;
	positionY: number;
	anchorX: number;
	anchorY: number;
	rotation: number;
	scale: number;
	width: number;
	height: number;
	transform: AffineTransform;
}

const Guides: React.FC<GuideProps> = (props) => {
	const {
		positionX,
		positionY,
		anchorX,
		anchorY,
		rotation,
		scale,
		width,
		height,
		transform,
	} = props;

	const anchorShadowColor = "white";

	const W = 9 / scale;
	const R = 5 / scale;
	const S = 1.4 / scale;
	const A = 3 / scale;
	const SW = 1 / scale;
	const SOFF = 1 / scale;

	return (
		<>
			{[
				[0, 0],
				[0, 1],
				[1, 0],
				[1, 1],
			].map(([x, y], i) => {
				const pt = transform;
				const pos = Vec2.new(positionX + width * x, positionY + height * y)
					.sub(Vec2.new(anchorX, anchorY))
					.apply((pos) => rotateVec2CCW(pos, pt.rotation, pt.translate))
					.scale(pt.scale, pt.translate)
					.sub(Vec2.new(W / 2, W / 2));

				return (
					<g key={i}>
						<rect
							width={W}
							height={W}
							x={pos.x + SOFF}
							y={pos.y + SOFF}
							style={{ fill: "black" }}
						/>
						<rect width={W} height={W} x={pos.x} y={pos.y} style={{ fill: color }} />
					</g>
				);
			})}
			<ellipse
				cx={positionX}
				cy={positionY}
				rx={R}
				ry={R}
				style={{ stroke: anchorShadowColor, strokeWidth: S + SW * 2, fill: "transparent" }}
			/>
			<g
				style={{
					transformOrigin: `${positionX}px ${positionY}px`,
					transform: `rotate(${rotation}rad)`,
				}}
			>
				<line
					y1={positionY - R}
					y2={positionY - (R + A + SW)}
					x1={positionX}
					x2={positionX}
					stroke={anchorShadowColor}
					strokeWidth={S + SW * 2}
				/>
				<line
					y1={positionY + R}
					y2={positionY + (R + A + SW)}
					x1={positionX}
					x2={positionX}
					stroke={anchorShadowColor}
					strokeWidth={S + SW * 2}
				/>
				<line
					y1={positionY}
					y2={positionY}
					x1={positionX - R}
					x2={positionX - (R + A + SW)}
					stroke={anchorShadowColor}
					strokeWidth={S + SW * 2}
				/>
				<line
					y1={positionY}
					y2={positionY}
					x1={positionX + R}
					x2={positionX + (R + A + SW)}
					stroke={anchorShadowColor}
					strokeWidth={S + SW * 2}
				/>
				<line
					y1={positionY - R}
					y2={positionY - (R + A)}
					x1={positionX}
					x2={positionX}
					stroke={color}
					strokeWidth={S}
				/>
				<line
					y1={positionY + R}
					y2={positionY + (R + A)}
					x1={positionX}
					x2={positionX}
					stroke={color}
					strokeWidth={S}
				/>
				<line
					y1={positionY}
					y2={positionY}
					x1={positionX - R}
					x2={positionX - (R + A)}
					stroke={color}
					strokeWidth={S}
				/>
				<line
					y1={positionY}
					y2={positionY}
					x1={positionX + R}
					x2={positionX + (R + A)}
					stroke={color}
					strokeWidth={S}
				/>
			</g>
			<ellipse
				cx={positionX}
				cy={positionY}
				rx={R}
				ry={R}
				style={{ stroke: color, strokeWidth: S, fill: "transparent" }}
			/>
		</>
	);
};

type OwnProps = CompWorkspaceLayerBaseProps;
interface StateProps {
	compositionReferenceId: string;
	layer: CompositionLayer;
	selected: boolean;
}
type Props = OwnProps & StateProps;

const CompWorkspaceLayerGuidesComponent: React.FC<Props> = (props) => {
	const { layer, map } = props;

	const nameToProperty = useLayerNameToProperty(map, props.compositionId, layer.id, props.index);
	const shouldRender = useWorkspaceLayerShouldRender(map.frameIndex, layer.index, layer.length);

	const { scale } = React.useContext(CompWorkspaceViewportContext);

	if (!shouldRender) {
		return null;
	}

	let { PositionX, PositionY, Rotation, AnchorX, AnchorY, Scale } = nameToProperty;

	let width: number;
	let height: number;

	switch (layer.type) {
		case LayerType.Composition: {
			width = nameToProperty.Width;
			height = nameToProperty.Height;
			break;
		}

		case LayerType.Rect: {
			width = nameToProperty.Width;
			height = nameToProperty.Height;
			break;
		}

		case LayerType.Ellipse: {
			width = nameToProperty.OuterRadius * 2;
			height = nameToProperty.OuterRadius * 2;
			AnchorX += nameToProperty.OuterRadius;
			AnchorY += nameToProperty.OuterRadius;
			break;
		}
	}

	const transform = map.transforms[props.layerId].transform[0];
	const transformStyle = getLayerTransformStyle(transform);

	const { viewport } = useContext(CompWorkspaceViewportContext);
	const areaId = useContext(AreaIdContext);

	return (
		<>
			{Scale ? (
				<rect
					data-layer-id={layer.id}
					width={width}
					height={height}
					className={s("interactionLayer")}
					style={{
						strokeWidth: 2 / scale / Math.abs(Scale),
						...transformStyle,
					}}
					onMouseDown={(e) =>
						compWorkspaceHandlers.onLayerRectMouseDown(
							e,
							props.layerId,
							areaId,
							viewport,
						)
					}
				/>
			) : null}
			{props.selected ? (
				<Guides
					anchorX={AnchorX}
					anchorY={AnchorY}
					positionX={PositionX}
					positionY={PositionY}
					rotation={Rotation}
					scale={scale}
					height={height}
					width={width}
					transform={transform}
				/>
			) : null}
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState, compositionSelectionState },
	{ layerId },
) => {
	const layer = compositionState.layers[layerId];
	const selection = getCompSelectionFromState(layer.compositionId, compositionSelectionState);
	return {
		compositionReferenceId: compositionState.compositionLayerIdToComposition[layerId],
		layer,
		selected: !!selection.layers[layerId],
	};
};

export const CompWorkspaceLayerGuides = connectActionState(mapState)(
	CompWorkspaceLayerGuidesComponent,
);
