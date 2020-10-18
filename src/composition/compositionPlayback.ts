import { requestAction } from "~/listener/requestAction";
import { getIsActionInProgress } from "~/state/stateUtils";

type Playback = { frameIndex: number };

const playbackMap: Partial<{ [compositionId: string]: Playback }> = {};

export const getCompositionPlayback = (compositionId: string): null | { frameIndex: number } => {
	return playbackMap[compositionId] || null;
};

export const startPlayback = (compositionId: string, startFrameIndex: number) => {
	if (playbackMap[compositionId] || getIsActionInProgress()) {
		return;
	}

	let cancelled = false;

	requestAction({ history: false }, (params) => {
		let frameIndex = startFrameIndex;

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
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
};
