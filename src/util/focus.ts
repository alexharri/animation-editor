export const elementHasKeyboardFocus = () => {
	if (!document.activeElement) {
		return false;
	}

	return (
		document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA"
	);
};

export const clearElementFocus = () => {
	if (document.activeElement && (document.activeElement as HTMLInputElement).blur) {
		(document.activeElement as HTMLInputElement).blur();
	}
};
