import { useRef } from "react";
import { useRefRect } from "~/hook/useRefRect";
import { RGBColor } from "~/types";
import { isVecInRect } from "~/util/math";

export const useCanvasPixelSelector = (
	ref: React.RefObject<HTMLCanvasElement>,
	options: { allowOutside: boolean; shiftPosition?: Vec2 },
	callback: (color: RGBColor, position: Vec2) => void,
) => {
	const rect = useRefRect(ref);
	const isDragging = useRef(false);

	const onMouseDown = (e: React.MouseEvent) => {
		isDragging.current = true;

		const onMouseMoveListener = (e: MouseEvent | React.MouseEvent) => {
			if (!isDragging.current) {
				return;
			}

			if (!rect || !ref.current) {
				return;
			}

			let vec = Vec2.fromEvent(e);

			if (options.shiftPosition) {
				vec = vec.add(options.shiftPosition);
			}

			const isInRect = isVecInRect(vec, {
				...rect,
				width: rect.width - 1,
				height: rect.height - 1,
			});
			if (!isInRect && !options.allowOutside) {
				return;
			}

			if (!isInRect) {
				vec.x = Math.min(rect.left + rect.width - 1, Math.max(rect.left, vec.x));
				vec.y = Math.min(rect.top + rect.height - 1, Math.max(rect.top, vec.y));
			}

			vec = vec.sub(Vec2.new(rect.left, rect.top));

			const ctx = ref.current.getContext("2d");

			if (!ctx) {
				return;
			}

			if (vec.x < 0) {
				return;
			}

			var [r, g, b] = ctx.getImageData(vec.x, vec.y, 1, 1).data;
			callback([r, g, b], vec);
		};

		onMouseMoveListener(e);

		const mouseUpListener = () => {
			isDragging.current = false;
			window.removeEventListener("mousemove", onMouseMoveListener);
			window.removeEventListener("mouseup", mouseUpListener);
		};

		window.addEventListener("mousemove", onMouseMoveListener);
		window.addEventListener("mouseup", mouseUpListener);
	};

	return {
		onMouseDown,
	};
};
