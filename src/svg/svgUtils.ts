import { ShapeNode } from "~/shape/shapeTypes";
import { interpolate } from "~/util/math";

export const getPathNodesBoundingBoxCenter = (
	nodes: Record<string, ShapeNode>,
): [cx: number, cy: number] => {
	const xArr: number[] = [];
	const yArr: number[] = [];

	for (const nodeId in nodes) {
		const node = nodes[nodeId];
		xArr.push(node.position.x);
		yArr.push(node.position.y);
	}

	const xMin = Math.min(...xArr);
	const yMin = Math.min(...yArr);

	const xMax = Math.max(...xArr);
	const yMax = Math.max(...yArr);

	const cx = interpolate(xMin, xMax, 0.5);
	const cy = interpolate(yMin, yMax, 0.5);

	return [cx, cy];
};
