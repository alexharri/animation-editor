import { getAreaViewport } from "~/area/util/getAreaViewport";
import { getPickWhipLayerTarget } from "~/composition/layer/layerUtils";
import { AreaType } from "~/constants";
import { createOperation } from "~/state/operation";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { layerOperations } from "~/timeline/layer/layerOperations";
import { timelineAreaActions } from "~/timeline/timelineAreaReducer";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";

export const layerHandlers = {
	onLayerParentWhipMouseDown: (e: React.MouseEvent, areaId: string, layerId: string) => {
		const { compositionState } = getActionState();

		const layer = compositionState.layers[layerId];
		const viewport = getAreaViewport(areaId, AreaType.Timeline);

		mouseDownMoveAction(e, {
			keys: [],
			beforeMove: () => {},
			mouseMove: (params, { mousePosition }) => {
				params.dispatchToAreaState(
					areaId,
					timelineAreaActions.setFields({
						pickWhipLayerParent: {
							fromId: layerId,
							to: mousePosition.global.subXY(1, 3),
						},
					}),
				);
			},
			mouseUp: (params) => {
				const { pickWhipLayerParent, panY } = getAreaActionState<AreaType.Timeline>(areaId);

				if (!pickWhipLayerParent) {
					// Mouse did not move
					params.cancelAction();
					return;
				}

				const target = getPickWhipLayerTarget(
					pickWhipLayerParent.to,
					pickWhipLayerParent.fromId,
					layer.compositionId,
					compositionState,
					panY,
					viewport,
				);

				if (!target) {
					params.cancelAction();
					return;
				}

				const op = createOperation(params);
				layerOperations.setLayerParentLayer(op, getActionState(), layerId, target.layerId);

				params.dispatch(op.actions);
				params.dispatchToAreaState(
					areaId,
					timelineAreaActions.setFields({
						pickWhipLayerParent: null,
					}),
				);
				params.submitAction("Set layer's parent layer");
			},
		});
	},
};
