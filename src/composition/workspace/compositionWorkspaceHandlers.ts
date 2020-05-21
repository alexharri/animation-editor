import { RequestActionParams, requestAction } from "~/listener/requestAction";
import { isKeyDown } from "~/listener/keyboard";
import {
	compositionWorkspaceAreaActions,
	CompositionWorkspaceAreaState,
} from "~/composition/workspace/compositionWorkspaceAreaReducer";
import { areaActions } from "~/area/state/areaActions";
import { getAreaActionState } from "~/state/stateUtils";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType } from "~/constants";

const actions = {
	zoom: (
		{ dispatch, cancelAction, submitAction }: RequestActionParams,
		e: React.MouseEvent,
		areaId: string,
		viewport: Rect,
		pan: Vec2,
		scale: number,
	) => {
		if ((scale < 0.0625 && isKeyDown("Alt")) || (scale > 256 && !isKeyDown("Alt"))) {
			cancelAction();
			return;
		}

		const fac = isKeyDown("Alt") ? 0.5 : 2;

		const pos = Vec2.fromEvent(e)
			.sub(Vec2.new(pan))
			.sub(Vec2.new(viewport.width / 2, viewport.height / 2))
			.sub(Vec2.new(viewport));

		const xt = pos.x / viewport.width;
		const yt = pos.y / viewport.height;

		const diff = Vec2.new(
			viewport.width * (xt * fac) * (isKeyDown("Alt") ? -1 : 0.5),
			viewport.height * (yt * fac) * (isKeyDown("Alt") ? -1 : 0.5),
		);

		const panAction = compositionWorkspaceAreaActions.setPan(pan.sub(diff));
		const scaleAction = compositionWorkspaceAreaActions.setScale(scale * fac);

		dispatch(areaActions.dispatchToAreaState(areaId, panAction));
		dispatch(areaActions.dispatchToAreaState(areaId, scaleAction));
		submitAction("Zoom");
	},
};

export const compositionWorkspaceHandlers = {
	onPanStart: (e: React.MouseEvent, areaId: string) => {
		e.preventDefault();

		const areaState = getAreaActionState<NodeEditorAreaState>(areaId);
		const initialPos = Vec2.fromEvent(e);

		requestAction({}, ({ addListener, dispatch, submitAction }) => {
			addListener.repeated("mousemove", (e) => {
				const pos = Vec2.fromEvent(e);
				const diff = pos.sub(initialPos);
				const action = compositionWorkspaceAreaActions.setPan(areaState.pan.add(diff));
				dispatch(areaActions.dispatchToAreaState(areaId, action));
			});

			addListener.once("mouseup", () => submitAction("Pan"));
		});
	},

	onZoomClick: (e: React.MouseEvent, areaId: string) => {
		e.preventDefault();

		const areaState = getAreaActionState<CompositionWorkspaceAreaState>(areaId);
		const viewport = getAreaViewport(areaId, AreaType.CompositionWorkspace);

		requestAction({}, (params) => {
			actions.zoom(params, e, areaId, viewport, areaState.pan, areaState.scale);
		});
	},
};
