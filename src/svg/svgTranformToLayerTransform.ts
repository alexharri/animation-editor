import { DEFAULT_LAYER_TRANSFORM, RAD_TO_DEG_FAC } from "~/constants";
import { parseSvgTransform } from "~/svg/parseSvgTransform";
import { LayerTransform } from "~/types";

export const svgTransformToLayerTransform = (
	position: Vec2,
	list: ReturnType<typeof parseSvgTransform>,
): LayerTransform => {
	let transform: LayerTransform = {
		...DEFAULT_LAYER_TRANSFORM,
		translate: position,
	};

	for (const item of list) {
		switch (item.type) {
			case "rotate": {
				transform.rotation += item.rotation;
				break;
			}

			case "translate": {
				transform.translate = transform.translate.add(Vec2.new(item.x, item.y));
				break;
			}

			case "matrix": {
				transform.matrix = transform.matrix.multiplyMat2(item.mat);
				break;
			}
		}
	}

	transform.rotation = transform.matrix.getRotationAngle() * RAD_TO_DEG_FAC;

	const negrmat = transform.matrix.rotate(-transform.rotation);
	transform.scaleX = negrmat.i().x;
	transform.scaleY = negrmat.j().y;

	return transform;
};
