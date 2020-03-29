export function extractTupleValue<T extends readonly [{ value: V1 }], V1 = any>(
	tuple: T,
): [T[0]["value"]];
export function extractTupleValue<
	T extends readonly [{ value: V1 }, { value: V2 }],
	V1 = any,
	V2 = any
>(tuple: T): [T[0]["value"], T[1]["value"]];
export function extractTupleValue<
	T extends readonly [{ value: V1 }, { value: V2 }, { value: V3 }],
	V1 = any,
	V2 = any,
	V3 = any
>(tuple: T): [T[0]["value"], T[1]["value"], T[2]["value"]];
export function extractTupleValue(...args: Array<{ value: any }>): any[] {
	return args.map(x => x.value);
}
