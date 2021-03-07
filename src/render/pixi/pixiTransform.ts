import * as PIXI from "pixi.js";
import { LayerTransform } from "~/types";
import { constructNdArray, getNdArrayIndex } from "~/util/ndArray";

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
