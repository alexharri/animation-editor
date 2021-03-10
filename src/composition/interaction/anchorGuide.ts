import * as PIXI from "pixi.js";
import { rgbToBinary } from "~/util/color/convertColor";

const cyan = rgbToBinary([0, 255, 255]);
const black = rgbToBinary([0, 0, 0]);

export const createAnchorGraphic = (matrix: PIXI.Matrix): PIXI.Graphics => {
	const graphic = new PIXI.Graphics();

	const transform = new PIXI.Transform();
	transform.setFromMatrix(matrix);

	graphic.position.set(transform.position.x, transform.position.y);
	graphic.rotation = transform.rotation;

	const R = 5;
	const A = 4;
	const LW = 1.5;
	const SLW = 3;
	const ONE = 1;

	graphic.lineStyle(SLW, black);

	// Circle shadow
	graphic.drawEllipse(0, 0, R, R);

	const ri = Vec2.new(1, 0);
	const rj = Vec2.new(0, 1);

	for (const fac of [1, -1]) {
		// Line shadows
		const l0 = Vec2.new(0, 0).sub(ri.scale(fac * (R + A + ONE)));
		const l1 = Vec2.new(0, 0).sub(ri.scale(fac * R));

		const l2 = Vec2.new(0, 0).add(rj.scale(fac * (R + A + ONE)));
		const l3 = Vec2.new(0, 0).add(rj.scale(fac * R));

		graphic.moveTo(l0.x, l0.y);
		graphic.lineTo(l1.x, l1.y);

		graphic.moveTo(l2.x, l2.y);
		graphic.lineTo(l3.x, l3.y);
	}
	graphic.endFill();

	graphic.lineStyle(LW, cyan);

	// Circle
	graphic.drawCircle(0, 0, R);

	for (const fac of [1, -1]) {
		const l0 = Vec2.new(0, 0).sub(ri.scale(fac * (R + A)));
		const l1 = Vec2.new(0, 0).sub(ri.scale(fac * R));

		const l2 = Vec2.new(0, 0).add(rj.scale(fac * (R + A)));
		const l3 = Vec2.new(0, 0).add(rj.scale(fac * R));

		graphic.moveTo(l0.x, l0.y);
		graphic.lineTo(l1.x, l1.y);

		graphic.moveTo(l2.x, l2.y);
		graphic.lineTo(l3.x, l3.y);
	}

	return graphic;
};
