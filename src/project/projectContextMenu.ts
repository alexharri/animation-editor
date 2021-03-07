import { compositionActions } from "~/composition/compositionReducer";
import { Composition } from "~/composition/compositionTypes";
import { getTimelineIdsReferencedByComposition } from "~/composition/compositionUtils";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { ContextMenuOption } from "~/contextMenu/contextMenuReducer";
import { requestAction } from "~/listener/requestAction";
import { projectActions } from "~/project/projectReducer";
import { getActionState } from "~/state/stateUtils";
import { timelineActions } from "~/timeline/timelineActions";
import { createMapNumberId } from "~/util/mapUtils";
import { getNonDuplicateName } from "~/util/names";

interface Options {
	compositionId?: string;
}

export const createProjectContextMenu = (position: Vec2, { compositionId }: Options): void => {
	requestAction({ history: true }, (params) => {
		const options: ContextMenuOption[] = [];

		if (!compositionId) {
			options.push({
				label: "Add new composition",
				onSelect: () => {
					const compositions = getActionState().compositionState.compositions;

					const existingNames = Object.values(compositions).map((comp) => comp.name);

					const composition: Composition = {
						id: createMapNumberId(compositions),
						name: getNonDuplicateName("Composition", existingNames),
						height: 400,
						width: 400,
						layers: [],
						length: 5 * 60, // 5 seconds
						frameIndex: 0,
					};

					params.dispatch(projectActions.addComposition(composition));
					params.dispatch(compositionActions.setComposition(composition));
					params.dispatch(contextMenuActions.closeContextMenu());
					params.submitAction("Add new composition");
				},
			});
		}

		if (compositionId) {
			const composition = getActionState().compositionState.compositions[compositionId];

			options.push({
				label: `Delete composition '${composition.name}'`,
				onSelect: () => {
					const { compositionState } = getActionState();

					const timelineIds = getTimelineIdsReferencedByComposition(
						compositionId,
						compositionState,
					);

					params.dispatch(
						projectActions.removeComposition(compositionId),
						compositionActions.removeComposition(compositionId),
						...timelineIds.map((id) => timelineActions.removeTimeline(id)),
					);

					params.dispatch(contextMenuActions.closeContextMenu());
					params.submitAction("Remove composition");
				},
			});
		}

		/**
		 * @todo Composition Settings
		 */

		params.dispatch(
			contextMenuActions.openContextMenu("Project", options, position, params.cancelAction),
		);
	});
};
