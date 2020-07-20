import * as mathjs from "mathjs";
import { getExpressionIO } from "~/util/math/expressions";

describe("evaluation", () => {
	test("it produces the expected result", () => {
		{
			const expression = `
            x = time + x;
            y = time + y;
        `;
			const scope = { time: 100, x: 200, y: 100 };
			mathjs.evaluate(expression, scope);
			expect(scope).toEqual({ time: 100, x: 300, y: 200 });
		}

		{
			const expression = `
				x = x + sin(t) * 10;
			`;
			const scope = { x: 100, t: Math.PI / 2 };
			mathjs.evaluate(expression, scope);
			expect(scope).toEqual({ x: 100 + Math.sin(Math.PI / 2) * 10, t: Math.PI / 2 });
		}

		{
			const expression = `
				time = 50;
				x = x + time;
				y = y + time;
			`;
			const scope = { time: null, x: 100, y: 100 };
			mathjs.evaluate(expression, scope);
			expect(scope).toEqual({ time: 50, x: 150, y: 150 });
		}
	});
});

describe("expressionIO", () => {
	test("assignments", () => {
		const expression = `
			out = in;
		`;

		expect(getExpressionIO(expression)).toEqual({
			inputs: ["in"],
			outputs: ["out"],
		});
	});

	test("operations", () => {
		const expression = `
			a * b;
			x + (y / z);
		`;

		expect(getExpressionIO(expression)).toEqual({
			inputs: ["a", "b", "x", "y", "z"],
			outputs: [],
		});
	});

	test("self assignment", () => {
		const expression = `
			x = x;
		`;

		expect(getExpressionIO(expression)).toEqual({
			inputs: ["x"],
			outputs: ["x"],
		});
	});

	test("function arguments", () => {
		const expression = `
			out = sin(time);
		`;

		expect(getExpressionIO(expression)).toEqual({
			inputs: ["time"],
			outputs: ["out"],
		});
	});

	test("objects", () => {
		const expression = `
			out = { x: a, y: b };
		`;

		expect(getExpressionIO(expression)).toEqual({
			inputs: ["a", "b"],
			outputs: ["out"],
		});
	});

	test("arrays", () => {
		const expression = `
			out = [p0, p1];
		`;

		expect(getExpressionIO(expression)).toEqual({
			inputs: ["p0", "p1"],
			outputs: ["out"],
		});
	});
});
