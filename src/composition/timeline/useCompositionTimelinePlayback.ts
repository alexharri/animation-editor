import { RequestActionParams, requestAction } from "~/listener/requestAction";
import { useRef } from "react";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { getActionState } from "~/state/stateUtils";
import { compositionActions } from "~/composition/state/compositionReducer";

export const useCompositionTimelinePlayback = (compositionId: string): void => {
	const spaceDownAtTimeRef = useRef(0);
	const playbackParamsRef = useRef<RequestActionParams | null>(null);

	useKeyDownEffect("Space", (down) => {
		if (playbackParamsRef.current) {
			spaceDownAtTimeRef.current = 0;
			playbackParamsRef.current.cancelAction();
			playbackParamsRef.current = null;
			return;
		}

		if (down) {
			spaceDownAtTimeRef.current = Date.now();
		} else if (Date.now() - spaceDownAtTimeRef.current < 250) {
			requestAction({ history: true }, (params) => {
				playbackParamsRef.current = params;

				const {
					frameIndex: initialFrameIndex,
					length,
				} = getActionState().compositions.compositions[compositionId];

				let f = initialFrameIndex;

				const tick = () => {
					if (params.cancelled()) {
						playbackParamsRef.current = null;
						return;
					}

					f++;

					if (f >= length) {
						playbackParamsRef.current = null;
						params.cancelAction();
					} else {
						params.dispatch(compositionActions.setFrameIndex(compositionId, f));
					}

					requestAnimationFrame(tick);
				};

				requestAnimationFrame(tick);
			});
		}
	});
};
