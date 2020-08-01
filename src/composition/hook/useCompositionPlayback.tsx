import React, { useEffect, useRef, useState } from "react";
import { CompositionState } from "~/composition/state/compositionReducer";
import { useActionStateEffect } from "~/hook/useActionState";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { getActionState } from "~/state/stateUtils";
import { LayerType } from "~/types";
import { isMapShallowEqual } from "~/util/mapUtils";

export const getLayerIndexShiftMap = (
	compositionId: string,
	compositionState: CompositionState,
) => {
	const layerIndexShiftMap: { [layerId: string]: number } = {};

	(function crawl(compositionId: string, index) {
		const composition = compositionState.compositions[compositionId];

		for (let i = 0; i < composition.layers.length; i += 1) {
			const layer = compositionState.layers[composition.layers[i]];

			layerIndexShiftMap[layer.id] = -index;

			if (layer.type === LayerType.Composition) {
				const id = compositionState.compositionLayerIdToComposition[layer.id];
				crawl(id, index + layer.index);
			}
		}
	})(compositionId, 0);

	return layerIndexShiftMap;
};

export const CompositionFrameIndexContext = React.createContext<number>(-1);
export const CompositionLayerShiftContext = React.createContext<
	ReturnType<typeof getLayerIndexShiftMap>
>({});

export const CompositionPlaybackProvider: React.FC<{ compositionId: string }> = ({
	compositionId,
	children,
}) => {
	const [frameIndex, setFrameIndex] = useState(-1);
	const [layerIndexShiftMap, setLayerIndexShiftMap] = useState(() =>
		getLayerIndexShiftMap(compositionId, getActionState().compositionState),
	);

	const spaceDownAtTimeRef = useRef(0);
	const playbackParamsRef = useRef<RequestActionParams | null>(null);

	useActionStateEffect((state, prevState) => {
		if (
			state.compositionState.layers === prevState.compositionState.layers &&
			state.compositionState.compositions === prevState.compositionState.compositions
		) {
			return;
		}

		const map = getLayerIndexShiftMap(compositionId, state.compositionState);

		if (!isMapShallowEqual(layerIndexShiftMap, map)) {
			setLayerIndexShiftMap(map);
		}
	});

	useEffect(() => {
		window.addEventListener("mousedown", () => {
			if (spaceDownAtTimeRef.current !== 0) {
				spaceDownAtTimeRef.current = 0;
			}
		});
	}, []);

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
				} = getActionState().compositionState.compositions[compositionId];

				let f = initialFrameIndex;

				const tick = () => {
					if (params.cancelled()) {
						playbackParamsRef.current = null;
						setFrameIndex(-1);
						return;
					}

					f++;

					if (f >= length) {
						setFrameIndex(-1);
						playbackParamsRef.current = null;
						params.cancelAction();
					} else {
						setFrameIndex(f);
					}

					requestAnimationFrame(tick);
				};

				requestAnimationFrame(tick);
			});
		}
	});

	return (
		<CompositionLayerShiftContext.Provider value={layerIndexShiftMap}>
			<CompositionFrameIndexContext.Provider value={frameIndex}>
				{children}
			</CompositionFrameIndexContext.Provider>
		</CompositionLayerShiftContext.Provider>
	);
};
