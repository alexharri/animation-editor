const isLeftClick = (e: { button: number }) => {
	return e.button === 0;
};

const isRightClick = (e: { button: number }) => {
	return e.button === 2;
};

type ListenerFn = (e: React.MouseEvent) => void;

export const separateLeftRightMouse = ({
	left,
	right,
}: {
	left?: ListenerFn;
	right?: ListenerFn;
}) => {
	return (e: React.MouseEvent): void => {
		if (isLeftClick(e)) {
			left?.(e);
		} else if (isRightClick(e)) {
			right?.(e);
		}
	};
};
