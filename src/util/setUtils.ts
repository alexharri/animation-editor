export const areSetsEqual = <T>(a: Set<T>, b: Set<T>): boolean => {
	const aItems = [...a];
	const bItems = [...b];

	if (aItems.length !== bItems.length) {
		return false;
	}

	for (const item of aItems) {
		if (!b.has(item)) {
			return false;
		}
	}

	return true;
};
