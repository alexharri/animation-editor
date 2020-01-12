import "~/globals";

import { exceedsDirectionVector } from "~/util/math/exceedsDirectionVector";

describe("exceedsDirectionVector", () => {
	it("returns true if the vector exceeds the distance value", () => {
		expect(exceedsDirectionVector({ x: 1, y: 0 }, 5, Vec2.new(1, 0))).toBe("");
		expect(exceedsDirectionVector({ x: 1, y: 0 }, 5, Vec2.new(5, 0))).toBe("x");
		expect(exceedsDirectionVector({ x: 1, y: 0 }, 5, Vec2.new(10, 0))).toBe("x");
	});

	it("correctly deals with negative and positive values", () => {
		expect(exceedsDirectionVector({ x: 0, y: 1 }, 10, Vec2.new(0, 10))).toBe("y");
		expect(exceedsDirectionVector({ x: 0, y: 1 }, 10, Vec2.new(0, -10))).toBe("");

		expect(exceedsDirectionVector({ x: 0, y: -1 }, 10, Vec2.new(0, 10))).toBe("");
		expect(exceedsDirectionVector({ x: 0, y: -1 }, 10, Vec2.new(0, -10))).toBe("y");

		expect(exceedsDirectionVector({ x: 1, y: 0 }, 10, Vec2.new(10, 0))).toBe("x");
		expect(exceedsDirectionVector({ x: 1, y: 0 }, 10, Vec2.new(-10, 0))).toBe("");

		expect(exceedsDirectionVector({ x: -1, y: 0 }, 10, Vec2.new(10, 0))).toBe("");
		expect(exceedsDirectionVector({ x: -1, y: 0 }, 10, Vec2.new(-10, 0))).toBe("x");
	});
});
