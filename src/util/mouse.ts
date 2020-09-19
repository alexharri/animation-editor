const isLeftClick = (e: { button: number }) => {
	return e.button === 0;
};

const isMiddleClick = (e: { button: number }) => {
	return e.button === 1;
};

const isRightClick = (e: { button: number }) => {
	return e.button === 2;
};

type ListenerFn = (e: React.MouseEvent) => void;

export const separateLeftRightMouse = ({
	left,
	middle,
	right,
}: {
	left?: ListenerFn;
	middle?: ListenerFn;
	right?: ListenerFn;
}) => {
	return (e: React.MouseEvent): void => {
		if (isLeftClick(e)) {
			left?.(e);
		} else if (isRightClick(e)) {
			right?.(e);
		} else if (isMiddleClick(e)) {
			middle?.(e);
		}
	};
};

let mousePosition = Vec2.new(0, 0);

window.addEventListener("mousemove", (e) => {
	mousePosition = Vec2.fromEvent(e);
});

export const getMousePosition = () => mousePosition;
