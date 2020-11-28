import { matrixAndTranslateFromSvgTransform } from "~/svg/svgTransform";
import { SVGNode } from "~/svg/svgTypes";
import { Mat2 } from "~/util/math/mat";

export function getSvgNodeTransformMatrix(node: SVGNode): { matrix: Mat2; translate: Vec2 } {
	const { transform: transformString, transformOrigin: transformOriginString } = node;

	if (!transformString) {
		return {
			matrix: Mat2.identity(),
			translate: node.position,
		};
	}

	const { matrix, translate } = matrixAndTranslateFromSvgTransform(
		node.position,
		[0, 0], // TODO
		transformString,
		transformOriginString,
	);

	return { matrix, translate };
}
