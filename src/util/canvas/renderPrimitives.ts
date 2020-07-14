export interface RenderCircleOptions {
	color: string;
	radius: number;
	strokeWidth?: number;
	strokeColor?: string;
}

export function renderCircle(
	ctx: CanvasRenderingContext2D,
	vectors: Vec2 | Vec2[],
	opts: RenderCircleOptions,
): void {
	const vecs = Array.isArray(vectors) ? vectors : [vectors];

	const { color, radius, strokeWidth = 0, strokeColor } = opts;

	ctx.fillStyle = color;

	for (let i = 0; i < vecs.length; i += 1) {
		const { x, y } = vecs[i];
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.closePath();
		ctx.fill();

		if (strokeWidth > 0 && strokeColor) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
			ctx.lineWidth = strokeWidth;
			ctx.strokeStyle = strokeColor;
			ctx.stroke();
		}
	}
}

export interface RenderRectOptions {
	fillColor: string;
	strokeWidth?: number;
	strokeColor?: string;
}

export function renderRect(
	ctx: CanvasRenderingContext2D,
	rects: Rect | Rect[],
	opts: RenderRectOptions,
): void {
	const recArr = Array.isArray(rects) ? rects : [rects];

	const { fillColor, strokeWidth = 0, strokeColor } = opts;

	ctx.fillStyle = fillColor;
	for (let i = 0; i < recArr.length; i += 1) {
		const { left, top, width, height } = recArr[i];

		ctx.beginPath();
		ctx.rect(left, top, width, height);
		ctx.fill();

		if (strokeWidth > 0 && strokeColor) {
			ctx.beginPath();
			ctx.rect(left, top, width, height);
			ctx.lineWidth = strokeWidth;
			ctx.strokeStyle = strokeColor;
			ctx.stroke();
		}
	}
}

export interface RenderDiamondOptions {
	fillColor: string;
	width: number;
	height: number;
	strokeWidth?: number;
	strokeColor?: string;
}

export function renderDiamond(
	ctx: CanvasRenderingContext2D,
	vectors: Vec2 | Vec2[],
	opts: RenderDiamondOptions,
): void {
	const vecs = Array.isArray(vectors) ? vectors : [vectors];

	const { fillColor, width, height, strokeWidth = 0, strokeColor } = opts;

	ctx.fillStyle = fillColor;

	for (let i = 0; i < vecs.length; i += 1) {
		const path = () => {
			const { x, y } = vecs[i];
			ctx.beginPath();
			ctx.moveTo(x, y + height / 2); // Top
			ctx.lineTo(x + width / 2, y); // Right
			ctx.lineTo(x, y - height / 2); // Bottom
			ctx.lineTo(x - width / 2, y); // Left
			ctx.lineTo(x, y + height / 2); // Back to top
		};

		path();
		ctx.fill();

		if (strokeWidth > 0 && strokeColor) {
			path();
			ctx.lineWidth = strokeWidth;
			ctx.strokeStyle = strokeColor;
			ctx.stroke();
		}
	}
}

export interface RenderLineOptions {
	color: string;
	strokeWidth: number;
	lineDash?: number[];
}

export function renderLine(
	ctx: CanvasRenderingContext2D,
	a: Vec2,
	b: Vec2,
	opts: RenderLineOptions,
): void {
	const { color, strokeWidth } = opts;

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(b.x, b.y);
	ctx.strokeStyle = color;
	ctx.lineWidth = strokeWidth;
	if (opts.lineDash) {
		ctx.setLineDash(opts.lineDash);
	}
	ctx.stroke();

	// Reset
	ctx.setLineDash([]);
}

export interface RenderCubicBezierOptions {
	color: string;
	strokeWidth: number;
}

export function renderCubicBezier(
	ctx: CanvasRenderingContext2D,
	bezier: CubicBezier,
	opts: RenderCubicBezierOptions,
): void {
	const { color, strokeWidth } = opts;
	const [p0, p1, p2, p3] = bezier;

	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
	ctx.strokeStyle = color;
	ctx.lineWidth = strokeWidth;
	ctx.stroke();
}

export interface RenderPathOptions {
	color: string;
	strokeWidth: number;
	lineDash: number[];
}

/**
 * @todo Implement `lineDash` option
 */
export function renderPath(ctx: Ctx, path: CubicBezier | Line, opts: RenderPathOptions): void {
	if (path.length === 2) {
		renderLine(ctx, path[0], path[1], opts);
	} else {
		renderCubicBezier(ctx, path, opts);
	}
}

export interface RenderQuadraticBezierOptions {
	color: string;
	strokeWidth: number;
}

export function renderQuadraticBezier(
	ctx: CanvasRenderingContext2D,
	vectors: [Vec2, Vec2, Vec2],
	opts: RenderQuadraticBezierOptions,
): void {
	const [p0, p1, p2] = vectors;
	const { color, strokeWidth } = opts;

	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
	ctx.strokeStyle = color;
	ctx.lineWidth = strokeWidth;

	ctx.stroke();
}
