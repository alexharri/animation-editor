import * as PIXI from "pixi.js";
import { getDimensionsAndTransforms } from "~/composition/arrayModifier";
import { Layer } from "~/composition/compositionTypes";
import { getLayerRectDimensionsAndOffset } from "~/composition/layer/layerDimensions";
import { LayerPixiContainers } from "~/composition/layer/layerManager";
import { LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { updatePixiLayerHitTestGraphic } from "~/render/pixi/layerToPixi";
import { createLayerPIXITransforms } from "~/render/pixi/pixiTransform";
import { PropertyName } from "~/types";
import { rgbToBinary } from "~/util/color/convertColor";

export const createLayerInstances = (
	actionState: ActionState,
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
	ownContentContainer: PIXI.Container,
	graphic: PIXI.Graphics,
) => {
	const { dimensions, transforms } = getDimensionsAndTransforms(
		layer.id,
		actionState,
		layerPropertyMap,
		getPropertyValue,
	);

	const pixiTransforms = createLayerPIXITransforms(dimensions, transforms);

	for (let i = 0; i < pixiTransforms.length; i++) {
		const g0 = new PIXI.Graphics(graphic.geometry);
		g0.transform.setFromMatrix(pixiTransforms[i].worldTransform);
		ownContentContainer.addChild(g0);
	}
};

const cyan = rgbToBinary([0, 255, 255]);
const black = rgbToBinary([0, 0, 0]);

const drawAnchorGuide = (
	container: PIXI.Container,
	anchor: Vec2,
	scale: number,
	layerScale: Vec2,
) => {
	const children = container.children;
	container.removeChildren();
	children.forEach((child) => child.destroy());

	const xScale = 1 / scale / layerScale.x;
	const yScale = 1 / scale / layerScale.y;

	container.transform;

	const graphic = new PIXI.Graphics();

	container.position.set(anchor.x, anchor.y);
	graphic.scale.set(xScale, yScale);

	container.addChild(graphic);
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
};

const drawRectGuide = (
	graphic: PIXI.Graphics,
	width: number,
	height: number,
	offX: number,
	offY: number,
	scale: number,
	layerScale: Vec2,
) => {
	graphic.clear();
	graphic.lineStyle(1 / scale / layerScale.x, cyan, 1, 1);
	graphic.moveTo(offX, offY);
	graphic.lineTo(offX, offY + height);
	graphic.moveTo(offX + width, offY);
	graphic.lineTo(offX + width, offY + height);

	graphic.lineStyle(1 / scale / layerScale.y, cyan, 1, 1);
	graphic.moveTo(offX, offY);
	graphic.lineTo(offX + width, offY);
	graphic.moveTo(offX, offY + height);
	graphic.lineTo(offX + width, offY + height);
};

const drawRectCorners = (
	graphic: PIXI.Graphics,
	width: number,
	height: number,
	offX: number,
	offY: number,
	scale: number,
	layerScale: Vec2,
) => {
	graphic.clear();
	const corners = [
		[1, 0],
		[1, 1],
		[0, 1],
		[0, 0],
	].map(([tx, ty]) => {
		let x = tx * width + offX;
		let y = ty * height + offY;
		return [x, y];
	});

	const xScale = 1 / scale / layerScale.x;
	const yScale = 1 / scale / layerScale.y;

	const W = 8 * xScale;
	const H = 8 * xScale;

	// Draw shadows
	for (const [x, y] of corners) {
		graphic.beginFill(black, 1);
		graphic.drawRect(x - (4 - 1) * xScale, y - (4 - 1) * yScale, W, H);
		graphic.endFill();
	}

	// Draw rects
	for (const [x, y] of corners) {
		graphic.beginFill(cyan, 1);
		graphic.drawRect(x - 4 * xScale, y - 4 * yScale, W, H);
		graphic.endFill();
	}
};

export const drawGuides = (
	actionState: ActionState,
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
	containers: LayerPixiContainers,
	scale: number,
) => {
	const { rectLines, guideAnchor, rectCorners, hitTestGraphic } = containers;

	const layerScaleX = getPropertyValue(layerPropertyMap[PropertyName.ScaleX]);
	const layerScaleY = getPropertyValue(layerPropertyMap[PropertyName.ScaleY]);
	const layerScale = Vec2.new(layerScaleX, layerScaleY);

	const [width, height, offX, offY] = getLayerRectDimensionsAndOffset(
		actionState,
		layer,
		layerPropertyMap,
		getPropertyValue,
	);
	const anchorX = getPropertyValue(layerPropertyMap[PropertyName.AnchorX]);
	const anchorY = getPropertyValue(layerPropertyMap[PropertyName.AnchorY]);
	const anchor = Vec2.new(anchorX, anchorY);

	drawRectGuide(rectLines, width, height, offX, offY, scale, layerScale);
	drawRectCorners(rectCorners, width, height, offX, offY, scale, layerScale);
	drawAnchorGuide(guideAnchor, anchor, scale, layerScale);
	updatePixiLayerHitTestGraphic(actionState, layer, hitTestGraphic, getPropertyValue);
};

export const updateLayerInstanceTransforms = (
	actionState: ActionState,
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
	ownContentContainer: PIXI.Container,
) => {
	const { dimensions, transforms } = getDimensionsAndTransforms(
		layer.id,
		actionState,
		layerPropertyMap,
		getPropertyValue,
	);

	const pixiTransforms = createLayerPIXITransforms(dimensions, transforms);
	const children = ownContentContainer.children;

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		child.transform.setFromMatrix(pixiTransforms[i].worldTransform);
	}
};
