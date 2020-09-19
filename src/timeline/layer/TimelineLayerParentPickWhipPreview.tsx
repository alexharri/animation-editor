import React, { useLayoutEffect, useRef } from "react";
import { getPickWhipLayerTarget } from "~/composition/layer/layerUtils";
import { TIMELINE_HEADER_HEIGHT, TIMELINE_LAYER_HEIGHT } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { getActionState } from "~/state/stateUtils";
import { getTimelineTrackYPositions } from "~/trackEditor/trackEditorUtils";
import { LayerParentPickWhip } from "~/types";
import { traceLine } from "~/util/canvas/renderPrimitives";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	canvas: css`
		position: absolute;
		top: 0;
		left: 0;
		cursor: default;
	`,
}));

interface OwnProps {
	pickWhipLayerParent: null | LayerParentPickWhip;
	viewport: Rect;
	compositionId: string;
	panY: number;
}
type Props = OwnProps;

export const TimelineLayerParentPickWhipPreview: React.FC<Props> = (props) => {
	const { viewport, pickWhipLayerParent, compositionId, panY } = props;

	const canvasRef = useRef<HTMLCanvasElement>(null);

	useLayoutEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) {
			return;
		}

		ctx.clearRect(0, 0, viewport.width, viewport.height);

		if (!pickWhipLayerParent) {
			return;
		}

		const { compositionState } = getActionState();
		const yPosMap = getTimelineTrackYPositions(compositionId, compositionState, panY);

		const fromY =
			yPosMap.layer[pickWhipLayerParent.fromId] +
			TIMELINE_LAYER_HEIGHT / 2 +
			TIMELINE_HEADER_HEIGHT;

		// Sorry for the magic constant
		const from = Vec2.new(289, fromY);
		const to = pickWhipLayerParent.to.subXY(viewport.left, viewport.top);

		ctx.beginPath();
		traceLine(ctx, [from, to], {
			move: true,
		});
		ctx.strokeStyle = cssVariables.primary600;
		ctx.lineWidth = 1.5;
		ctx.stroke();
		ctx.closePath();

		const target = getPickWhipLayerTarget(
			pickWhipLayerParent.to,
			pickWhipLayerParent.fromId,
			compositionId,
			compositionState,
			panY,
			viewport,
		);
		if (!target) {
			return;
		}

		const y = yPosMap.layer[target.layerId] + TIMELINE_HEADER_HEIGHT;

		ctx.beginPath();
		ctx.rect(0.5, y - 0.5, viewport.width - 1, TIMELINE_LAYER_HEIGHT);
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.closePath();
	}, [pickWhipLayerParent, viewport, panY]);

	if (!pickWhipLayerParent) {
		return null;
	}

	return (
		<canvas
			width={viewport.width}
			height={viewport.height}
			className={s("canvas")}
			ref={canvasRef}
		/>
	);
};
