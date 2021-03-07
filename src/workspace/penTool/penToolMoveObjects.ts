import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelection } from "~/shape/shapeTypes";
import { mergeItemInMap } from "~/util/mapUtils";
import { getAngleRadians, getDistance, rotateVec2CCW } from "~/util/math";

export const penToolMoveObjects = (
	moveVector: Vec2,
	state: ShapeState,
	shapeId: string,
	selection: ShapeSelection,
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

			const dist = getDistance(Vec2.new(0, 0), cp1.position);
			const angle = getAngleRadians(Vec2.new(0, 0), cp0.position);

			newState.controlPoints[cp1.id] = {
				...cp1,
				position: rotateVec2CCW(Vec2.new(dist, 0), angle + Math.PI),
			};
		}
	}

	return newState;
};
