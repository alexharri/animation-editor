import { AreaType } from "~/constants";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { CompositionRenderValues, LayerTransform, MousePosition } from "~/types";
import { globalToWorkspacePosition } from "~/workspace/workspaceUtils";

export interface PenToolContext {
	mousePosition: MousePosition;
	compositionId: string;
	map: CompositionRenderValues;
	pan: Vec2;
	scale: number;
	viewport: Rect;
	areaId: string;
	layerId: string;
	layerTransform: LayerTransform;
	normalToViewport: (vec: Vec2) => Vec2;
	globalToNormal: (vec: Vec2) => Vec2;
	shapeState: ShapeState;
	shapeSelectionState: ShapeSelectionState;
}

export const constructPenToolContext = (
	globalMousePosition: Vec2,
	layerId: string,
	areaId: string,
	viewport: Rect,
): PenToolContext => {
	const actionState = getActionState();
	const areaState = getAreaActionState<AreaType.Workspace>(areaId);
	const { compositionId, scale, pan: _pan } = areaState;
	const pan = _pan.add(Vec2.new(viewport.width / 2, viewport.height / 2));
	const composition = actionState.compositionState.compositions[compositionId];
	const map = getCompositionRenderValues(
		actionState,
		compositionId,
		composition.frameIndex,
		{
			width: composition.width,
			height: composition.height,
		},
		{ recursive: false },
	);

	const transform = map.transforms[layerId].transform[0];
	const normalToViewport = (vec: Vec2): Vec2 => {
		return transform.matrix.multiplyVec2(vec).add(transform.translate).scale(scale).add(pan);
	};
	const globalToNormal = (vec: Vec2) => globalToWorkspacePosition(vec, viewport, scale, _pan);

	const mousePosition: MousePosition = {
		global: globalMousePosition,
		viewport: globalMousePosition.subXY(viewport.left, viewport.top),
		normal: globalToWorkspacePosition(globalMousePosition, viewport, scale, pan),
	};

	const ctx: PenToolContext = {
		mousePosition,
		compositionId,
		layerId,
		layerTransform: transform,
		map,
		pan,
		scale,
		normalToViewport,
		globalToNormal,
		shapeState: actionState.shapeState,
		shapeSelectionState: actionState.shapeSelectionState,
		viewport,
		areaId,
	};
	return ctx;
};
