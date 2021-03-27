import * as PIXI from "pixi.js";
import { LayerDimension } from "~/types";
import { Mat2 } from "~/util/math/mat";
import { constructNdArray, getNdArrayIndex } from "~/util/ndArray";

export const adjustPIXITransformToParent = (
	transform: PIXI.Transform,
	parentTransform: PIXI.Transform,
): PIXI.Transform => {
	const translateDiff = Vec2.new(transform.position)
		.sub(parentTransform.position)
		.add(parentTransform.pivot);

	const rmat = Mat2.rotation(-parentTransform.rotation);
	const position = translateDiff
		.multiplyMat2(rmat, parentTransform.pivot)
		.scaleXY(1 / parentTransform.scale.x, 1 / parentTransform.scale.y, parentTransform.pivot);

	const pivot = transform.pivot;

	const rotation = transform.rotation - parentTransform.rotation;
	const scaleX = transform.scale.x / parentTransform.scale.x;
	const scaleY = transform.scale.y / parentTransform.scale.y;

	const t = new PIXI.Transform();
	t.position.set(position.x, position.y);
	t.pivot.set(pivot.x, pivot.y);
	t.scale.set(scaleX, scaleY);
	t.rotation = rotation;

	return t;
};

interface Item {
	type: "array" | "parent";
	count: number;
	matrix: PIXI.Matrix;
	fromComp?: boolean;
}

type ParentDimensions = LayerDimension[];

export function createLayerPIXITransforms(
	parentDimensions: ParentDimensions,
	parentMatrices: PIXI.Matrix[],
	_dimensions: number[],
	_matrices: PIXI.Matrix[],
): PIXI.Matrix[] {
	// const x: LayerTransform = {
	// 	...DEFAULT_LAYER_TRANSFORM,
	// 	translate: Vec2.new(10, 0),
	// };

	// dimensions = [5, ...dimensions];
	// transforms = [x, ...transforms];

	const baseMatrix = new PIXI.Matrix();

	// for (const matrix of parentMatrices) {
	// 	baseMatrix.append(matrix);
	// }

	for (const n of _dimensions) {
		if (n < 1) {
			// If any dimension has a count of 0, the total count is 0.
			return [];
		}
	}

	const items: Item[] = [];

	items.push(...parentDimensions.map((x) => ({ ...x })));
	items.push(
		...parentMatrices.map<Item>((matrix) => ({
			type: "parent",
			count: 1,
			matrix,
		})),
	);
	items.push(
		..._dimensions.map<Item>((count, i) => ({
			type: "array",
			count,
			matrix: _matrices[i],
		})),
	);

	for (const item of items) {
		if (item.count < 1) {
			// If any dimension has a count of 0, the total count is 0.
			return [];
		}
	}

	const dimensions = items.map((item) => item.count);
	const matrices = items.map((item) => item.matrix);

	const ndArray = constructNdArray<PIXI.Matrix | null>(dimensions, null);
	const dIndices = items.map(() => 0);

	let i = 0;
	while (i !== -1) {
		const index = getNdArrayIndex(dimensions, dIndices);

		const m = baseMatrix.clone();

		for (let j = 0; j < dIndices.length; j++) {
			const nApplications = dIndices[j] + (items[j].type === "array" ? 0 : 1);
			const toApply = matrices[j];
			for (let k = 0; k < nApplications; k++) {
				m.append(toApply);
			}
		}
		ndArray[index] = m;

		// Loop stuff
		i = dIndices.length - 1;
		for (; dIndices[i] === dimensions[i] - 1; i--) {
			dIndices[i] = 0;
		}
		dIndices[i]++;
	}

	return ndArray as PIXI.Matrix[];
}
