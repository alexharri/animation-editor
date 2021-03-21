import * as PIXI from "pixi.js";
import { LayerTransform } from "~/types";
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

export function createLayerPIXITransforms(
	dimensions: number[],
	transforms: LayerTransform[],
): PIXI.Transform[] {
	for (const n of dimensions) {
		if (n < 1) {
			// If any dimension has a count of 0, the total count is 0.
			return [];
		}
	}

	const pixiTransforms = transforms.map((transform) => {
		const t = new PIXI.Transform();
		t.worldTransform.setTransform(
			transform.translate.x,
			transform.translate.y,
			transform.anchor.x,
			transform.anchor.y,
			transform.scaleX,
			transform.scaleY,
			transform.rotation,
			0,
			0,
		);
		return t;
	});

	const ndArray = constructNdArray<PIXI.Transform | null>(dimensions, null);

	const dIndices = dimensions.map(() => 0);

	let i = 0;
	while (i !== -1) {
		const index = getNdArrayIndex(dimensions, dIndices);

		const t = new PIXI.Transform();

		for (let j = 0; j < dIndices.length; j++) {
			const nApplications = dIndices[j];
			const toApply = pixiTransforms[j];
			for (let k = 0; k < nApplications; k++) {
				t.worldTransform.append(toApply.worldTransform);
			}
		}
		ndArray[index] = t;

		// Loop stuff
		i = dIndices.length - 1;
		for (; dIndices[i] === dimensions[i] - 1; i--) {
			dIndices[i] = 0;
		}
		dIndices[i]++;
	}

	return ndArray as PIXI.Transform[];
}
