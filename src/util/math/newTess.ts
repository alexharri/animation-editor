import { Point2D } from "kld-affine";
import { CubicBezier2D } from "kld-contours";
import simplepolygon from "simplepolygon";

export const newTess = (curves: Array<Line | CubicBezier>) => {
	const points: Array<[number, number]> = [];

	for (let i = 0; i < curves.length; i++) {
		const curve = curves[i];
		let _points: Vec2[];

		if (curve.length === 4) {
			const result = new CubicBezier2D(
				new Point2D(curve[0].x, curve[0].y),
				new Point2D(curve[1].x, curve[1].y),
				new Point2D(curve[2].x, curve[2].y),
				new Point2D(curve[3].x, curve[3].y),
			).toPolygon2D();
			_points = result.points;
		} else {
			_points = curve;
		}
		points.push(..._points.map(({ x, y }) => [x, y] as [number, number]));
	}

	// `simplepolygon` requires that polygons have 4 or more points
	if (points.length < 4) {
		return [points];
	}

	for (let i = 1; i < points.length; i++) {
		const a = points[i - 1];
		const b = points[i];
		if (a[0] === b[0] && a[1] === b[1]) {
			points.splice(i, 1);
			i--;
		}
	}

	const result = simplepolygon({
		type: "Feature",
		geometry: {
			type: "Polygon",
			coordinates: [points],
		},
	});

	return result.features.map((item: any) => item.geometry.coordinates[0]);
};
