import arcToBezier from "svg-arc-to-cubic-bezier";
import {
	ClosePathCommand,
	CurveToCommand,
	EllipticalArcCommand,
	HorizontalLineToCommand,
	LineToCommand,
	makeAbsolute,
	MoveToCommand,
	parseSVG,
	QuadraticCurveToCommand,
	SmoothCurveToCommand,
	SmoothQuadraticCurveToCommand,
	VerticalLineToCommand,
} from "svg-path-parser";
import svgpath from "svgpath";
import { ShapeState } from "~/shape/shapeReducer";
import {
	ShapeControlPoint,
	ShapeEdge,
	ShapeGraph,
	ShapeNode,
	ShapePath,
	ShapePathItem,
} from "~/shape/shapeTypes";
import { SvgContext } from "~/svg/svgContext";
import { addListToMap, removeKeysFromMap } from "~/util/mapUtils";
import { quadraticToCubicBezier } from "~/util/math";

type SVGCommand =
	| MoveToCommand
	| LineToCommand
	| HorizontalLineToCommand
	| VerticalLineToCommand
	| ClosePathCommand
	| CurveToCommand
	| SmoothCurveToCommand
	| QuadraticCurveToCommand
	| SmoothQuadraticCurveToCommand
	| EllipticalArcCommand;

const parseD = (d: string, position: Vec2) => {
	const transformedD = svgpath(d)
		.abs()
		.unarc()
		.unshort()
		.translate(position.x, position.y)
		.toString();
	const commands = makeAbsolute(parseSVG(transformedD)) as SVGCommand[];
	let xPrev = 0;
	let yPrev = 0;

	for (let i = 0; i < commands.length; i++) {
		const cmd = commands[i];

		switch (cmd.code) {
			case "C":
			case "L":
			case "M": {
				xPrev = cmd.x;
				yPrev = cmd.y;
				break;
			}
			case "V": {
				commands.splice(i, 1, { code: "L", x: xPrev, y: cmd.y, command: "lineto" });
				yPrev = cmd.y;
				break;
			}
			case "H": {
				commands.splice(i, 1, { code: "L", x: cmd.x, y: yPrev, command: "lineto" });
				xPrev = cmd.x;
				break;
			}
			case "Q": {
				const qp0 = Vec2.new(xPrev, yPrev);
				const qp1 = Vec2.new(cmd.x1, cmd.y1);
				const qp2 = Vec2.new(cmd.x, cmd.y);
				const [p0, p1, p2, p3] = quadraticToCubicBezier(qp0, qp1, qp2);
				commands.splice(i, 1, {
					code: "C",
					command: "curveto",
					x1: p1.x,
					y1: p1.y,
					x2: p2.x,
					y2: p2.y,
					x: p3.x,
					y: p3.y,
				});
				xPrev = p0.x;
				yPrev = p0.y;
				break;
			}
			case "A": {
				const { x, y, rx, ry, xAxisRotation, largeArc, sweep } = cmd;
				const curves = arcToBezier({
					px: xPrev,
					py: yPrev,
					cx: x,
					cy: y,
					rx,
					ry,
					xAxisRotation,
					largeArcFlag: largeArc,
					sweepFlag: sweep,
				});

				const replacementCommands = (curves as any[]).map<CurveToCommand>((c: any) => {
					return {
						code: "C",
						command: "curveto",
						...c,
					};
				});
				commands.splice(i, 1, ...replacementCommands);
				const lastCommand = replacementCommands[replacementCommands.length - 1];
				if (lastCommand) {
					xPrev = lastCommand.x;
					yPrev = lastCommand.y;
				} else {
					xPrev = x;
					yPrev = y;
				}
				if (replacementCommands.length === 0) {
					console.log(cmd);
					i--;
				}
				break;
			}
			case "S": {
				const { x, y, x2, y2 } = cmd;

				let p1: Vec2;
				const p2 = Vec2.new(x2, y2);
				const p3 = Vec2.new(x, y);

				const prevCommand = commands[i - 1];
				if (prevCommand && prevCommand.code === "C") {
					const { x2, y2 } = prevCommand;
					p1 = Vec2.new(x2, y2).scale(-1, Vec2.new(xPrev, yPrev));
				} else {
					p1 = Vec2.new(xPrev, yPrev);
				}

				commands.splice(i, 1, {
					code: "C",
					command: "curveto",
					x1: p1.x,
					y1: p1.y,
					x2: p2.x,
					y2: p2.y,
					x: p3.x,
					y: p3.y,
				});
				xPrev = x;
				yPrev = y;
				break;
			}
			case "T": {
				console.log(cmd);
				throw new Error("SVG 'T' commands have not been implemented.");
			}
		}
	}

	const out = [...commands];

	// console.log({ in: inn, out });

	return commands;
};

export const shapeLayerObjectsFromPathD = (
	ctx: SvgContext,
	d: string,
	position: Vec2,
): { pathIds: string[]; shapeState: ShapeState } => {
	const shapes: ShapeGraph[] = [];
	const paths: ShapePath[] = [];
	let nodes: Record<string, ShapeNode> = {};
	let edges: Record<string, ShapeEdge> = {};
	let controlPoints: Record<string, ShapeControlPoint> = {};

	let newPath = true;
	let shape!: ShapeGraph;
	let path!: ShapePath;
	let shapeId!: string;
	let xPrev = 0;
	let yPrev = 0;

	const commands = parseD(d, position);

	for (const cmd of commands) {
		if (newPath) {
			newPath = false;

			xPrev = 0;
			yPrev = 0;

			shape = {
				id: ctx.createShapeId(),
				nodes: [],
				edges: [],
				moveVector: Vec2.ORIGIN,
			};
			shapeId = shape.id;
			shapes.push(shape);

			path = {
				id: ctx.createPathId(),
				shapeId: shape.id,
				items: [],
			};
			paths.push(path);
		}

		switch (cmd.code) {
			case "M": {
				xPrev = cmd.x;
				yPrev = cmd.y;
				break;
			}

			case "L": {
				const { x, y } = cmd;

				let n0: ShapeNode;
				let item0: ShapePathItem;

				if (path.items.length) {
					item0 = path.items[path.items.length - 1];
					n0 = nodes[item0.nodeId];
				} else {
					n0 = {
						id: ctx.createNodeId(),
						position: Vec2.new(xPrev, yPrev),
						shapeId,
					};
					item0 = {
						left: null,
						nodeId: n0.id,
						reflectControlPoints: false,
						right: null,
					};
					shape.nodes.push(n0.id);
					path.items.push(item0);
				}

				const n1: ShapeNode = {
					id: ctx.createNodeId(),
					position: Vec2.new(x, y),
					shapeId,
				};
				const item1: ShapePathItem = {
					left: null,
					nodeId: n1.id,
					reflectControlPoints: false,
					right: null,
				};

				const edge: ShapeEdge = {
					id: ctx.createEdgeId(),
					cp0: "",
					cp1: "",
					n0: n0.id,
					n1: n1.id,
					shapeId,
				};

				item0.right = {
					controlPointId: "",
					edgeId: edge.id,
				};
				item1.left = {
					controlPointId: "",
					edgeId: edge.id,
				};

				shape.nodes.push(n1.id);
				shape.edges.push(edge.id);

				nodes = addListToMap(nodes, [n0, n1], "id");
				edges = addListToMap(edges, [edge], "id");

				path.items.push(item1);

				xPrev = x;
				yPrev = y;
				break;
			}

			case "C": {
				const { x, y } = cmd;

				let n0: ShapeNode;
				let item0: ShapePathItem;

				if (path.items.length) {
					item0 = path.items[path.items.length - 1];
					n0 = nodes[item0.nodeId];
				} else {
					n0 = {
						id: ctx.createNodeId(),
						position: Vec2.new(xPrev, yPrev),
						shapeId,
					};
					item0 = {
						left: null,
						nodeId: n0.id,
						reflectControlPoints: false,
						right: null,
					};
					shape.nodes.push(n0.id);
					path.items.push(item0);
				}

				const n1: ShapeNode = {
					id: ctx.createNodeId(),
					position: Vec2.new(x, y),
					shapeId,
				};
				const item1: ShapePathItem = {
					left: null,
					nodeId: n1.id,
					reflectControlPoints: false,
					right: null,
				};

				const cp0Id = ctx.createControlPointId();
				const cp1Id = ctx.createControlPointId();

				const edge: ShapeEdge = {
					id: ctx.createEdgeId(),
					cp0: cp0Id,
					cp1: cp1Id,
					n0: n0.id,
					n1: n1.id,
					shapeId,
				};

				const cp0: ShapeControlPoint = {
					id: cp0Id,
					edgeId: edge.id,
					position: Vec2.new(cmd.x1, cmd.y1).sub(n0.position),
				};
				const cp1: ShapeControlPoint = {
					id: cp1Id,
					edgeId: edge.id,
					position: Vec2.new(cmd.x2, cmd.y2).sub(n1.position),
				};

				item0.right = {
					controlPointId: cp0.id,
					edgeId: edge.id,
				};
				item1.left = {
					controlPointId: cp1.id,
					edgeId: edge.id,
				};

				shape.nodes.push(n1.id);
				shape.edges.push(edge.id);

				nodes = addListToMap(nodes, [n0, n1], "id");
				edges = addListToMap(edges, [edge], "id");
				controlPoints = addListToMap(controlPoints, [cp0, cp1], "id");

				path.items.push(item1);

				xPrev = x;
				yPrev = y;
				break;
			}

			case "Z": {
				const item0 = path.items[path.items.length - 1];
				const item1 = path.items[0];

				const n0 = nodes[item0.nodeId];
				const n1 = nodes[item1.nodeId];

				if (!n0.position.eq(n1.position)) {
					// Received close path command with nodes in different places.
					//
					// Close path with a straight line.
					const edge: ShapeEdge = {
						cp0: "",
						cp1: "",
						id: ctx.createEdgeId(),
						n0: n0.id,
						n1: n1.id,
						shapeId,
					};
					item0.right = {
						edgeId: edge.id,
						controlPointId: "",
					};
					item1.left = {
						edgeId: edge.id,
						controlPointId: "",
					};
					edges = addListToMap(edges, [edge], "id");
				} else {
					// Remove items[len - 1] and connect items[len - 2] to items[0].
					path.items.pop();
					item1.left = item0.left;
					nodes = removeKeysFromMap(nodes, [item0.nodeId]);
					shape.nodes = shape.nodes.filter((nodeId) => nodeId !== item0.nodeId);
				}

				newPath = true;
				break;
			}
			default: {
				console.log([...commands]);
				console.log({ cmd });
				console.warn(`Unexpected command '${cmd.code}'`);
			}
		}
	}

	const shapeState: ShapeState = {
		controlPoints,
		edges,
		nodes,
		paths: addListToMap({}, paths, "id"),
		shapes: addListToMap({}, shapes, "id"),
	};

	return { shapeState, pathIds: paths.map((path) => path.id) };
};
