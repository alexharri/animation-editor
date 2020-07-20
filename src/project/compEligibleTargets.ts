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

export const getCompEligibleTargets = () => {
	const compEls = document.querySelectorAll("[data-ct-composition-id]");

	const groups: TargetGroup[] = [];

	const compositionState = getActionState().compositions;

	for (let i = 0; i < compEls.length; i += 1) {
		const compEl = compEls[i];
		const compositionId = compEl.getAttribute("data-ct-composition-id")!;

		const composition = compositionState.compositions[compositionId];

		const group: TargetGroup = {
			compositionId,
			rect: compEl.getBoundingClientRect(),
			targets: [],
		};
		groups.push(group);

		const layerEls = compEl.querySelectorAll("[data-ct-layer-id]");

		for (let j = 0; j < layerEls.length; j += 1) {
			const layerEl = layerEls[j];
			const layerId = layerEl.getAttribute("data-ct-layer-id")!;
			const index = composition.layers.indexOf(layerId);

			group.targets.push({
				rect: layerEl.getBoundingClientRect(),
				index: index,
			});
		}
	}

	return groups;
};
