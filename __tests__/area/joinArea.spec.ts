import { joinAreas } from "~/area/util/joinArea";
import { AreaRowLayout, AreaLayout } from "~/types/areaTypes";

describe("joinArea", () => {
	it("throws if indices are out of bounds", () => {
		const row: AreaRowLayout = {
			type: "area_row",
			id: "0",
			orientation: "horizontal",
			areas: [
				{ id: "1", size: 1 },
				{ id: "2", size: 1 },
				{ id: "3", size: 1 },
			],
		};
		expect(() => joinAreas(row, 0, -1)).toThrow();
		expect(() => joinAreas(row, 3, -1)).toThrow();
		expect(() => joinAreas(row, 2, 1)).toThrow();
	});

	it("joins the area at 'areaIndex' into the area at 'areaIndex' + 'join'", () => {
		const row: AreaRowLayout = {
			type: "area_row",
			id: "0",
			orientation: "horizontal",
			areas: [
				{ id: "1", size: 1 },
				{ id: "2", size: 1 },
				{ id: "3", size: 1 },
			],
		};
		const { area: area, removedAreaId } = joinAreas(row, 1, -1);
		const newRow = area as AreaRowLayout;
		expect(newRow.type).toEqual("area_row");
		expect(newRow.areas.length).toEqual(2);
		expect(newRow.areas[0].id).toEqual("2");
		expect(newRow.areas[0].size).toEqual(2);
		expect(removedAreaId).toEqual("1");
	});

	it("joins an 'area_row' into an 'area' if there are two areas", () => {
		const row: AreaRowLayout = {
			type: "area_row",
			id: "0",
			orientation: "horizontal",
			areas: [
				{ id: "1", size: 1 },
				{ id: "2", size: 1 },
			],
		};
		const { area: area, removedAreaId } = joinAreas(row, 1, -1);
		const newArea = area as AreaLayout;
		expect(newArea.type).toEqual("area");
		expect(newArea.id).toEqual("2");
		expect(removedAreaId).toEqual("1");
	});
});
