import { ShapeState } from "~/shape/shapeReducer";
import { getShapeEdgeAsPath, getShapeNodeToEdges } from "~/shape/shapeUtils";

export const getShapePath = (
	shapeId: string,
	shapeState: ShapeState,
	transformFn?: (vec: Vec2) => Vec2,
): Array<Line | CubicBezier> | null => {
	const shape = shapeState.shapes[shapeId];
	const nodeToEdgeIds = getShapeNodeToEdges(shapeId, shapeState);

	if (shape.nodes.length < 2) {
		return null;
	}

	const paths: Array<Line | CubicBezier> = [];

	let lastEdgeId: string | undefined;
	let node = shapeState.nodes[shape.nodes[0]];

	while (true) {
		const edgeIds = nodeToEdgeIds[node.id];

		if (edgeIds.length > 2) {
			throw new Error(`Expected a circular path. Node ${node.id} has more than 2 edges.`);
		}

		let edgeId: string;

		if (!lastEdgeId) {
			edgeId = edgeIds[0];
		} else {
			edgeId = edgeIds[0] !== lastEdgeId ? edgeIds[0] : edgeIds[1];
		}

		if (!edgeId) {
			break;
		}

		const edge = shapeState.edges[edgeId];
		const nextNodeId = edge.n0 !== node.id ? edge.n0 : edge.n1;

		if (!nextNodeId) {
			break;
		}

		// Add node -> next as path
		const path = getShapeEdgeAsPath(node.id, edge, shapeState);

		if (transformFn) {
			for (let i = 0; i < path.length; i += 1) {
				path[i] = transformFn(path[i]);
			}
		}

		paths.push(path);

		lastEdgeId = edgeId;
		node = shapeState.nodes[nextNodeId];
	}

	return paths;
};
