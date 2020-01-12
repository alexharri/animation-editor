import { areaToRow } from "~/area/util/areaToRow";
import { CardinalDirection } from "~/types";

describe("areaToRow", () => {
	it("works as expected", () => {
		const rowId = "1";
		const idForOldArea = "2";
		const idForNewArea = "3";
		const horizontal = true;
		const cornerParts: [CardinalDirection, CardinalDirection] = ["n", "e"];

		const row = areaToRow(rowId, idForOldArea, idForNewArea, horizontal, cornerParts);

		expect(row.areas[1].id).toEqual(idForNewArea);
		expect(row.areas[1].size).toEqual(0);

		expect(row.areas[0].id).toEqual(idForOldArea);
		expect(row.areas[0].size).toEqual(1);
	});

	/**
	 * @TODO More comprehensive tests with other concers (se, sw, ne, nw)
	 * and horizontal v vertical
	 */
});
