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

function applyTransformOrigin(
	boundingBox: [width: number, height: number],
	transformString: string,
	transformOriginString: string,
) {
	let x = 0;
	let y = 0;

	const [xArg, yArg] = transformOriginString.split(/[ ,]+/);

	switch (xArg) {
		case undefined: {
			break;
		}
		case "left": {
			x = 0;
			break;
		}
		case "center": {
			x = boundingBox[0] / 2;
			break;
		}
		case "right": {
			x = boundingBox[0];
			break;
		}
		default: {
			const n = parseFloat(xArg);
			if (!isNaN(n)) {
				x = n;
			}
			break;
		}
	}
	switch (yArg) {
		case undefined: {
			break;
		}
		case "top": {
			y = 0;
			break;
		}
		case "center": {
			y = boundingBox[1] / 2;
			break;
		}
		case "bottom": {
			y = boundingBox[1];
			break;
		}
		default: {
			const n = parseFloat(xArg);
			if (!isNaN(n)) {
				y = n;
			}
			break;
		}
	}

	// From https://www.w3.org/TR/2009/WD-SVG-Transforms-20090320/#transform-origin
	//
	// The 'transform-origin' is the equivalent of the following specification:
	//
	// 		translate(<ox>, <oy>, <oz>) <transform> translate(-<ox>, -<oy>, -<oz>).
	//
	// If a <transform> already specifies a transformation origin the 'transform-origin'
	// is still applied as per the equivalent specification specified above.

	return `translate(${x}, ${y}) ${transformString} translate(${-x}, ${-y})`;
}

export function parseSvgTransform(
	coords: Vec2,
	boundingBox: [width: number, height: number],
	originalTransformString: string,
	transformOriginString: string | undefined,
): LayerTransform {
	let transformString = originalTransformString;

	if (transformOriginString) {
		transformString = applyTransformOrigin(boundingBox, transformString, transformOriginString);
	}

	const reg = /[a-z]+\([-0-9\ \,\.]*\)/g;
	const matches: string[] = [...(transformString.match(reg) || [])];

	let position = Vec2.new(0, 0);
	let rotation = 0;
	let scale = 1;
	const anchor = coords.scale(-1);

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
				if (transformString === "translate(-356.89697 15.51816) rotate(-20.59468)") {
					console.log(command, values);
				}
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
		anchor,
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
