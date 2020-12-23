import { compositionActions } from "~/composition/compositionReducer";
import { requestAction } from "~/listener/requestAction";
import { getDragCompositionEligibleTargets } from "~/project/dragCompositionEligibleTargets";
import { projectActions } from "~/project/projectReducer";
import { getActionState } from "~/state/stateUtils";
import { LayerType } from "~/types";
import { createMapNumberId } from "~/util/mapUtils";
import { getDistance, isVecInRect } from "~/util/math";

export const dragProjectComp = (e: React.MouseEvent, compositionId: string) => {
	const initialPosition = Vec2.fromEvent(e);

	requestAction({ history: true }, (params) => {
		let hasMoved = false;
		let vec: Vec2 = initialPosition;

		params.addListener.repeated("mousemove", (e) => {
			const mousePosition = Vec2.fromEvent(e);
			vec = mousePosition;

			if (!hasMoved) {
				if (getDistance(initialPosition, mousePosition) < 5) {
					return;
				}
				hasMoved = true;
			}

			params.dispatch(projectActions.setDragComposition(compositionId, mousePosition));
		});

		const targetGroups = getDragCompositionEligibleTargets();

		params.addListener.once("mouseup", () => {
			let targetCompositionId!: string;
			let insertLayerIndex: number | undefined;

			i: for (let i = 0; i < targetGroups.length; i += 1) {
				const { rect, targets, compositionId } = targetGroups[i];
				if (!isVecInRect(vec, rect)) {
					continue;
				}

				for (let j = 0; j < targets.length; j += 1) {
					const target = targets[j];

					if (!isVecInRect(vec, target.rect)) {
						continue;
					}

					const isInTopHalf = vec.y < target.rect.top + target.rect.height / 2;

					targetCompositionId = compositionId;
					insertLayerIndex = target.index + (isInTopHalf ? 0 : 1);
					break i;
				}

				targetCompositionId = compositionId;
				insertLayerIndex = targets.length;
			}

			if (typeof insertLayerIndex === "undefined") {
				params.cancelAction();
				return;
			}

			const { compositionState } = getActionState();
			const expectedLayerId = createMapNumberId(compositionState.layers);
			params.dispatch(
				compositionActions.createLayer(targetCompositionId, LayerType.Composition, {
					compositionLayerReferenceId: compositionId,
					insertLayerIndex,
				}),
			);
			params.dispatch(projectActions.clearDragComposition());
			params.addDiff((diff) => diff.addLayer(expectedLayerId));
			params.submitAction("Create Composition Layer");
		});
	});
};
