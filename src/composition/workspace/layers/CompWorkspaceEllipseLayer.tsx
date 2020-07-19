import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { useLayerNameToProperty } from "~/composition/hook/useLayerNameToProperty";
import { useWorkspaceLayerShouldRender } from "~/composition/workspace/useWorkspaceLayerShouldRender";
import { connectActionState } from "~/state/stateUtils";

interface OwnProps {
	compositionId: string;
	layerId: string;
}
interface StateProps {
	isSelected: boolean;
	layer: CompositionLayer;
}
type Props = OwnProps & StateProps;

const CompWorkspaceEllipseLayerComponent: React.FC<Props> = (props) => {
	const nameToProperty = useLayerNameToProperty(props.compositionId, props.layerId);
	const shouldRender = useWorkspaceLayerShouldRender(props.layer);

	if (!shouldRender) {
		return null;
	}

	const {
		PositionX,
		PositionY,
		Scale,
		Opacity,
		Rotation,
		Fill,
		StrokeWidth,
		StrokeColor,
		InnerRadius,
		OuterRadius,
	} = nameToProperty;

	const fillColor = `rgba(${Fill.join(",")})`;
	const strokeColor = `rgba(${StrokeColor.join(",")})`;

	const maskId = `layermask:${props.layerId}`;

	if (InnerRadius >= OuterRadius) {
		return null;
	}

	return (
		<g
			data-layer-id={props.layerId}
			width={OuterRadius * 2}
			height={OuterRadius * 2}
			style={{
				transform: `translateX(${PositionX}px) translateY(${PositionY}px) scale(${Scale}) rotate(${Rotation}deg)`,
				transformOrigin: `${OuterRadius}px ${OuterRadius}px`,
				opacity: Opacity,
			}}
		>
			<mask id={maskId}>
				<rect
					width={OuterRadius * 2}
					height={OuterRadius * 2}
					x={-OuterRadius}
					y={-OuterRadius}
					style={{ fill: "white" }}
				/>
				<ellipse
					cx={0}
					cy={0}
					rx={InnerRadius}
					ry={InnerRadius}
					style={{
						fill: "black",
					}}
				/>
			</mask>
			<ellipse
				mask={`url(#${maskId})`}
				cx={0}
				cy={0}
				rx={OuterRadius}
				ry={OuterRadius}
				style={{
					fill: fillColor,
				}}
			/>
			<ellipse
				cx={0}
				cy={0}
				rx={OuterRadius}
				ry={OuterRadius}
				style={{
					strokeWidth: StrokeWidth,
					stroke: strokeColor,
					fillOpacity: 0,
				}}
			/>
			{InnerRadius > 0 && (
				<ellipse
					cx={0}
					cy={0}
					rx={InnerRadius}
					ry={InnerRadius}
					style={{
						strokeWidth: StrokeWidth,
						stroke: strokeColor,
						fillOpacity: 0,
					}}
				/>
			)}
		</g>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositions, compositionSelection },
	{ layerId },
) => {
	return {
		isSelected: !!compositionSelection.layers[layerId],
		layer: compositions.layers[layerId],
	};
};

export const CompWorkspaceEllipseLayer = connectActionState(mapState)(
	CompWorkspaceEllipseLayerComponent,
);
