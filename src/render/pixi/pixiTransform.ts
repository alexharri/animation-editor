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

export function createLayerPIXITransforms(layerDimensions: LayerDimension[]): PIXI.Matrix[] {
	const baseMatrix = new PIXI.Matrix();

	for (const { count } of layerDimensions) {
		if (count < 1) {
			// If any dimension has a count of 0, the total count is 0.
			return [];
		}
	}

	const dimensions = layerDimensions.map((item) => item.count);

	const ndArray = constructNdArray<PIXI.Matrix | null>(dimensions, null);
	const dIndices = layerDimensions.map(() => 0);

	const getNApplications = (j: number) => {
		switch (layerDimensions[j].type) {
			case "array":
			case "array_with_graph":
			case "array_with_graph_recursive":
				return dIndices[j];
			case "parent":
				return dIndices[j] + 1;
		}
	};
	const getMatricesToApply = (j: number) => {
		const item = layerDimensions[j];
		switch (item.type) {
			case "array":
			case "parent":
			case "array_with_graph": {
				return Array.from({ length: item.count }).map(() => item.matrix);
			}
			case "array_with_graph_recursive":
				return item.matrices;
		}
	};

	let i = 0;
	while (i !== -1) {
		const index = getNdArrayIndex(dimensions, dIndices);

		const m = baseMatrix.clone();

		for (let j = 0; j < dIndices.length; j++) {
			const item = layerDimensions[j];
			const nApplications = getNApplications(j);
			const toApply = getMatricesToApply(j);

			for (let k = 0; k < nApplications; k++) {
				m.append(toApply[k]);
			}
			if (item.type === "array_with_graph") {
				const absM = item.absoluteMatrices[nApplications];
				m.append(absM);
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
