import { areaActions } from "~/area/state/areaActions";
import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType, TRACKPAD_ZOOM_DELTA_FAC } from "~/constants";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { getAreaActionState } from "~/state/stateUtils";
import { Action } from "~/types";
import { capToRange, interpolate } from "~/util/math";
import { parseWheelEvent } from "~/util/wheelEvent";
import { WorkspaceAreaState } from "~/workspace/workspaceAreaReducer";

type PossibleAreaTypes = AreaType.FlowEditor | AreaType.Workspace;

interface Actions {
	setPan: (pan: Vec2) => Action;
	setScale: (scale: number) => Action;
}

export const createViewportWheelHandlers = <T extends PossibleAreaTypes>(
	areaType: T,
	actions: Actions,
) => {
	const handlers = {
		onPanStart: (areaId: string, e: React.MouseEvent) => {
			const areaState = getAreaActionState<T>(areaId);
			const initialPos = Vec2.fromEvent(e);

			requestAction({}, (params) => {
				params.addListener.repeated("mousemove", (e) => {
					const pos = Vec2.fromEvent(e);
					const diff = pos.sub(initialPos);
					const action = actions.setPan(areaState.pan.add(diff));
					if ((<WorkspaceAreaState>areaState).compositionId) {
						const { compositionId } = areaState as WorkspaceAreaState;
						params.performDiff((diff) => diff.compositionView(compositionId));
					}
					params.dispatchToAreaState(areaId, action);
				});

				params.addListener.once("mouseup", () => {
					if ((<WorkspaceAreaState>areaState).compositionId) {
						const { compositionId } = areaState as WorkspaceAreaState;
						params.addDiff((diff) => diff.compositionView(compositionId));
					}
					params.submitAction("Pan");
				});
			});
		},

		onZoomClick: (e: React.MouseEvent, areaId: string) => {
			e.stopPropagation();

			const mousePos = Vec2.fromEvent(e);
			const areaState = getAreaActionState<T>(areaId);

			if (
				(areaState.scale < 0.0625 && isKeyDown("Alt")) ||
				(areaState.scale > 256 && !isKeyDown("Alt"))
			) {
				return;
			}

			requestAction({}, (params) => {
				const viewport = getAreaViewport(areaId, areaType);
				const fac = isKeyDown("Alt") ? 0.5 : 2;

				const pos = mousePos
					.sub(Vec2.new(areaState.pan))
					.sub(Vec2.new(viewport.width / 2, viewport.height / 2))
					.sub(Vec2.new(viewport));

				const xt = pos.x / viewport.width;
				const yt = pos.y / viewport.height;

				const diff = Vec2.new(
					viewport.width * (xt * fac) * (isKeyDown("Alt") ? -1 : 0.5),
					viewport.height * (yt * fac) * (isKeyDown("Alt") ? -1 : 0.5),
				);

				const panAction = actions.setPan(areaState.pan.sub(diff));
				const scaleAction = actions.setScale(areaState.scale * fac);

				params.dispatch(
					areaActions.dispatchToAreaState(areaId, panAction),
					areaActions.dispatchToAreaState(areaId, scaleAction),
				);
				if ((<WorkspaceAreaState>areaState).compositionId) {
					const { compositionId } = areaState as WorkspaceAreaState;
					params.addDiff((diff) => diff.compositionView(compositionId));
				}
				params.submitAction("Zoom");
			});
		},

		onWheelScale: (e: WheelEvent, areaId: string, impact = 1) => {
			const { deltaY } = e;

			const mousePos = Vec2.fromEvent(e);
			const areaState = getAreaActionState<T>(areaId);
			const viewport = getAreaViewport(areaId, areaType);

			const fac = interpolate(1, -deltaY < 0 ? 0.85 : 1.15, capToRange(0, 2, impact));

			requestAction({ history: false }, (params) => {
				const pos = mousePos
					.sub(Vec2.new(areaState.pan))
					.sub(Vec2.new(viewport.width / 2, viewport.height / 2))
					.sub(Vec2.new(viewport));

				const xt = pos.x / viewport.width;
				const yt = pos.y / viewport.height;

				const xDiff = viewport.width * xt * ((1 - fac) / 1) * -1;
				const yDiff = viewport.height * yt * ((1 - fac) / 1) * -1;

				const diff = Vec2.new(xDiff, yDiff);

				const panAction = actions.setPan(areaState.pan.sub(diff));
				const scaleAction = actions.setScale(areaState.scale * fac);

				params.dispatch(
					areaActions.dispatchToAreaState(areaId, panAction),
					areaActions.dispatchToAreaState(areaId, scaleAction),
				);
				if ((<WorkspaceAreaState>areaState).compositionId) {
					const { compositionId } = areaState as WorkspaceAreaState;
					params.addDiff((diff) => diff.compositionView(compositionId));
				}
				params.submitAction("Zoom");
			});
		},

		onWheelPan: (deltaX: number, deltaY: number, areaId: string) => {
			const areaState = getAreaActionState<T>(areaId);

			requestAction({ history: false }, (params) => {
				const pan = areaState.pan.add(Vec2.new(-deltaX, -deltaY));
				const panAction = actions.setPan(pan);

				params.dispatch(areaActions.dispatchToAreaState(areaId, panAction));
				if ((<WorkspaceAreaState>areaState).compositionId) {
					const { compositionId } = areaState as WorkspaceAreaState;
					params.addDiff((diff) => diff.compositionView(compositionId));
				}
				params.submitAction("Pan");
			});
		},

		onWheel: (e: WheelEvent, areaId: string) => {
			e.preventDefault();

			const normalized = parseWheelEvent(e);

			switch (normalized.type) {
				case "mouse_wheel": {
					handlers.onWheelScale(e, areaId);
					break;
				}
				case "pinch_zoom": {
					handlers.onWheelScale(e, areaId, Math.abs(e.deltaY) * TRACKPAD_ZOOM_DELTA_FAC);
					break;
				}
				case "pan": {
					handlers.onWheelPan(normalized.deltaX, normalized.deltaY, areaId);
					break;
				}
			}
		},
	};
	return handlers;
};
