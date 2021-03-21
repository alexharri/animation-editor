import * as PIXI from "pixi.js";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelection } from "~/shape/shapeTypes";
import { mergeItemInMap } from "~/util/mapUtils";
import { getAngleRadians, getDistance, rotateVec2CCW } from "~/util/math";

export const penToolMoveObjects = (
	moveVector: Vec2,
	state: ShapeState,
	shapeId: string,
	selection: ShapeSelection,
	matrix: PIXI.Matrix,
): ShapeState => {
	const selectedNodeIds = Object.keys(selection.nodes);

	const newState: ShapeState = {
		...state,
		nodes: mergeItemInMap(state.nodes, selectedNodeIds, (node) => ({
			position: node.position.add(moveVector),
		})),
		controlPoints: { ...state.controlPoints },
		paths: { ...state.paths },
	};

	const applyMoveVectorToCp = (cpId: string) => {
		const cp = state.controlPoints[cpId]!;
		newState.controlPoints[cpId] = { ...cp, position: cp.position.add(moveVector) };
	};

	const edgeIds = state.shapes[shapeId].edges;
	for (const edgeId of edgeIds) {
		const edge = newState.edges[edgeId];

		if (selection.controlPoints[edge.cp0] && !selection.nodes[edge.n0]) {
			applyMoveVectorToCp(edge.cp0);
		}

		if (selection.controlPoints[edge.cp1] && !selection.nodes[edge.n1]) {
			applyMoveVectorToCp(edge.cp1);
		}
	}

	const pathIds = Object.keys(state.paths).filter(
		(pathId) => state.paths[pathId].shapeId === shapeId,
	);
	for (const pathId of pathIds) {
		let path = newState.paths[pathId];

		for (let i = 0; i < path.items.length; i++) {
			const item = path.items[i];
			if (
				!item.reflectControlPoints ||
				!item.left?.controlPointId ||
				!item.right?.controlPointId
			) {
				continue;
			}

			const node = newState.nodes[item.nodeId];
			const cpl = item.left.controlPointId;
			const cpr = item.right.controlPointId;

			const sl = selection.controlPoints[cpl];
			const sr = selection.controlPoints[cpr];

			if (!sl && !sr) {
				// Neither is affected. Continue
				continue;
			}

			if (sl && sr) {
				// Both control points were moved. Control points are no longer
				// being reflected
				path = {
					...path,
					items: path.items.map((item, index) => {
						if (i !== index) {
							return item;
						}
						return { ...item, reflectControlPoints: false };
					}),
				};
				newState.paths[pathId] = path;
				continue;
			}

			// Either left or right are reflecting the other
			const cp0 = newState.controlPoints[sl ? cpl : cpr]!;
			const cp1 = newState.controlPoints[sr ? cpl : cpr]!;

			const g_nodePos = node.position.apply((vec) => matrix.apply(vec));
			const g_cp0 = node.position.add(cp0.position).apply((vec) => matrix.apply(vec));
			const g_cp1 = node.position.add(cp1.position).apply((vec) => matrix.apply(vec));

			const dist = getDistance(g_nodePos, g_cp1);
			const angle = getAngleRadians(g_nodePos, g_cp0);

			const g_cp1Reflected = rotateVec2CCW(Vec2.new(dist, 0), angle + Math.PI).add(g_nodePos);
			const cp1Reflected = g_cp1Reflected
				.apply((vec) => matrix.applyInverse(vec))
				.sub(node.position);

			newState.controlPoints[cp1.id] = {
				...cp1,
				position: cp1Reflected,
			};
		}
	}

	return newState;
};

export const penToolMovePathIds = (
	moveVector: Vec2,
	state: ShapeState,
	pathIds: string[],
): ShapeState => {
	const nodeIds: string[] = [];

	for (const pathId of pathIds) {
		const { items } = state.paths[pathId];
		for (const item of items) {
			nodeIds.push(item.nodeId);
		}
	}

	const newState: ShapeState = {
		...state,
		nodes: mergeItemInMap(state.nodes, nodeIds, (node) => ({
			position: node.position.add(moveVector),
		})),
	};

	return newState;
};
