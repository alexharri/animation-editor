import { LayerTransform } from "~/types";
import { Mat2 } from "~/util/math/mat";

const svgns = "http://www.w3.org/2000/svg";

type Transform =
	| {
			type: "translate";
			x: number;
			y: number;
	  }
	| {
			type: "scale";
			x: number;
			y: number;
	  }
	| {
			type: "rotate";
			rotation: number;
	  }
	| {
			type: "matrix";
			mat: Mat2;
	  };

export function parseSvgTransform(coords: Vec2, fullTransformString: string): LayerTransform {
	const reg = /[a-z]+\([-0-9\ \,\.]*\)/g;
	const matches: string[] = [...(fullTransformString.match(reg) || [])];

	let position = coords;
	let rotation = 0;
	let scale = 1;

	for (const transformStr of matches) {
		const pStart = transformStr.indexOf("(");
		const pEnd = transformStr.indexOf(")");

		const command = transformStr.substr(0, pStart);
		const content = transformStr.substr(pStart + 1, pEnd - pStart - 1);

		const values = content.split(/[ ,]+/).map((n) => parseFloat(n));

		for (let i = 0; i < values.length; i++) {
			if (isNaN(values[i])) {
				throw new Error(`NaN value at index ${i} from transform '${transformStr}'.`);
			}
		}

		switch (command) {
			case "translate": {
				const [x, y] = values;
				if (typeof x !== "number" || typeof y !== "number") {
					console.warn(`Invalid translate transform '${transformStr}'`);
				}
				position = position.add(Vec2.new(x, y));
				break;
			}
			case "rotate": {
				const [angleDeg] = values;
				if (typeof angleDeg !== "number") {
					console.warn(`Invalid rotate transform '${transformStr}'`);
				}
				rotation += angleDeg;
				// position = position.rotate(angleDeg * DEG_TO_RAD_FAC);
				break;
			}
			case "scale": {
				const [scale] = values;
				if (typeof scale !== "number") {
					console.warn(`Invalid rotate transform '${transformStr}'`);
				}
				position = position.scale(scale);
				break;
			}
		}
	}

	return {
		anchor: Vec2.new(0, 0),
		matrix: Mat2.identity().scale(scale).rotate(rotation),
		origin: Vec2.ORIGIN,
		originBehavior: "relative",
		rotation,
		scaleX: scale,
		scaleY: scale,
		translate: position,
	};
}

export const old_parseSvgTransform = (transformStr: string) => {
	const rect = document.createElementNS(svgns, "rect");
	rect.setAttribute("transform", transformStr);

	const transforms: Transform[] = [];

	let m: DOMMatrix;

	{
		const [[a, b], [c, d]] = Mat2.identity().matrix;
		m = new DOMMatrix([a, b, c, d, 0, 0]);
	}

	const list = rect.transform.baseVal;

	for (let i = 0; i < list.numberOfItems; i++) {
		const transform = list.getItem(i);
		m = m.multiply(transform.matrix);

		switch (transform.type) {
			case 2: {
				transforms.push({
					type: "translate",
					x: m.e,
					y: -m.f,
				});
				break;
			}

			// 	case 3: {
			// 		transforms.push({
			// 			type: "scale",
			// 			x: m.a,
			// 			y: m.d,
			// 		});
			// 	}

			// 	case 4: {
			// 		transforms.push({
			// 			type: "rotate",
			// 			rotation: transform.angle,
			// 		});
			// 	}

			// 	case 1:
			// 	default:
			// 		const { a, b, c, d, e, f } = m.flipY();
			// 		transforms.push(
			// 			{
			// 				type: "translate",
			// 				x: e,
			// 				y: -f,
			// 			},
			// 			{
			// 				type: "matrix",
			// 				mat: Mat2.new([
			// 					[a, b],
			// 					[c, d],
			// 				]),
			// 			},
			// 		);
			// 		break;
		}
	}

	const { a, b, c, d } = m;
	transforms.push(
		{
			type: "matrix",
			mat: Mat2.new([
				[a, b],
				[c, d],
			]),
		},
		// {
		// 	type: "translate",
		// 	x: e,
		// 	y: -f,
		// },
	);

	return transforms;
};
