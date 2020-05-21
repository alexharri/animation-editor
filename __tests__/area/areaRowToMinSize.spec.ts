import { computeAreaRowToMinSize } from "~/area/util/areaRowToMinSize";
import { AreaState } from "~/area/state/areaReducer";

describe("computeAreaRowToMinSize", () => {
	it("works", () => {
		const areaState: AreaState = {
			_id: 0,
			layout: {
				0: {
					id: "0",
					type: "area_row",
					areas: [
						{ id: "2", size: 0.75 },
						{ id: "1", size: 0.25 },
					],
					orientation: "horizontal",
				},
				1: {
					id: "1",
					type: "area_row",
					areas: [
						{ id: "3", size: 0.5 },
						{ id: "4", size: 0.25 },
						{ id: "5", size: 0.25 },
					],
					orientation: "vertical",
				},
				2: { id: "2", type: "area" },
				3: { id: "3", type: "area" },
				4: {
					id: "4",
					type: "area_row",
					areas: [
						{ id: "6", size: 0.5 },
						{ id: "7", size: 0.5 },
					],
					orientation: "horizontal",
				},
				5: { id: "5", type: "area" },
				6: { id: "6", type: "area" },
				7: { id: "7", type: "area" },
			},
			areas: {},
			rootId: "0",
			joinPreview: null,
		};

		const result = computeAreaRowToMinSize(areaState.rootId, areaState.layout);

		expect(result["0"].height).toEqual(3);
		expect(result["0"].width).toEqual(3);

		expect(result["1"].height).toEqual(3);
		expect(result["1"].width).toEqual(2);

		expect(result["4"].height).toEqual(1);
		expect(result["4"].width).toEqual(2);
	});
});
