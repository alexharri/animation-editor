import { AreaType } from "~/constants";
import { flowOperations } from "~/flow/flowOperations";
import { RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { areaActionStateFromState, getActionState } from "~/state/stateUtils";
import { KeyboardShortcut, ShouldAddShortcutToStackFn } from "~/types";

const getAreaActionState = (areaId: string, actionState = getActionState()) =>
	areaActionStateFromState<AreaType.FlowEditor>(areaId, actionState);

const flowShortcuts = {
	removeSelectedNodes: (areaId: string, params: RequestActionParams) => {
		const op = createOperation(params);
		const { graphId } = getAreaActionState(areaId);
		flowOperations.removeSelectedNodesInGraph(op, graphId);
		op.submit();
	},
};

const wereNodesRemoved: ShouldAddShortcutToStackFn = (areaId, prevState, nextState) => {
	const { graphId } = getAreaActionState(areaId);

	const a = prevState.flowState.graphs[graphId];
	const b = nextState.flowState.graphs[graphId];

	if (a.nodes.length !== b.nodes.length) {
		return true;
	}

	return false;
};

export const flowEditorKeyboardShortcuts: KeyboardShortcut[] = [
	{
		name: "Remove selected nodes",
		key: "Backspace",
		fn: flowShortcuts.removeSelectedNodes,
		shouldAddToStack: wereNodesRemoved,
	},

	{
		name: "Remove selected nodes",
		key: "Delete",
		fn: flowShortcuts.removeSelectedNodes,
		shouldAddToStack: wereNodesRemoved,
	},
];
