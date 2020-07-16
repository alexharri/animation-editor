export const getNonDuplicateName = (name: string, existingNames: string[]): string => {
	const names = new Set(existingNames);

	if (!names.has(name)) {
		return name;
	}

	let i = 1;
	while (names.has(`${name} ${i}`)) {
		i++;
	}
	return `${name} ${i}`;
};
