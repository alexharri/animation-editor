import { keys } from "~/constants";
import { DiffFactoryFn } from "~/diff/diffFactory";
import { isKeyDown } from "~/listener/keyboard";
import {
	requestAction,
	RequestActionCallback,
	RequestActionParams,
	ShouldAddToStackFn,
} from "~/listener/requestAction";
import { MousePosition } from "~/types";
import { getDistance } from "~/util/math";

type Key = keyof typeof keys;

interface MouseMoveOptions<KeyMap> {
	initialMousePosition: MousePosition;
	mousePosition: MousePosition;
	moveVector: MousePosition;
	keyDown: KeyMap;
	firstMove: boolean;
}

interface Options<K extends Key, KeyMap extends { [_ in K]: boolean }> {
	params?: RequestActionParams;
	keys: K[];
	beforeMove: (params: RequestActionParams, options: { mousePosition: MousePosition }) => void;
	mouseMove: (params: RequestActionParams, options: MouseMoveOptions<KeyMap>) => void;
	mouseUp: (params: RequestActionParams, hasMoved: boolean) => void;
	translate?: (vec: Vec2) => Vec2;
	translateX?: (value: number) => number;
	translateY?: (value: number) => number;
	moveTreshold?: number;
	shouldAddToStack?: ShouldAddToStackFn | ShouldAddToStackFn[];
	tickShouldUpdate?: (options: MouseMoveOptions<KeyMap>) => boolean;
	viewport?: Rect;

	/**
	 * The diff that is performed on every move and is added on submit.
	 */
	baseDiff?: DiffFactoryFn;
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
		viewport: options.viewport
			? initialGlobalMousePosition.sub(Vec2.new(options.viewport.left, options.viewport.top))
			: initialGlobalMousePosition,
		normal: translate(initialGlobalMousePosition),
	};

	const fn: RequestActionCallback = (params) => {
		options.beforeMove(params, { mousePosition: initialMousePosition });

		if (params.done()) {
			// If user submitted/cancelled in `beforeMove`
			return;
		}

		let hasMoved = false;
		let hasCalledMove = false;
		let lastKeyDownMap: KeyMap = {} as KeyMap;

		let currentMousePosition = initialGlobalMousePosition;
		let lastUsedMousePosition = initialGlobalMousePosition;

		const tick = () => {
			if (params.done()) {
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
					viewport: options.viewport
						? globalMousePosition.sub(
								Vec2.new(options.viewport.left, options.viewport.top),
						  )
						: globalMousePosition,
					normal: translate(globalMousePosition),
				};
				const moveVector: MousePosition = {
					global: mousePosition.global.sub(initialMousePosition.global),
					viewport: mousePosition.viewport.sub(initialMousePosition.viewport),
					normal: mousePosition.normal.sub(initialMousePosition.normal),
				};
				_options = {
					initialMousePosition,
					mousePosition,
					moveVector,
					keyDown: keyDownMap,
					firstMove: !hasCalledMove,
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

			const callOpts = getOptions();
			hasCalledMove = true;
			options.mouseMove(params, callOpts);
			options.baseDiff && params.performDiff(options.baseDiff);
		};
		requestAnimationFrame(tick);

		params.addListener.repeated("mousemove", (e) => {
			currentMousePosition = Vec2.fromEvent(e);

			if (!hasMoved) {
				if (
					getDistance(currentMousePosition, initialMousePosition.global) <=
					(options.moveTreshold ?? 5)
				) {
					return;
				}
				hasMoved = true;
			}
		});

		params.addListener.once("mouseup", () => {
			options.baseDiff && params.addDiff(options.baseDiff);
			options.mouseUp(params, hasMoved);
		});
	};

	if (options.params) {
		fn(options.params);
		return;
	}

	requestAction({ history: true, shouldAddToStack: options.shouldAddToStack }, fn);
};
