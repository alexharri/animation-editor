// Based on https://github.com/darkskyapp/binary-search

export function getInsertIndex<T>(
	arr: T[],
	toInsert: T,
	comparator: (item: T, toInsert: T) => number,
	low?: number,
	high?: number,
) {
	let mid: number;
	let cmp: number;

	if (arr.length === 0) {
		return 0;
	}

	if (typeof low === "undefined") {
		low = 0;
	} else {
		low = low | 0;
		if (low < 0 || low >= arr.length) {
			throw new RangeError("invalid lower bound");
		}
	}

	if (typeof high === "undefined") {
		high = arr.length - 1;
	} else {
		high = high | 0;
		if (high < low || high >= arr.length) {
			throw new RangeError("invalid upper bound");
		}
	}

	while (low <= high) {
		// Note that "(low + high) >>> 1" may overflow, and results in a typecast
		// to double (which gives the wrong results). */
		mid = low + ((high - low) >> 1);
		cmp = +comparator(arr[mid], toInsert);

		if (cmp < 0) {
			low = mid + 1;
		} else if (cmp > 0) {
			high = mid - 1;
		} else {
			if (mid === high) {
				return mid;
			}
			for (let i = mid + 1; i < high + 1; i += 1) {
				if (comparator(arr[i], toInsert) !== 0) {
					return i;
				}
			}
			return high;
		}
	}

	// Key not found
	for (let i = mid! + 1; i < high + 1; i += 1) {
		if (comparator(arr[i], toInsert) !== 1) {
			return i;
		}
	}

	return high + 1;
}
