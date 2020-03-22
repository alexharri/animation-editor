import { areaActions } from "~/area/state/areaActions";
import { requestAction } from "~/listener/requestAction";
import { nodeEditorAreaActions } from "~/nodeEditor/nodeEditorAreaActions";
import { getAreaActionState } from "~/state/stateUtils";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { isKeyDown } from "~/listener/keyboard";
import { isLeftClick } from "~/util/mouse";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { nodeEditorGraphActions } from "~/nodeEditor/nodeEditorGraphActions";

export const nodeEditorHandlers = {
	onLeftClickOutside: (graphId: string) => {
		requestAction({ history: true }, ({ dispatch: _dispatch, submitAction }) => {
			const dispatch = (action: any) =>
				_dispatch(nodeEditorActions.dispatchToGraph(graphId, action));

			dispatch(nodeEditorGraphActions.clearNodeSelection());
			submitAction("Clear selection");
		});
	},

	onPanStart: (areaId: string, e: React.MouseEvent) => {
		e.preventDefault();

		const areaState = getAreaActionState<NodeEditorAreaState>(areaId);
		const initialPos = Vec2.fromEvent(e);

		requestAction({}, ({ addListener, dispatch, submitAction }) => {
			addListener.repeated("mousemove", e => {
				const pos = Vec2.fromEvent(e);
				const diff = pos.sub(initialPos);
				const action = nodeEditorAreaActions.setPan(areaState.pan.add(diff));
				dispatch(areaActions.dispatchToAreaState(areaId, action));
			});

			addListener.once("mouseup", () => submitAction("Pan"));
		});
	},

	onZoomClick: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		e.preventDefault();

		if (!isLeftClick(e)) {
			return;
		}

		const areaState = getAreaActionState<NodeEditorAreaState>(areaId);

		if (
			(areaState.scale < 0.0625 && isKeyDown("Alt")) ||
			(areaState.scale > 256 && !isKeyDown("Alt"))
		) {
			return;
		}

		requestAction({}, ({ dispatch, submitAction }) => {
			const fac = isKeyDown("Alt") ? 0.5 : 2;

			const pos = Vec2.fromEvent(e)
				.sub(Vec2.new(areaState.pan))
				.sub(Vec2.new(viewport.width / 2, viewport.height / 2))
				.sub(Vec2.new(viewport));

			const xt = pos.x / viewport.width;
			const yt = pos.y / viewport.height;

			const diff = Vec2.new(
				viewport.width * (xt * fac) * (isKeyDown("Alt") ? -1 : 0.5),
				viewport.height * (yt * fac) * (isKeyDown("Alt") ? -1 : 0.5),
			);

			const panAction = nodeEditorAreaActions.setPan(areaState.pan.sub(diff));
			const scaleAction = nodeEditorAreaActions.setScale(areaState.scale * fac);

			dispatch(areaActions.dispatchToAreaState(areaId, panAction));
			dispatch(areaActions.dispatchToAreaState(areaId, scaleAction));
			submitAction("Zoom");
		});
	},
};
