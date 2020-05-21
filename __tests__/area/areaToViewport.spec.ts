import { computeAreaToViewport } from "~/area/util/areaToViewport";
import { AreaState } from "~/area/state/areaReducer";

describe("computeAreaToViewport", () => {
	it("creates a valid viewport", () => {
		const areaState: AreaState = {
			_id: 0,
			layout: {
				0: {
					id: "0",
					type: "area_row",
					areas: [
						{ id: "1", size: 0.25 },
						{ id: "2", size: 0.75 },
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

		const result = computeAreaToViewport(areaState.layout, areaState.rootId, {
			left: 0,
			top: 0,
			width: 1000,
			height: 1000,
		});

		expect(result["0"].height).toEqual(1000);
		expect(result["0"].width).toEqual(1000);

		expect(result["1"].height).toEqual(result["0"].height);
		expect(result["2"].height).toEqual(result["0"].height);
		expect(result["1"].width + result["2"].width).toEqual(result["0"].width);

		expect(result["3"].width).toEqual(result["1"].width);
		expect(result["4"].width).toEqual(result["1"].width);
		expect(result["5"].width).toEqual(result["1"].width);
		expect(result["3"].height + result["4"].height + result["5"].height).toEqual(
			result["1"].height,
		);

		expect(result["6"].height).toEqual(result["4"].height);
		expect(result["7"].height).toEqual(result["4"].height);
		expect(result["6"].width + result["7"].width).toEqual(result["4"].width);
	});
});
