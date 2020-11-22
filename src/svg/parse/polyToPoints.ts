export const pointStringToPoints = (pointString: string): Vec2[] => {
	const numbers = pointString
		.split(/[ ,]+/)
		.filter(Boolean)
		.map((str) => parseFloat(str));

	const points: Vec2[] = [];

	for (let i = 2; i + 1 < numbers.length; i += 2) {
		const x = numbers[i];
		const y = numbers[i + 1];
		points.push(Vec2.new(x, y));
	}

	return points;
};
