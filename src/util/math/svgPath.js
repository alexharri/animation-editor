function isBetweenOrOnPoints([x, y], a, b) {
	let xmin = Math.min(a[0], b[0]);
	let xmax = Math.max(a[0], b[0]);
	let ymin = Math.min(a[1], b[1]);
	let ymax = Math.max(a[1], b[1]);

	return x >= xmin && x <= xmax && y >= ymin && y <= ymax;
}

function isBetweenPoints(c, a, b) {
	let isOneOfPoints = isSamePoint(c, a) || isSamePoint(c, b);
	return isBetweenOrOnPoints(c, a, b) && !isOneOfPoints;
}

function isSamePoint([xa, ya], [xb, yb]) {
	return xa === xb && ya === yb;
}

function isToLeftOfLine([intersection, a, c], polygon) {
	let b = a + 1;
	let d = c + 1;
	let [cx, cy] = polygon[isSamePoint(intersection, polygon[d]) ? c : d]; // TODO: assumption, watch out
	let [ax, ay] = polygon[isSamePoint(intersection, polygon[a]) ? a - 1 : a];
	let [bx, by] = polygon[isSamePoint(intersection, polygon[b]) ? b + 1 : b];
	let [sx, sy] = intersection;

	let alpha = Math.atan2(ay - sy, ax - sx);
	let beta = Math.atan2(by - sy, bx - sx);
	let gamma = Math.atan2(cy - sy, cx - sx);

	beta -= alpha;
	gamma -= alpha;

	if (beta < 0) {
		beta += 2 * Math.PI;
	}
	if (gamma < 0) {
		gamma += 2 * Math.PI;
	}

	return gamma === beta ? undefined : gamma < beta;
}

function isActualIntersection(entry, exit, polygon) {
	let entryData = isToLeftOfLine(entry, polygon);
	let exitData = isToLeftOfLine(exit, polygon);

	if (entryData === undefined || exitData === undefined) {
		return undefined;
	}

	return entryData !== exitData;
}

function getCachedIntersection([xc, yc], [xd, yd], cache) {
	let p = xc * cache[0] + yc * cache[1] + cache[2];
	let q = xd * cache[0] + yd * cache[1] + cache[2];
	let r = p / (p - q);

	if (!isFinite(r)) {
		return p === 0 && q === 0;
	}

	return [xc + (xd - xc) * r, yc + (yd - yc) * r];
}

function getIntersectionCache([xa, ya], [xb, yb]) {
	return [yb - ya, xa - xb, ya * xb - xa * yb];
}

function getIntersection(a, b, c, d) {
	return getCachedIntersection(c, d, getIntersectionCache(a, b));
}

export function getPolygonIntersections(polygon) {
	// line segments are indexed by the first point in the polygon that it's part of
	// intersection = [[x, y], segmentA, segmentB]
	let intersections = [];
	// indefinite intersections are those that are only the entry part, the exit still
	// has to be determined
	let indefinite;
	// cache part of intersection calculations. due to the simplicity of the calculations
	// it probably has a negative effect
	let caches = [];

	// a = 1st point of 1st line segment, b = 2nd point of 1st line segment,
	// c = 1st point of 2nd line segment, d = 2nd point of 2nd line segment
	for (let c = 0; c < polygon.length - 1; c++) {
		let d = c + 1;
		caches.push(getIntersectionCache(polygon[c], polygon[d]));

		for (let a = 0; a < c - 1; a++) {
			let b = a + 1;
			let intersection = getCachedIntersection(polygon[c], polygon[d], caches[a]);

			// no or infinite intersection
			if (intersection === false || intersection === true) {
				continue;
			}

			// intersection is between begin and endpoint of polygon, and polygon
			// begins and ends in the same point
			// that's the same as line segments intersecting with the previous
			// segment, which is also ignored by looping until c - 1 instead of c
			if (
				a === 0 &&
				c === polygon.length - 2 &&
				isSamePoint(intersection, polygon[a]) &&
				isSamePoint(intersection, polygon[d])
			) {
				continue;
			}

			// intersection with line but not line segments
			if (
				!isBetweenOrOnPoints(intersection, polygon[a], polygon[b]) ||
				!isBetweenOrOnPoints(intersection, polygon[c], polygon[d])
			) {
				continue;
			}

			// no definitive intersection
			if (
				(isSamePoint(intersection, polygon[a]) && isSamePoint(polygon[a], polygon[c])) ||
				(isSamePoint(intersection, polygon[a]) && isSamePoint(polygon[a], polygon[d]))
			) {
				continue;
			} else if (
				!isBetweenPoints(intersection, polygon[a], polygon[b]) ||
				!isBetweenPoints(intersection, polygon[c], polygon[d])
			) {
				if (indefinite) {
					let isIntersection = isActualIntersection(
						indefinite,
						[intersection, a, c],
						polygon,
					);
					if (isIntersection === undefined) {
						// parallel line, no exit yet
					} else if (isIntersection) {
						intersections.push(indefinite);
						indefinite = undefined;
					} else {
						indefinite = undefined;
					}
				} else {
					indefinite = [intersection, a, c];
				}
			} else {
				intersections.push([intersection, a, c]);
			}
		}
	}

	return intersections;
}

export function removePolygonIntersections(polygon) {
	const original = polygon.slice();
	let intersections = getPolygonIntersections(polygon);

	let pointsToInsert = intersections.reduce((points, [point, a, c], i) => {
		if (!points[a]) {
			points[a] = [];
		}
		if (!points[c]) {
			points[c] = [];
		}

		points[a].push([...point, -1, point]);
		points[c].push([...point, 1, point]);

		return points;
	}, {});

	for (let index in pointsToInsert) {
		let points = pointsToInsert[index].sort(
			(a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2],
		);
		polygon.splice(polygon.indexOf(original[+index + 1]), 0, ...points);
	}

	for (let [intersection] of intersections) {
		const [min, max] = polygon.reduce(
			(array, point, index) => (point[3] === intersection && array.push(index), array),
			[],
		);

		polygon[min].splice(2);
		polygon[max].splice(2);

		polygon = [
			...polygon.slice(0, min + 1),
			...polygon.slice(min + 1, max).reverse(),
			...polygon.slice(max),
		];
	}

	return polygon;
}

export function removeRedundantPoints(polygon) {
	return polygon
		.filter(([x, y], i) => {
			if (i === 0) {
				return true;
			}

			// duplicate points
			let [xp, yp] = polygon[i - 1];
			if (xp === x && yp === y) {
				return false;
			}

			return true;
		})
		.filter(([bx, by], i, polygon) => {
			if (i === 0 || i === polygon.length - 1) {
				return true;
			}

			// redundant points (point of 180deg)
			let [ax, ay] = polygon[i - 1];
			let [cx, cy] = polygon[i + 1];
			return Math.abs(Math.atan2(bx - ax, by - ay) - Math.atan2(cx - bx, cy - by));
		});
}

export function normalizePolygonDirection(polygon) {
	let xmax = -Infinity;
	let ymax;
	let xindex = -1;

	for (let [i, [x, y]] of Object.entries(polygon)) {
		if (x > xmax) {
			xmax = x;
			ymax = y;
			xindex = +i;
		}
	}

	let clockwise;
	for (let i = 1; clockwise === undefined && i < (polygon.length + 1) / 2; i++) {
		let prev = polygon[(polygon.length + xindex - i) % polygon.length];
		let next = polygon[(polygon.length + xindex + i) % polygon.length];

		if (prev[1] !== next[1]) {
			clockwise = prev[1] < next[1];
		} else if (prev[0] !== next[0] && prev[1] !== ymax) {
			clockwise = prev[1] < ymax === prev[0] > next[0];
		} else {
			continue;
		}
	}

	// clockwise is only undefined when the polygon is just a polyline,
	// in which case the direction *is* undefined

	if (clockwise) {
		return polygon;
	} else {
		return polygon.reverse();
	}
}

export function normalizePolygon(polygon) {
	return normalizePolygonDirection(removeRedundantPoints(removePolygonIntersections(polygon)));
}
