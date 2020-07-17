import React, { useRef, useEffect, useState } from "react";
import { RequestActionParams, requestAction } from "~/listener/requestAction";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { getActionState } from "~/state/stateUtils";
import { useComputeHistory } from "~/hook/useComputeHistory";
import { LayerType } from "~/types";
import { useActionState } from "~/hook/useActionState";

interface PlaybackContext {
	layerIdToFrameIndex: {
		[layerId: string]: number;
	};
}

export const CompWorkspacePlaybackContext = React.createContext<PlaybackContext>({
	layerIdToFrameIndex: {},
});

export const useCompositionWorkspacePlayback = (compositionId: string): React.FC => {
	const onUpdateRef = useRef<((frameIndex: number) => void) | null>(null);

	const HOC: React.FC = (props) => {
		const [frameIndex, setFrameIndex] = useState(0);

		useEffect(() => {
			onUpdateRef.current = setFrameIndex;

			return () => {
				onUpdateRef.current = null;
			};
		}, []);

		const compositionState = useComputeHistory((state) => {
			return state.compositions;
		});

		const compFrameIndex = useActionState((state) => {
			return state.compositions.compositions[compositionId].frameIndex;
		});

		useEffect(() => {
			setFrameIndex(compFrameIndex);
		}, [compFrameIndex]);

		const ctx: PlaybackContext = {
			layerIdToFrameIndex: {},
		};

		(function crawl(compositionId: string) {
			const composition = compositionState.compositions[compositionId];

			for (let i = 0; i < composition.layers.length; i += 1) {
				const layer = compositionState.layers[composition.layers[i]];

				ctx.layerIdToFrameIndex[layer.id] = frameIndex;

				if (layer.type === LayerType.Composition) {
					const id = compositionState.compositionLayerIdToComposition[layer.id];
					crawl(id);
				}
			}
		})(compositionId);

		return (
			<CompWorkspacePlaybackContext.Provider value={ctx}>
				{props.children}
			</CompWorkspacePlaybackContext.Provider>
		);
	};

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
						onUpdateRef.current?.(initialFrameIndex);
						return;
					}

					f++;

					if (f >= length) {
						onUpdateRef.current?.(initialFrameIndex);
						playbackParamsRef.current = null;
						params.cancelAction();
					} else {
						onUpdateRef.current?.(f);
					}

					requestAnimationFrame(tick);
				};

				requestAnimationFrame(tick);
			});
		}
	});

	return HOC;
};
