import { getSvgNodeTransformMatrix } from "~/svg/parse/svgNodeTransformMatrix";
import {
	SVGCircleNode,
	SVGEllipseNode,
	SVGLineNode,
	SVGNode,
	SVGPathNode,
	SVGPolygonNode,
	SVGRectNode,
} from "~/svg/svgTypes";

const notPathifiable = (tagName: string) => () => {
	throw new Error(`Cannot pathify '${tagName}' node.`);
};
const c = 0.551915024494;

const applyMatrixToCurves = (node: SVGNode, curves: Curve[]) => {
	const { matrix, translate } = getSvgNodeTransformMatrix(node);

	node.position = translate;

	for (const curve of curves) {
		for (let i = 0; i < curve.length; i++) {
			curve[i] = matrix.multiplyVec2(curve[i]);
		}
	}
};

export const pathifySvgNode: Record<SVGNode["tagName"], (node: SVGNode) => SVGPathNode> = {
	g: notPathifiable("g"),
	circle: (_node): SVGPathNode => {
		const node = _node as SVGCircleNode;
		const { radius, ...rest } = node.properties;

		const position = node.position.sub(Vec2.new(radius, radius));
		const scale = radius * 2;
		const curves: CubicBezier[] = [
			[
				Vec2.new(0, 1).scale(scale).add(position),
				Vec2.new(c, 1).scale(scale).add(position),
				Vec2.new(1, c).scale(scale).add(position),
				Vec2.new(1, 0).scale(scale).add(position),
			],
			[
				Vec2.new(1, 0).scale(scale).add(position),
				Vec2.new(1, -c).scale(scale).add(position),
				Vec2.new(c, -1).scale(scale).add(position),
				Vec2.new(0, -1).scale(scale).add(position),
			],
			[
				Vec2.new(0, -1).scale(scale).add(position),
				Vec2.new(-c, -1).scale(scale).add(position),
				Vec2.new(-1, -c).scale(scale).add(position),
				Vec2.new(-1, 0).scale(scale).add(position),
			],
			[
				Vec2.new(-1, 0).scale(scale).add(position),
				Vec2.new(-1, c).scale(scale).add(position),
				Vec2.new(-c, 1).scale(scale).add(position),
				Vec2.new(0, 1).scale(scale).add(position),
			],
		];

		applyMatrixToCurves(node, curves);

		return {
			...node,
			tagName: "path",
			properties: { d: [{ curves, closed: true }], ...rest },
		};
	},
	rect: (_node): SVGPathNode => {
		const node = _node as SVGRectNode;
		const { width, height, ...rest } = node.properties;

		const curves: Line[] = [
			[Vec2.new(0 * width, 0 * height), Vec2.new(0 * width, 1 * height)],
			[Vec2.new(0 * width, 1 * height), Vec2.new(1 * width, 1 * height)],
			[Vec2.new(1 * width, 1 * height), Vec2.new(1 * width, 0 * height)],
			[Vec2.new(1 * width, 0 * height), Vec2.new(0 * width, 0 * height)],
		];

		applyMatrixToCurves(node, curves);

		return {
			...node,
			tagName: "path",
			properties: { d: [{ curves, closed: true }], ...rest },
		};
	},
	ellipse: (_node): SVGPathNode => {
		const node = _node as SVGEllipseNode;
		const { radius, ...rest } = node.properties;

		const { x, y } = radius;
		const curves: CubicBezier[] = [
			[
				Vec2.new(0 * x, 1 * y),
				Vec2.new(c * x, 1 * y),
				Vec2.new(1 * x, c * y),
				Vec2.new(1 * x, 0 * y),
			],
			[
				Vec2.new(1 * x, 0 * y),
				Vec2.new(1 * x, -c * y),
				Vec2.new(c * x, -1 * y),
				Vec2.new(0 * x, -1 * y),
			],
			[
				Vec2.new(0 * x, -1 * y),
				Vec2.new(-c * x, -1 * y),
				Vec2.new(-1 * x, -c * y),
				Vec2.new(-1 * x, 0 * y),
			],
			[
				Vec2.new(-1 * x, 0 * y),
				Vec2.new(-1 * x, c * y),
				Vec2.new(-c * x, 1 * y),
				Vec2.new(0 * x, 1 * y),
			],
		];

		applyMatrixToCurves(node, curves);

		return {
			...node,
			tagName: "path",
			properties: { d: [{ curves, closed: true }], ...rest },
		};
	},
	line: (_node): SVGPathNode => {
		const node = _node as SVGLineNode;
		const { line, length, ...rest } = node.properties;

		const curves: Line[] = [line];

		applyMatrixToCurves(node, curves);

		return {
			...node,
			tagName: "path",
			properties: { d: [{ curves, closed: false }], ...rest },
		};
	},
	polygon: (_node): SVGPathNode => {
		const node = _node as SVGPolygonNode;
		const { points, ...rest } = node.properties;

		const curves: Line[] = [];

		for (let i = 1; i < points.length; i++) {
			const p0 = points[i - 1];
			const p1 = points[i];
			curves.push([p0, p1]);
		}

		applyMatrixToCurves(node, curves);

		return {
			...node,
			tagName: "path",
			properties: { d: [{ curves, closed: true }], ...rest },
		};
	},
	polyline: (_node): SVGPathNode => {
		const node = _node as SVGPolygonNode;
		const { points, ...rest } = node.properties;

		const curves: Line[] = [];

		for (let i = 1; i < points.length; i++) {
			const p0 = points[i - 1];
			const p1 = points[i];
			curves.push([p0, p1]);
		}

		return {
			...node,
			tagName: "path",
			properties: { d: [{ curves, closed: false }], ...rest },
		};
	},
	path: notPathifiable("path"),
	svg: notPathifiable("svg"),
};
