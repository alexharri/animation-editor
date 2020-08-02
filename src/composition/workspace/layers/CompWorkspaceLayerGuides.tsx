import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { CompWorkspaceLayerBaseProps } from "~/composition/workspace/compWorkspaceTypes";
import { CompWorkspaceViewportContext } from "~/composition/workspace/CompWorkspaceViewportContext";
import { useWorkspaceLayerShouldRender } from "~/composition/workspace/useWorkspaceLayerShouldRender";
import { connectActionState } from "~/state/stateUtils";
import { AffineTransform, LayerType } from "~/types";
import { rotateVec2CCW } from "~/util/math";

export const AdditionalTransformContext = React.createContext<AffineTransform[]>([]);

type OwnProps = CompWorkspaceLayerBaseProps;
interface StateProps {
	compositionReferenceId: string;
	layer: CompositionLayer;
	selected: boolean;
}
type Props = OwnProps & StateProps;

const CompWorkspaceLayerGuidesComponent: React.FC<Props> = (props) => {
	const { layer, map } = props;

	const nameToProperty = useLayerNameToProperty(map, props.compositionId, layer.id);
	const shouldRender = useWorkspaceLayerShouldRender(map.frameIndex, layer.index, layer.length);

	const { scale } = React.useContext(CompWorkspaceViewportContext);

	if (!shouldRender || !props.selected) {
		return null;
	}

	let { PositionX, PositionY, Rotation, AnchorX, AnchorY } = nameToProperty;

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

	const color = "rgb(89 142 243)";
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
				const pt = map.transforms[props.layerId];
				const pos = Vec2.new(PositionX + width * x, PositionY + height * y)
					.sub(Vec2.new(AnchorX, AnchorY))
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
				cx={PositionX}
				cy={PositionY}
				rx={R}
				ry={R}
				style={{ stroke: anchorShadowColor, strokeWidth: S + SW * 2, fill: "transparent" }}
			/>
			<g
				style={{
					transformOrigin: `${PositionX}px ${PositionY}px`,
					transform: `rotate(${Rotation}rad)`,
				}}
			>
				<line
					y1={PositionY - R}
					y2={PositionY - (R + A + SW)}
					x1={PositionX}
					x2={PositionX}
					stroke={anchorShadowColor}
					strokeWidth={S + SW * 2}
				/>
				<line
					y1={PositionY + R}
					y2={PositionY + (R + A + SW)}
					x1={PositionX}
					x2={PositionX}
					stroke={anchorShadowColor}
					strokeWidth={S + SW * 2}
				/>
				<line
					y1={PositionY}
					y2={PositionY}
					x1={PositionX - R}
					x2={PositionX - (R + A + SW)}
					stroke={anchorShadowColor}
					strokeWidth={S + SW * 2}
				/>
				<line
					y1={PositionY}
					y2={PositionY}
					x1={PositionX + R}
					x2={PositionX + (R + A + SW)}
					stroke={anchorShadowColor}
					strokeWidth={S + SW * 2}
				/>
				<line
					y1={PositionY - R}
					y2={PositionY - (R + A)}
					x1={PositionX}
					x2={PositionX}
					stroke={color}
					strokeWidth={S}
				/>
				<line
					y1={PositionY + R}
					y2={PositionY + (R + A)}
					x1={PositionX}
					x2={PositionX}
					stroke={color}
					strokeWidth={S}
				/>
				<line
					y1={PositionY}
					y2={PositionY}
					x1={PositionX - R}
					x2={PositionX - (R + A)}
					stroke={color}
					strokeWidth={S}
				/>
				<line
					y1={PositionY}
					y2={PositionY}
					x1={PositionX + R}
					x2={PositionX + (R + A)}
					stroke={color}
					strokeWidth={S}
				/>
			</g>
			<ellipse
				cx={PositionX}
				cy={PositionY}
				rx={R}
				ry={R}
				style={{ stroke: color, strokeWidth: S, fill: "transparent" }}
			/>
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
