import { transformMat2 } from "~/composition/transformUtils";
import { AreaType } from "~/constants";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { AffineTransform, CompositionRenderValues, MousePosition } from "~/types";
import { globalToWorkspacePosition } from "~/workspace/workspaceUtils";

export interface PenToolContext {
	e: React.MouseEvent;
	mousePosition: MousePosition;
	compositionId: string;
	map: CompositionRenderValues;
	pan: Vec2;
	scale: number;
	viewport: Rect;
	layerId: string;
	layerTransform: AffineTransform;
	normalToViewport: (vec: Vec2) => Vec2;
	globalToNormal: (vec: Vec2) => Vec2;
	shapeState: ShapeState;
	shapeSelectionState: ShapeSelectionState;
}

export const constructPenToolContext = (
	e: React.MouseEvent,
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
	const mat2 = transformMat2(transform);
	const normalToViewport = (vec: Vec2): Vec2 => {
		return mat2.multiplyVec2(vec).add(transform.translate).scale(scale).add(pan);
	};
	const globalToNormal = (vec: Vec2) => globalToWorkspacePosition(vec, viewport, scale, _pan);

	const globalMousePosition = Vec2.fromEvent(e);
	const mousePosition: MousePosition = {
		global: globalMousePosition,
		viewport: globalMousePosition.subXY(viewport.left, viewport.top),
		translated: globalToWorkspacePosition(globalMousePosition, viewport, scale, pan),
	};

	const ctx: PenToolContext = {
		e,
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
	};
	return ctx;
};
