import React, { useLayoutEffect, useRef, useState } from "react";
import { useCanvasPixelSelector } from "~/hook/useCanvasPixelSelector";
import { useDidUpdate } from "~/hook/useDidUpdate";
import { RGBColor } from "~/types";
import { hslToRGB, rgbToHSL } from "~/util/color/convertColor";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	container: css`
		display: flex;
	`,

	colorCursor: css`
		position: absolute;
		background: white;
		width: 12px;
		height: 12px;
		border: 2px solid white;
		background: black;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	`,

	hueCursor: css`
		position: absolute;
		background: white;
		left: -4px;
		right: -4px;
		height: 2px;
		transform: translateY(-50%);
		pointer-events: none;
	`,
}));

const WIDTH = 256;
const HEIGHT = WIDTH;
const STRIP_WIDTH = 16;

function renderBlock(ctx: CanvasRenderingContext2D, hue: number) {
	const color = hslToRGB([hue, 100, 50]);

	ctx.fillStyle = `rgb(${color.join(",")})`;
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	const white = ctx.createLinearGradient(0, 0, WIDTH, 0);
	white.addColorStop(0, "rgba(255,255,255,1)");
	white.addColorStop(1, "rgba(255,255,255,0)");

	const black = ctx.createLinearGradient(0, 0, 0, HEIGHT);
	black.addColorStop(0, "rgba(0,0,0,0)");
	black.addColorStop(1, "rgba(0,0,0,1)");

	ctx.fillStyle = white;
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	ctx.fillStyle = black;
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	// Ensure that corners are not diluted in any way
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, 1, 1);

	ctx.fillStyle = `rgb(${color.join(",")})`;
	ctx.fillRect(WIDTH - 1, 0, 1, 1);
}

const Strip: React.FC<{ hue: number; onHueChange: (hue: number) => void }> = (props) => {
	const canvas = useRef<HTMLCanvasElement>(null);
	const ctx = useRef<CanvasRenderingContext2D | null>(null);
	const [y, setY] = useState(() => Math.round((props.hue / 360) * HEIGHT));

	useLayoutEffect(() => {
		ctx.current = canvas.current?.getContext("2d") || null;
	}, [canvas.current]);

	// Render strip once on mount
	useLayoutEffect(() => {
		if (!ctx.current) {
			return;
		}

		for (let i = 0; i < HEIGHT; i += 1) {
			ctx.current.fillStyle = `hsl(${(i / HEIGHT) * 360}, 100%, 50%)`;
			ctx.current.fillRect(0, i, STRIP_WIDTH, 1);
		}
	}, [ctx.current]);

	const pixelSelector = useCanvasPixelSelector(
		canvas,
		{ allowOutside: true },
		(rgbColor, position) => {
			const [hue] = rgbToHSL(rgbColor);
			props.onHueChange(hue);
			setY(position.y);
		},
	);

	return (
		<div style={{ position: "relative", marginRight: 16 }}>
			<canvas ref={canvas} height={HEIGHT} width={STRIP_WIDTH} {...pixelSelector} />
			<div style={{ top: y }} className={s("hueCursor")} />
		</div>
	);
};

/**
 * Returns the position of the RGB color in the context.
 *
 * If an exact color match is not found, the position of the
 * closest color is returned.
 */
const findPositionOfColor = (ctx: CanvasRenderingContext2D, rgbColor: RGBColor): Vec2 => {
	const h = ctx.canvas.height;
	const w = ctx.canvas.width;

	let dist = Infinity;
	let closestPos: Vec2 = Vec2.new(0, 0);

	const imageData = ctx.getImageData(0, 0, w, h).data;

	for (let i = 0; i < w; i += 1) {
		for (let j = 0; j < h; j += 1) {
			const r = imageData[j * w * 4 + i * 4];
			const g = imageData[j * w * 4 + i * 4 + 1];
			const b = imageData[j * w * 4 + i * 4 + 2];

			const currColor: RGBColor = [r, g, b];
			const currDist = currColor.reduce((acc, _, i) => {
				return acc + Math.abs(currColor[i] - rgbColor[i]);
			}, 0);

			if (currDist === 0) {
				return Vec2.new(i, j);
			}

			if (currDist < dist) {
				dist = currDist;
				closestPos = Vec2.new(i, j);
			}
		}
	}

	return closestPos;
};

const Block: React.FC<{ rgb: RGBColor; hue: number; onRgbChange: (rgb: RGBColor) => void }> = (
	props,
) => {
	const canvas = useRef<HTMLCanvasElement>(null);
	const ctx = useRef<CanvasRenderingContext2D | null>(null);
	const [position, setPosition] = useState<Vec2 | null>(null);

	useLayoutEffect(() => {
		ctx.current = canvas.current?.getContext("2d") || null;
	}, [canvas.current]);

	useLayoutEffect(() => {
		if (!ctx.current) {
			return;
		}

		renderBlock(ctx.current, props.hue);

		// Get initial position of color cursor
		if (!position) {
			const _ctx = ctx.current;
			setPosition(findPositionOfColor(_ctx, props.rgb));
		}
	}, [ctx.current, props.hue]);

	const pixelSelector = useCanvasPixelSelector(
		canvas,
		{ allowOutside: true, shiftPosition: Vec2.new(0, -5) },
		(rgbColor, position) => {
			props.onRgbChange(rgbColor);
			setPosition(position);
		},
	);

	return (
		<div style={{ position: "relative" }}>
			<canvas
				ref={canvas}
				height={HEIGHT}
				width={WIDTH}
				style={{ marginRight: 16 }}
				{...pixelSelector}
			/>
			{position && (
				<div
					className={s("colorCursor")}
					style={{
						left: position.x,
						top: position.y,
						background: `rgb(${props.rgb.join(",")})`,
					}}
				/>
			)}
		</div>
	);
};

interface Props {
	rgbColor: RGBColor;
	onChange: (rgbColor: RGBColor) => void;
	onSubmit?: () => void;
}

export const ColorPicker: React.FC<Props> = (props) => {
	const [initialRgb] = useState(props.rgbColor);
	const [rgb, setRgb] = useState<RGBColor>(props.rgbColor);
	const [hue, setHue] = useState<number>(() => rgbToHSL(rgb)[0]);

	// Update selected color on hue change
	useDidUpdate(() => {
		const [, s, l] = rgbToHSL(rgb);
		setRgb(hslToRGB([hue, s, l]));
	}, [hue]);

	useDidUpdate(() => {
		props.onChange(rgb);
	}, [rgb]);

	return (
		<div className={s("container")}>
			<Block hue={hue} onRgbChange={setRgb} rgb={rgb} />
			<Strip hue={hue} onHueChange={setHue} />
			<div>
				<div
					style={{
						height: 32,
						width: 64,
						background: `rgb(${rgb.join(",")})`,
					}}
				/>
				<div
					style={{
						height: 32,
						width: 64,
						background: `rgb(${initialRgb.join(",")})`,
						marginBottom: 16,
					}}
				/>
				{props.onSubmit && (
					<button onClick={props.onSubmit} style={{ display: "block", width: "100%" }}>
						OK
					</button>
				)}
			</div>
		</div>
	);
};
