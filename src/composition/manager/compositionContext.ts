import { GraphicManager } from "~/composition/manager/graphicManager";
import { LayerManager } from "~/composition/manager/layerManager";
import { PropertyManager } from "~/composition/manager/propertyManager";
import { Diff } from "~/diff/diffs";

export interface CompositionContext {
	compositionId: string;
	container: PIXI.Container;
	layers: LayerManager;
	properties: PropertyManager;
	graphics: GraphicManager;
	onDiffs: (actionState: ActionState, diffs: Diff[], direction: "forward" | "backward") => void;

	/**
	 * The state after the last call to `onDiffs`.
	 */
	prevState: ActionState;

	destroy: () => void;
}
