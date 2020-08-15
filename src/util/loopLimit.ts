export const createLoopLimit = (limit = 1000) => {
	let n = 0;
	return (cb?: () => void) => {
		n++;
		if (n > limit) {
			cb?.();
			throw new Error("Loop limit reached");
		}
	};
};
