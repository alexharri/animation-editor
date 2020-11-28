import { ShapeState } from "~/shape/shapeReducer";
import {
	ShapeControlPoint,
	ShapeEdge,
	ShapeGraph,
	ShapeNode,
	ShapePath,
	ShapePathItem,
} from "~/shape/shapeTypes";
import { CompositionFromSvgContext } from "~/svg/composition/compositionFromSvgContext";
import { addListToMap, removeKeysFromMap } from "~/util/mapUtils";

export const shapeLayerFromCurves = (
	ctx: CompositionFromSvgContext,
	pathCurves: Array<{ curves: Curve[]; closed: boolean }>,
): { pathIds: string[]; shapeState: ShapeState } => {
	const shapes: ShapeGraph[] = [];
	const paths: ShapePath[] = [];
	let nodes: Record<string, ShapeNode> = {};
	let edges: Record<string, ShapeEdge> = {};
	let controlPoints: Record<string, ShapeControlPoint> = {};

	let shape!: ShapeGraph;
	let path!: ShapePath;
	let shapeId!: string;

	const onCurve = (curve: Curve) => {
		const p0 = curve[0];
		const p1 = curve.length === 4 ? curve[1] : undefined;
		const p2 = curve.length === 4 ? curve[2] : undefined;
		const p3 = curve[curve.length - 1];

		let n0: ShapeNode;
		let item0: ShapePathItem;

		if (path.items.length) {
			item0 = path.items[path.items.length - 1];
			n0 = nodes[item0.nodeId];
		} else {
			n0 = {
				id: ctx.createNodeId(),
				position: p0,
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
			position: p3,
			shapeId,
		};
		const item1: ShapePathItem = {
			left: null,
			nodeId: n1.id,
			reflectControlPoints: false,
			right: null,
		};

		const cp0Id = p1 ? ctx.createControlPointId() : "";
		const cp1Id = p2 ? ctx.createControlPointId() : "";

		const edge: ShapeEdge = {
			id: ctx.createEdgeId(),
			cp0: cp0Id,
			cp1: cp1Id,
			n0: n0.id,
			n1: n1.id,
			shapeId,
		};

		if (p1 && p2) {
			const cp0: ShapeControlPoint = {
				id: cp0Id,
				edgeId: edge.id,
				position: p1.sub(p0),
			};
			const cp1: ShapeControlPoint = {
				id: cp1Id,
				edgeId: edge.id,
				position: p2.sub(p3),
			};
			controlPoints = addListToMap(controlPoints, [cp0, cp1], "id");
		}
		item0.right = {
			controlPointId: cp0Id,
			edgeId: edge.id,
		};
		item1.left = {
			controlPointId: cp1Id,
			edgeId: edge.id,
		};

		shape.nodes.push(n1.id);
		shape.edges.push(edge.id);

		nodes = addListToMap(nodes, [n0, n1], "id");
		edges = addListToMap(edges, [edge], "id");

		path.items.push(item1);
	};

	for (const { curves, closed } of pathCurves) {
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

		for (const curve of curves) {
			onCurve(curve);
		}

		if (closed) {
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
