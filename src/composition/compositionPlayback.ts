import { useEffect } from "react";
import { addListener, removeListener } from "~/listener/addListener";
import { isKeyCodeOf } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { getActionState, getIsActionInProgress } from "~/state/stateUtils";
import { isVecInRect } from "~/util/math";
import { getMousePosition } from "~/util/mouse";

type Playback = { frameIndex: number };

const playbackMap: Partial<{ [compositionId: string]: Playback }> = {};

export const getCompositionPlayback = (compositionId: string): null | { frameIndex: number } => {
	return playbackMap[compositionId] || null;
};

const startPlayback = (compositionId: string, startFrameIndex: number) => {
	if (playbackMap[compositionId] || getIsActionInProgress()) {
		return;
	}

	let cancelled = false;

	requestAction({ history: false }, (params) => {
		let frameIndex = startFrameIndex;
		params.addReverseDiff((diff) => diff.frameIndex(compositionId, frameIndex));

		params.addListener.keyboardOnce("Space", "keydown", () => {
			cancelled = true;
		});

		params.addListener.once("mousedown", () => {
			cancelled = true;
		});

		const tick = () => {
			if (cancelled || params.done()) {
				if (!params.done()) {
					params.cancelAction();
				}

				delete playbackMap[compositionId];
				return;
			}

			++frameIndex;
			playbackMap[compositionId] = { frameIndex };
			params.performDiff((diff) => diff.frameIndex(compositionId, frameIndex));
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
};

export const useCompositionPlayback = (
	compositionId: string,
	viewportRef: React.MutableRefObject<Rect>,
) => {
	useEffect(() => {
		const token = addListener.keydownLong("Space", (e) => {
			if (!isKeyCodeOf("Space", e.keyCode) || getIsActionInProgress()) {
				return;
			}

			const { left, top, width, height } = viewportRef.current;
			const viewport = { left, top, width, height };

			const mousePosition = getMousePosition();
			if (!isVecInRect(mousePosition, viewport)) {
				return;
			}

			const start = Date.now();
			let didMouseDown = false;

			const mouseDownToken = addListener.repeated("mousedown", () => {
				didMouseDown = true;
			});

			addListener.keyboardOnce("Space", "keyup", () => {
				removeListener(mouseDownToken);

				const elapsed = Date.now() - start;

				if (elapsed > 300 || didMouseDown) {
					return;
				}

				const { frameIndex } = getActionState().compositionState.compositions[
					compositionId
				];
				startPlayback(compositionId, frameIndex);
			});
		});

		return () => {
			removeListener(token);
		};
	}, []);
};
