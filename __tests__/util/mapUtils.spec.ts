import { removeKeysFromMap, addListToMap, modifyItemInMap, reduceMap } from "~/util/mapUtils";

describe("removeKeysFromMap", () => {
	test("it removes a single key", () => {
		const input: { [key: string]: number } = {
			a: 1,
			b: 2,
			c: 3,
		};
		const output = {
			a: 1,
			c: 3,
		};
		expect(removeKeysFromMap(input, ["b"])).toEqual(output);
	});

	test("it removes multiple keys", () => {
		const input: { [key: string]: number } = {
			a: 1,
			b: 2,
			c: 3,
		};
		const output = {
			a: 1,
		};
		expect(removeKeysFromMap(input, ["b", "c"])).toEqual(output);
	});

	test("it does not modify the original object", () => {
		const input: { [key: string]: number } = {
			a: 1,
			b: 2,
			c: 3,
		};
		const copyOfInput = { ...input };
		const output = {
			a: 1,
			c: 3,
		};
		expect(removeKeysFromMap(input, ["b"])).toEqual(output);
		expect(input).toEqual(copyOfInput);
	});
});

describe("addListToMap", () => {
	test("it adds a list of items to a map", () => {
		{
			const input: { [key: string]: { id: string; value: number } } = {
				a: { id: "a", value: 1 },
			};
			const items = [{ id: "b", value: 2 }];
			const output: { [key: string]: { id: string; value: number } } = {
				a: { id: "a", value: 1 },
				b: { id: "b", value: 2 },
			};
			expect(addListToMap(input, items, "id")).toEqual(output);
		}

		{
			// With a different id field
			const input: { [key: string]: { key: string; value: number } } = {
				a: { key: "a", value: 1 },
			};
			const items = [{ key: "b", value: 2 }];
			const output: { [key: string]: { key: string; value: number } } = {
				a: { key: "a", value: 1 },
				b: { key: "b", value: 2 },
			};
			expect(addListToMap(input, items, "key")).toEqual(output);
		}
	});

	test("it overrides existing items in the map", () => {
		const input: { [key: string]: { id: string; value: number } } = {
			a: { id: "a", value: 1 },
			b: { id: "b", value: 3 },
		};
		const items = [{ id: "b", value: 2 }];
		const output: { [key: string]: { id: string; value: number } } = {
			a: { id: "a", value: 1 },
			b: { id: "b", value: 2 },
		};
		expect(addListToMap(input, items, "id")).toEqual(output);
	});
});

describe("modifyItemInMap", () => {
	test("it modifies a single item by id in the map", () => {
		{
			const input: { [key: string]: number } = {
				a: 1,
				b: 2,
			};
			const output = {
				a: 1,
				b: 4,
			};
			expect(modifyItemInMap(input, "b", (value) => value * 2)).toEqual(output);
		}

		{
			const input: { [key: string]: { id: string; value: number } } = {
				a: { id: "a", value: 1 },
				b: { id: "b", value: 2 },
			};
			const output: { [key: string]: { id: string; value: number } } = {
				a: { id: "a", value: 1 },
				b: { id: "b", value: 4 },
			};
			expect(
				modifyItemInMap(input, "b", (item) => ({
					...item,
					value: item.value * 2,
				})),
			).toEqual(output);
		}
	});

	it("throws an error if the provided key does not exist in map", () => {
		const input: { [key: string]: number } = {
			a: 5,
		};
		expect(() => modifyItemInMap(input, "b", (value) => value * 2)).toThrow();
	});
});

describe("reduceMap", () => {
	test("it correctly reduces a map", () => {
		const input: { [key: string]: number } = {
			a: 1,
			b: 2,
		};
		const output: { [key: string]: number } = {
			a: 2,
			b: 4,
		};
		expect(reduceMap(input, (value) => value * 2)).toEqual(output);
	});
});
