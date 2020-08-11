import { Composition } from "~/composition/compositionTypes";
import { getActionState } from "~/state/stateUtils";

type Target = {
	rect: Rect;
	index: number;
};

interface TargetGroup {
	compositionId: string;
	rect: Rect;
	targets: Target[];
}

export const getLayerTargetsWithinComposition = (
	composition: Composition,
	layerWrapper: HTMLDivElement,
): Target[] => {
	const targets: Target[] = [];

	const layerEls = layerWrapper.querySelectorAll("[data-ct-layer-id]");

	for (let j = 0; j < layerEls.length; j += 1) {
		const layerEl = layerEls[j];
		const layerId = layerEl.getAttribute("data-ct-layer-id")!;
		const index = composition.layers.indexOf(layerId);

		targets.push({
			rect: layerEl.getBoundingClientRect(),
			index: index,
		});
	}

	return targets;
};

export const getDragCompositionEligibleTargets = () => {
	const compEls = document.querySelectorAll("[data-ct-composition-id]");

	const groups: TargetGroup[] = [];

	const compositionState = getActionState().compositionState;

	for (let i = 0; i < compEls.length; i += 1) {
		const layerWrapper = compEls[i] as HTMLDivElement;
		const compositionId = layerWrapper.getAttribute("data-ct-composition-id")!;

		const composition = compositionState.compositions[compositionId];

		const group: TargetGroup = {
			compositionId,
			rect: layerWrapper.getBoundingClientRect(),
			targets: getLayerTargetsWithinComposition(composition, layerWrapper),
		};
		groups.push(group);
	}

	return groups;
};
