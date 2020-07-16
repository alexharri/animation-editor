import { requestAction } from "~/listener/requestAction";
import { getDistance, isVecInRect } from "~/util/math";
import { projectActions } from "~/project/projectReducer";
import { getCompEligibleTargets } from "~/project/compEligibleTargets";
import { compositionActions } from "~/composition/state/compositionReducer";
import { LayerType } from "~/types";

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

		const targetGroups = getCompEligibleTargets();

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

			params.dispatch(
				compositionActions.createLayer(targetCompositionId, LayerType.Composition, {
					compositionLayerReferenceId: compositionId,
					insertLayerIndex,
				}),
			);
			params.dispatch(projectActions.clearDragComposition());
			params.submitAction("Create Composition Layer");
		});
	});
};
