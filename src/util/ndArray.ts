// To store the N dimensional array with dimensions of length [3, 2, 2]
// stored in a 1D array, we would need an array of length 3 * 2 * 2 = 12.
//
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
//
// Given that we want to write a getIndex fn:
//
//      getIndex(1, 2, 1)
//
// We can compute an index in the 1D array by each index along a dimension
// being multiplied by the subsequent dimensions. If there are no
// subsequent dimensions (i.e. the current dimension is the last dimension),
// the multiplier is 1.
//
// So given the dimension definition [3, 2, 2], the multiplier are:
//
//      i0 = 2 * 2
//      i1 = 2
//      i2 = 1 (last dimension)
//
// Let's proceed with the lookup example of [1, 1, 1]:
//
//      1 * i0 = 4
//
//              │
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
//
//      1 * i1 = 2
//
//              │
//              └─────┐
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
//
//      1 * i2 = 1
//
//              │
//              └─────┐
//                    └──┐
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
//
// If we want the last item in the array, we would pass [2, 1, 1].
//
//      (2 * i0 = 8) + (1 * i1 = 2) + (1 * i2 = 1)
//
// Which gives us a result of:
//
//      8 + 2 + 1 = 11
//
// Which is the index of the last item in the array.

export function constructNdArray<T>(dimensions: number[], defaultValue: T): T[] {
	let length = dimensions[0];
	for (let i = 1; i < dimensions.length; i++) {
		length *= dimensions[i];
	}
	const arr: T[] = [];
	arr.length = length;
	arr.fill(defaultValue);
	return arr;
}

export function getNdArrayIndex(dimensions: number[], indices: number[]): number {
	let index = indices[indices.length - 1];
	let imul = 1;
	for (let i = indices.length - 2; i > -1; i--) {
		imul *= dimensions[i + 1];
		index += imul * indices[i];
	}
	return index;
}

// export function getNdArrayDifference(
// 	a: number[],
// 	b: number[],
// ): { removed: number[][]; added: number[][] } {
// 	const added: number[][] = [];
// 	const removed: number[][] = [];

// 	return { added, removed };
// }
