import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { getDistance } from "~/util/math";

interface MousePosition {
	global: Vec2;
	translated: Vec2;
}

interface Options {
	beforeMove: (params: RequestActionParams) => void;
	mouseMove: (
		params: RequestActionParams,
		options: {
			initialMousePosition: MousePosition;
			mousePosition: MousePosition;
			moveVector: MousePosition;
		},
	) => void;
	mouseUp: (params: RequestActionParams, hasMoved: boolean) => void;
	translate?: (vec: Vec2) => Vec2;
	translateX?: (value: number) => number;
	translateY?: (value: number) => number;
	moveTreshold?: number;
	shouldAddToStack?: (prevState: ActionState, nextState: ActionState) => boolean;
}

export const mouseDownMoveAction = (
	eOrInitialPos: React.MouseEvent | MouseEvent | Vec2,
	options: Options,
): void => {
	let translate: (vec: Vec2) => Vec2;

	if (options.translate) {
		translate = options.translate;
	} else if (options.translateX || options.translateY) {
		translate = (vec) => {
			const x = (options.translateX || ((value) => value))(vec.x);
			const y = (options.translateY || ((value) => value))(vec.y);
			return Vec2.new(x, y);
		};
	} else {
		translate = (vec) => vec;
	}

	const initialGlobalMousePosition =
		eOrInitialPos instanceof Vec2 ? eOrInitialPos : Vec2.fromEvent(eOrInitialPos);
	const initialMousePosition: MousePosition = {
		global: initialGlobalMousePosition,
		translated: translate(initialGlobalMousePosition),
	};

	requestAction({ history: true }, (params) => {
		options.beforeMove(params);

		let hasMoved = false;

		params.addListener.repeated("mousemove", (e) => {
			const globalMousePosition = Vec2.fromEvent(e);
			const mousePosition: MousePosition = {
				global: globalMousePosition,
				translated: translate(globalMousePosition),
			};

			if (!hasMoved) {
				if (
					getDistance(mousePosition.global, initialMousePosition.global) >=
					(options.moveTreshold ?? 5)
				) {
					return;
				}
				hasMoved = true;
			}

			const moveVector: MousePosition = {
				global: mousePosition.global.sub(initialMousePosition.global),
				translated: mousePosition.translated.sub(initialMousePosition.translated),
			};

			options.mouseMove(params, { initialMousePosition, mousePosition, moveVector });
		});

		params.addListener.once("mouseup", () => {
			options.mouseUp(params, hasMoved);
		});
	});
};
