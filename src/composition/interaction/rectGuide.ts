import * as PIXI from "pixi.js";
import { rgbToBinary } from "~/util/color/convertColor";

const cyan = rgbToBinary([0, 255, 255]);
const black = rgbToBinary([0, 0, 0]);

export const createRectGuideGraphic = (rect: Rect, matrix: PIXI.Matrix): PIXI.Graphics => {
	const graphic = new PIXI.Graphics();

	const p0 = Vec2.new(matrix.apply({ x: rect.left, y: rect.top }));
	const p1 = Vec2.new(matrix.apply({ x: rect.left + rect.width, y: rect.top }));
	const p2 = Vec2.new(matrix.apply({ x: rect.left + rect.width, y: rect.top + rect.height }));
	const p3 = Vec2.new(matrix.apply({ x: rect.left, y: rect.top + rect.height }));

	graphic.lineStyle(1, cyan, 1, 1);
	graphic.moveTo(p0.x, p0.y);
	graphic.lineTo(p1.x, p1.y);
	graphic.lineTo(p2.x, p2.y);
	graphic.lineTo(p3.x, p3.y);
	graphic.closePath();

	return graphic;
};

export const createCornersGuideGraphic = (rect: Rect, matrix: PIXI.Matrix): PIXI.Container => {
	const container = new PIXI.Container();

	const transform = new PIXI.Transform();
	transform.setFromMatrix(matrix);

	const p0 = Vec2.new(matrix.apply({ x: rect.left, y: rect.top }));
	const p1 = Vec2.new(matrix.apply({ x: rect.left + rect.width, y: rect.top }));
	const p2 = Vec2.new(matrix.apply({ x: rect.left + rect.width, y: rect.top + rect.height }));
	const p3 = Vec2.new(matrix.apply({ x: rect.left, y: rect.top + rect.height }));

	const W = 8;
	const H = W / 2;
	const O = Vec2.new(2, 2).rotate(-transform.rotation);

	for (const p of [p0, p1, p2, p3]) {
		const graphic = new PIXI.Graphics();
		graphic.position.set(p.x, p.y);
		graphic.rotation = transform.rotation;

		const x = -H;
		const y = -H;

		graphic.beginFill(black);
		graphic.drawRect(x + O.x, y + O.y, W, W);
		graphic.endFill();

		graphic.beginFill(cyan);
		graphic.drawRect(x, y, W, W);
		graphic.endFill();

		container.addChild(graphic);
	}

	return container;
};
