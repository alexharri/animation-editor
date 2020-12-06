import { DEG_TO_RAD_FAC } from "~/constants";
import { SVGNodeBase } from "~/svg/svgTypes";
import { Mat2 } from "~/util/math/mat";

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

export function svgNodeBaseFromTransform(
	position: Vec2,
	boundingBox: [width: number, height: number],
	originalTransformString: string,
	transformOriginString: string | undefined,
): SVGNodeBase {
	let transformString = originalTransformString;

	if (transformOriginString) {
		transformString = applyTransformOrigin(boundingBox, transformString, transformOriginString);
	}

	const reg = /[a-z]+\([-0-9\ \,\.]*\)/g;
	const matches: string[] = [...(transformString.match(reg) || [])];

	let translate = Vec2.new(0, 0);
	let rotation = 0;
	let scale = 1;
	const anchor = position.scale(-1);

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
				let [x, y] = values;
				if (typeof y !== "number") {
					y = 0;
				}
				if (typeof x !== "number") {
					console.warn(`Invalid translate transform '${transformStr}'`);
					break;
				}
				translate = translate.add(Vec2.new(x, y));
				break;
			}
			case "rotate": {
				const [angleDeg] = values;
				if (typeof angleDeg !== "number") {
					console.warn(`Invalid rotate transform '${transformStr}'`);
					break;
				}
				rotation += angleDeg;
				break;
			}
			case "scale": {
				const [scale] = values;
				if (typeof scale !== "number") {
					console.warn(`Invalid rotate transform '${transformStr}'`);
					break;
				}
				translate = translate.scale(scale);
				break;
			}
		}
	}

	return {
		anchor,
		rotation,
		scale: Vec2.new(scale, scale),
		position: translate,
		transform: originalTransformString,
		transformOrigin: transformOriginString || "",
	};
}

export function matrixAndTranslateFromSvgTransform(
	position: Vec2,
	boundingBox: [width: number, height: number],
	originalTransformString: string,
	transformOriginString: string | undefined,
): { matrix: Mat2; translate: Vec2 } {
	let transformString = originalTransformString;

	if (transformOriginString) {
		transformString = applyTransformOrigin(boundingBox, transformString, transformOriginString);
	}

	const reg = /[a-z]+\([-0-9e\ \,\.]*\)/g;
	const matches: string[] = [...(transformString.match(reg) || [])];

	let translate = Vec2.new(0, 0);
	let matrix = Mat2.identity();

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
				translate = translate.add(Vec2.new(x, y));
				break;
			}
			case "rotate": {
				const [angleDeg] = values;
				if (typeof angleDeg !== "number") {
					console.warn(`Invalid rotate transform '${transformStr}'`);
				}
				matrix = matrix.rotate(angleDeg * DEG_TO_RAD_FAC);
				break;
			}
			case "scale": {
				const [s] = values;
				if (typeof s !== "number") {
					console.warn(`Invalid rotate transform '${transformStr}'`);
				}
				matrix = matrix.scale(s);
				break;
			}
			case "matrix": {
				const [a, b, c, d, translateX, translateY] = values;
				matrix = matrix.multiplyMat2(
					Mat2.new([
						[a, b],
						[c, d],
					]),
				);
				translate = translate
					.add(Vec2.new(translateX, translateY))
					.add(position.multiplyMat2(matrix));
			}
		}
	}

	return {
		matrix,
		translate,
	};
}
