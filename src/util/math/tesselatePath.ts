import { Point2D } from "kld-affine";
import { CubicBezier2D } from "kld-contours";

export const tesselateCurves = (
	graphic: PIXI.Graphics,
	curves: Array<Line | CubicBezier>,
	closed: boolean,
) => {
	try {
		const scale = 100;
		const cpr = new ClipperLib.Clipper();

		const points: Array<{ X: number; Y: number }> = [];

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
			points.push(..._points.map(({ x, y }) => ({ X: x * scale, Y: y * scale })));
		}

		cpr.AddPath(points, ClipperLib.PolyType.ptSubject, closed);
		const solution_polytree = new ClipperLib.PolyTree();
		const succeeded = cpr.Execute(
			ClipperLib.ClipType.ctNo,
			solution_polytree,
			// ClipperLib.PolyFillType.pftNonZero,
			// ClipperLib.PolyFillType.pftNonZero,
		);

		if (!succeeded) {
			return { closedPaths: [], openPaths: [] };
		}

		const solution_closed_paths = ClipperLib.Clipper.ClosedPathsFromPolyTree(solution_polytree);
		const solution_open_paths = ClipperLib.Clipper.OpenPathsFromPolyTree(solution_polytree);

		// const simplified = solution_closed_paths.map((poly) =>
		// 	ClipperLib.Clipper.SimplifyPolygon(poly, ClipperLib.PolyFillType.pftEvenOdd),
		// );

		// // console.log(simplified);

		// const result = ([...simplified, ...solution_open_paths] as any[]).map<Array<[number, number]>>(
		// 	(path: any[]) => path.map<[number, number]>((point: any) => [point.X, point.Y]),
		// );
		// // console.log(result.length);
		// // console.log(result);
		// return result;

		// console.log(solution_closed_paths);
		const simplified = [solution_closed_paths];
		// const simplified = solution_closed_paths.map((poly) =>
		// 	ClipperLib.Clipper.SimplifyPolygon(poly, ClipperLib.PolyFillType.pftNegative),
		// );

		// const result = (simplified as any[]).map<Array<[number, number]>>((paths: any[]) => {
		// 	return paths.map((path: any[]) => {
		// 		return path.map<[number, number]>((point: any) => [point.X, point.Y]);
		// 	});
		// });
		// const result = ([...simplified, ...solution_open_paths] as any[]).map<Array<[number, number]>>(
		// 	(path: any[]) => path.map<[number, number]>((point: any) => [point.X, point.Y]),
		// );
		const closedPaths = [];
		for (let i = 0; i < simplified.length; i++) {
			const x = simplified[i];
			for (let j = 0; j < x.length; j++) {
				const y = x[j];
				const arr = [];
				for (let k = 0; k < y.length; k++) {
					const { X, Y } = y[k];
					arr.push([X / scale, Y / scale]);
				}
				closedPaths.push(arr);
			}
		}
		const openPaths = [];
		for (let i = 0; i < solution_open_paths.length; i++) {
			const x = solution_open_paths[i];
			for (let j = 0; j < x.length; j++) {
				const y = x[j];
				const arr = [];
				for (let k = 0; k < y.length; k++) {
					const { X, Y } = y[k];
					arr.push([X / scale, Y / scale]);
				}
				openPaths.push(arr);
			}
		}
		console.log(closedPaths);
		return { closedPaths, openPaths };
	} catch (e) {
		return { closedPaths: [], openPaths: [] };
	}
};
