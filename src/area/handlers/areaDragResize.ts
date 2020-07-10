import { requestAction } from "~/listener/requestAction";
import { AreaRowLayout } from "~/types/areaTypes";
import { capToRange, interpolate } from "~/util/math";
import { AREA_MIN_CONTENT_WIDTH } from "~/constants";
import { areaActions } from "~/area/state/areaActions";
import { computeAreaRowToMinSize } from "~/area/util/areaRowToMinSize";
import { getActionState } from "~/state/stateUtils";
import { computeAreaToViewport } from "~/area/util/areaToViewport";
import { getAreaRootViewport } from "~/area/util/getAreaViewport";

export const handleDragAreaResize = (
	_e: React.MouseEvent,
	row: AreaRowLayout,
	horizontal: boolean,
	areaIndex: number, // 1 is the first separator
) => {
	requestAction({}, ({ addListener, dispatch, submitAction, cancelAction }) => {
		const areaState = getActionState().area;
		const areaToViewport = computeAreaToViewport(
			areaState.layout,
			areaState.rootId,
			getAreaRootViewport(),
		);

		const getMinSize = (id: string) => {
			const layout = areaState.layout[id];

			if (layout.type === "area") {
				return 1;
			}

			const minSize = rowToMinSize[layout.id];
			return horizontal ? minSize.width : minSize.height;
		};

		const rowToMinSize = computeAreaRowToMinSize(areaState.rootId, areaState.layout);

		const a0 = row.areas[areaIndex - 1];
		const a1 = row.areas[areaIndex];

		const v0 = areaToViewport[a0.id];
		const v1 = areaToViewport[a1.id];

		const m0 = getMinSize(a0.id);
		const m1 = getMinSize(a1.id);

		const sizeToShare = a0.size + a1.size;

		const sharedViewport: Rect = {
			width: horizontal ? v0.width + v1.width : v0.width,
			height: !horizontal ? v0.height + v1.height : v0.height,
			left: v0.left,
			top: v0.top,
		};

		const viewportSize = horizontal ? sharedViewport.width : sharedViewport.height;
		const tMin0 = (AREA_MIN_CONTENT_WIDTH * m0) / viewportSize;
		const tMin1 = (AREA_MIN_CONTENT_WIDTH * m1) / viewportSize;

		if (tMin0 + tMin1 >= 0.99) {
			// There's basically no space available to resize
			cancelAction();
			return;
		}

		addListener.repeated("mousemove", (e) => {
			const vec = Vec2.fromEvent(e);

			const t0 = horizontal ? sharedViewport.left : sharedViewport.top;
			const t1 = horizontal
				? sharedViewport.left + sharedViewport.width
				: sharedViewport.top + sharedViewport.height;

			const val = horizontal ? vec.x : vec.y;
			const t = capToRange(tMin0, 1 - tMin1, (val - t0) / (t1 - t0));

			const sizes = [t, 1 - t].map((v) => interpolate(0, sizeToShare, v));

			const rowAreas = row.areas.map((x) => x.size);
			rowAreas[areaIndex - 1] = sizes[0];
			rowAreas[areaIndex] = sizes[1];

			dispatch(areaActions.setRowSizes(row.id, rowAreas));
		});

		addListener.once("mouseup", () => {
			submitAction("Resize areas");
		});
	});
};
