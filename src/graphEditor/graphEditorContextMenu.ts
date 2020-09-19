import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { ContextMenuOption } from "~/contextMenu/contextMenuReducer";
import { requestAction } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { timelineOperations } from "~/timeline/operations/timelineOperations";

interface Options {
	timelineIds: string[];
	compositionId: string;
}

export const openGraphEditorContextMenu = (position: Vec2, opts: Options) => {
	requestAction(
		{
			history: true,
			beforeSubmit: (params) => params.dispatch(contextMenuActions.closeContextMenu()),
		},
		(params) => {
			const { timelineIds, compositionId } = opts;

			const op = createOperation();

			const options: ContextMenuOption[] = [];

			options.push({
				label: "Remove selected keyframes",
				default: true,
				onSelect: () => {
					timelineOperations.removeSelectedKeyframes(op, timelineIds, compositionId);
					params.dispatch(op.actions);
					params.submitAction("Remove selected keyframes");
				},
			});

			params.dispatch(
				contextMenuActions.openContextMenu(
					"Graph Editor",
					options,
					position,
					params.cancelAction,
				),
			);
		},
	);
};
