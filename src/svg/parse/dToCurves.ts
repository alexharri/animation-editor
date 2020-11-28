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

const parseD = (d: string) => {
	const transformedD = svgpath(d).abs().unarc().unshort().toString();
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

	return commands;
};

export const dToPaths = (d: string) => {
	const paths: Array<{ curves: Curve[]; closed: boolean }> = [];

	let newPath = true;
	let path!: { curves: Curve[]; closed: boolean };
	let prev = Vec2.ORIGIN;

	const commands = parseD(d);

	for (const cmd of commands) {
		if (newPath) {
			newPath = false;
			prev = Vec2.ORIGIN;
			path = { curves: [], closed: false };
			paths.push(path);
		}

		switch (cmd.code) {
			case "M": {
				prev = Vec2.new(cmd.x, cmd.y);
				break;
			}

			case "L": {
				const next = Vec2.new(cmd.x, cmd.y);
				path.curves.push([prev, next]);
				prev = next;
				break;
			}

			case "C": {
				const next = Vec2.new(cmd.x, cmd.y);
				const cp0 = Vec2.new(cmd.x1, cmd.y1);
				const cp1 = Vec2.new(cmd.x2, cmd.y2);
				path.curves.push([prev, cp0, cp1, next]);
				prev = next;
				break;
			}

			case "Z": {
				path.closed = true;
				const lastCurve = path.curves[path.curves.length - 1];
				const p0 = path.curves[0][0];
				const p1 = lastCurve[lastCurve.length - 1];

				if (!p0.eq(p1)) {
					// Received close path command with nodes in different places.
					//
					// Close path with a straight line.
					path.curves.push([p1, p0]);
				}

				newPath = true;
				break;
			}
			default: {
				console.warn(`Unexpected command '${cmd.code}'`);
			}
		}
	}

	return paths;
};
