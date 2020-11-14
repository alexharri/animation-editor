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

export const shapeLayerObjectsFromPolygon = (
	ctx: SvgContext,
	pointString: string,
): { pathIds: string[]; shapeState: Partial<ShapeState> } => {
	let nodes: Record<string, ShapeNode> = {};
	let edges: Record<string, ShapeEdge> = {};
	let controlPoints: Record<string, ShapeControlPoint> = {};

	const shape: ShapeGraph = {
		id: ctx.createShapeId(),
		nodes: [],
		edges: [],
		moveVector: Vec2.ORIGIN,
	};
	const path: ShapePath = {
		id: ctx.createPathId(),
		shapeId: shape.id,
		items: [],
	};

	const points = pointString.split(/[ ,]+/).map((str) => parseFloat(str));

	for (let i = 0; i < points.length; i++) {
		if (isNaN(points[i])) {
			throw new Error(`NaN point at index ${i} from polygon points string '${pointString}'.`);
		}
	}

	let xPrev = points[0];
	let yPrev = points[1];

	for (let i = 2; i < points.length; i += 2) {
		const x = points[i];
		const y = points[i + 1];

		let n0: ShapeNode;
		let item0: ShapePathItem;

		if (path.items.length) {
			item0 = path.items[path.items.length - 1];
			n0 = nodes[item0.nodeId];
		} else {
			n0 = {
				id: ctx.createNodeId(),
				position: Vec2.new(xPrev, yPrev),
				shapeId: shape.id,
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
			shapeId: shape.id,
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
			shapeId: shape.id,
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
	}

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
			shapeId: shape.id,
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

	const shapeState: Partial<ShapeState> = {
		controlPoints,
		edges,
		nodes,
		paths: { [path.id]: path },
		shapes: { [shape.id]: shape },
	};

	return { shapeState, pathIds: [path.id] };
};
