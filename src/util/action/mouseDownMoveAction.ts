import { keys } from "~/constants";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction, RequestActionParams, ShouldAddToStackFn } from "~/listener/requestAction";
import { getDistance } from "~/util/math";

interface MousePosition {
	global: Vec2;
	translated: Vec2;
}

type Key = keyof typeof keys;

interface MouseMoveOptions<KeyMap> {
	initialMousePosition: MousePosition;
	mousePosition: MousePosition;
	moveVector: MousePosition;
	keyDown: KeyMap;
}

interface Options<K extends Key, KeyMap extends { [_ in K]: boolean }> {
	keys: K[];
	beforeMove: (params: RequestActionParams) => void;
	mouseMove: (params: RequestActionParams, options: MouseMoveOptions<KeyMap>) => void;
	mouseUp: (params: RequestActionParams, hasMoved: boolean) => void;
	translate?: (vec: Vec2) => Vec2;
	translateX?: (value: number) => number;
	translateY?: (value: number) => number;
	moveTreshold?: number;
	shouldAddToStack?: ShouldAddToStackFn | ShouldAddToStackFn[];
	tickShouldUpdate?: (options: MouseMoveOptions<KeyMap>) => boolean;
}

export const mouseDownMoveAction = <
	K extends Key,
	KeyMap extends { [_ in K]: boolean } = { [_ in K]: boolean }
>(
	eOrInitialPos: React.MouseEvent | MouseEvent | Vec2,
	options: Options<K, KeyMap>,
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

	requestAction({ history: true, shouldAddToStack: options.shouldAddToStack }, (params) => {
		options.beforeMove(params);

		let hasMoved = false;
		let lastKeyDownMap: KeyMap = {} as KeyMap;

		let currentMousePosition = initialGlobalMousePosition;
		let lastUsedMousePosition = initialGlobalMousePosition;

		const tick = () => {
			if (params.cancelled()) {
				return;
			}

			requestAnimationFrame(tick);

			if (!hasMoved) {
				return;
			}

			let shouldUpdate = false;

			const keyDownMap = (lastKeyDownMap = options.keys.reduce<KeyMap>((acc, key) => {
				const keyDown = isKeyDown(key) as KeyMap[K];

				if (lastKeyDownMap[key] !== keyDown) {
					shouldUpdate = true;
				}

				acc[key] = keyDown;
				return acc;
			}, {} as KeyMap));

			let _options!: MouseMoveOptions<KeyMap>;
			const getOptions = () => {
				if (_options) {
					return _options;
				}

				const globalMousePosition = currentMousePosition;
				const mousePosition: MousePosition = {
					global: globalMousePosition,
					translated: translate(globalMousePosition),
				};
				const moveVector: MousePosition = {
					global: mousePosition.global.sub(initialMousePosition.global),
					translated: mousePosition.translated.sub(initialMousePosition.translated),
				};
				_options = {
					initialMousePosition,
					mousePosition,
					moveVector,
					keyDown: keyDownMap,
				};
				return _options;
			};

			if (!shouldUpdate && options.tickShouldUpdate?.(getOptions())) {
				shouldUpdate = true;
			}

			if (!shouldUpdate && lastUsedMousePosition === currentMousePosition) {
				return;
			}

			lastUsedMousePosition = currentMousePosition;

			options.mouseMove(params, getOptions());
		};
		requestAnimationFrame(tick);

		params.addListener.repeated("mousemove", (e) => {
			currentMousePosition = Vec2.fromEvent(e);

			if (!hasMoved) {
				if (
					getDistance(currentMousePosition, initialMousePosition.global) >=
					(options.moveTreshold ?? 5)
				) {
					return;
				}
				hasMoved = true;
			}
		});

		params.addListener.once("mouseup", () => {
			options.mouseUp(params, hasMoved);
		});
	});
};
