import "~/types";

declare global {
	const electron: {
		onDoubleClickDragArea: () => void;
		registerUndo: (fn: () => void) => void;
		registerRedo: (fn: () => void) => void;
	};
}
