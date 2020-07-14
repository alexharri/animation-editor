import React, { useRef, useEffect } from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import CompTimeScrubberStyles from "~/composition/timeline/core/CompTimeScrubber.styles";
import { COMP_TIME_SCRUBBER_HEIGHT } from "~/constants";
import { separateLeftRightMouse } from "~/util/mouse";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { Composition } from "~/composition/compositionTypes";
import { connectActionState } from "~/state/stateUtils";
import { createToTimelineViewportX } from "~/timeline/renderTimeline";
import { renderLine } from "~/util/canvas/renderPrimitives";
import { cssVariables } from "~/cssVariables";

const s = compileStylesheetLabelled(CompTimeScrubberStyles);

interface OwnProps {
	compositionId: string;
	viewBounds: [number, number];
	viewportRight: Rect;
}
interface StateProps {
	composition: Composition;
}
type Props = OwnProps & StateProps;

const CompTimeScrubberComponent: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const toTimelineX = createToTimelineViewportX({
		length: props.composition.length,
		viewBounds: props.viewBounds,
		width: props.viewportRight.width,
	});

	const render = () => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) {
			return;
		}

		const { composition } = props;
		const h = COMP_TIME_SCRUBBER_HEIGHT;
		const w = props.viewportRight.width;

		const MIN_DIST = 46;

		let useSec = false;

		// For frames
		const potentialNBetween = [1, 2, 5, 10, 15, 30];
		let betweenIndex = 0;

		while (
			toTimelineX(potentialNBetween[betweenIndex]) - toTimelineX(0) < MIN_DIST &&
			betweenIndex < potentialNBetween.length
		) {
			betweenIndex++;
		}

		const nBetween = potentialNBetween[betweenIndex];

		let fac = 60;

		while (toTimelineX(fac) - toTimelineX(0) < MIN_DIST) {
			fac *= 2;
		}

		useSec = toTimelineX(fac) - toTimelineX(0) < MIN_DIST * 2;

		let tickBy!: number;

		tickBy = fac;

		ctx.clearRect(0, 0, w, h);

		const start = Math.floor(composition.length * props.viewBounds[0]);
		const end = Math.ceil(composition.length * props.viewBounds[1]);

		ctx.font = `10px ${cssVariables.fontFamily}`;
		ctx.fillStyle = cssVariables.light500;

		if (useSec) {
			for (let i = start - (start % tickBy); i <= end; i += tickBy) {
				const x = toTimelineX(i);

				const t = `${Number((i / 60).toFixed(2))}s`;
				const w = ctx.measureText(t).width;
				ctx.fillText(t, x - w / 2, 10);

				renderLine(ctx, Vec2.new(x, 14), Vec2.new(x, h), {
					color: cssVariables.light500,
					strokeWidth: 1,
				});
			}
		} else {
			const fStart = start - (start % nBetween);
			for (let i = fStart; i <= end; i += nBetween) {
				const x = toTimelineX(i);
				const d = i % 60;

				const t = d === 0 ? `${i / 60}:00f` : `${d}f`;
				const w = ctx.measureText(t).width;
				ctx.fillText(t, x - w / 2, 10);

				renderLine(ctx, Vec2.new(x, 14), Vec2.new(x, h), {
					color: cssVariables.light500,
					strokeWidth: 1,
				});
			}
		}
	};

	useEffect(() => {
		render();
	});

	return (
		<div className={s("wrapper")}>
			<canvas
				className={s("canvas")}
				width={props.viewportRight.width}
				height={COMP_TIME_SCRUBBER_HEIGHT}
				ref={canvasRef}
			/>
			<div
				className={s("interactionArea")}
				onMouseDown={separateLeftRightMouse({
					left: (e) => {
						compTimeHandlers.onScrubMouseDown(e, {
							composition: props.composition,
							viewBounds: props.viewBounds,
							viewport: props.viewportRight,
						});
					},
				})}
			/>
			<div className={s("head")} style={{ left: toTimelineX(props.composition.frameIndex) }}>
				<div className={s("scrubLine")} style={{ height: props.viewportRight.height }} />
			</div>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositions, compositionSelection },
	ownProps,
) => ({
	compositionState: compositions,
	selection: compositionSelection,
	composition: compositions.compositions[ownProps.compositionId],
});

export const CompTimeScrubber = connectActionState(mapStateToProps)(CompTimeScrubberComponent);
