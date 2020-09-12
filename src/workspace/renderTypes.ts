import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { Composition, CompositionSelection } from "~/composition/compositionTypes";
import { Tool } from "~/constants";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";

export interface RenderGuidesContext {
	hasHoveredLayer: boolean;
	shapeState: ShapeState;
	shapeSelectionState: ShapeSelectionState;
	composition: Composition;
	compositionState: CompositionState;
	compositionSelection: CompositionSelection;
	compositionSelectionState: CompositionSelectionState;
	scale: number;
	pan: Vec2;
	viewport: Rect;
	tool: Tool;
	mousePosition?: Vec2;
	isPerformingAction: boolean;
	keyDown: {
		Shift: boolean;
		Command: boolean;
	};
	nSelectedShapeLayers: number;
}
