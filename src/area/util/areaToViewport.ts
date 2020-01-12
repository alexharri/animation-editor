import { AreaState } from "~/area/state/areaReducer";
import { AreaLayout, AreaRowLayout } from "~/types/areaTypes";
import { AREA_MIN_CONTENT_WIDTH } from "~/constants";
import { computeAreaRowToMinSize } from "~/area/util/areaRowToMinSize";

export const computeAreaToViewport = (areaState: AreaState, rootViewport: Rect) => {
	const areaToViewport: { [areaId: string]: Rect } = {};

	const rowToMinSize = computeAreaRowToMinSize(areaState);

	function computeArea(area: AreaLayout, contentArea: Rect) {
		areaToViewport[area.id] = contentArea;
	}

	function computeRow(row: AreaRowLayout, contentArea: Rect) {
		areaToViewport[row.id] = contentArea;

		const size = row.orientation === "horizontal" ? contentArea.width : contentArea.height;

		const totalArea = row.areas.reduce((acc, area) => acc + area.size, 0);

		const minSize = row.areas.map(() => 0);
		let adjustedArea = size;
		let adjustedSize = totalArea;
		let unbiasedSizes!: Array<{
			value: number;
			index: number;
			layout: AreaRowLayout | AreaLayout;
		}>;

		const computeUnbiasedSizes = () =>
			row.areas.map((item, i) => {
				const t = item.size / adjustedSize;
				const layout = areaState.layout[row.areas[i].id];
				const value = adjustedArea * t;
				return { value, index: i, layout };
			});

		let iterateAgain = true;

		while (iterateAgain) {
			iterateAgain = false;
			unbiasedSizes = computeUnbiasedSizes();

			for (let _i = 0; _i < unbiasedSizes.length; _i += 1) {
				if (minSize[_i]) {
					continue;
				}

				const { index, value } = unbiasedSizes[_i];

				const layout = areaState.layout[row.areas[index].id];
				const n =
					layout.type === "area"
						? 1
						: rowToMinSize[layout.id][
								layout.orientation === "horizontal" ? "height" : "width"
						  ];
				const diff =
					AREA_MIN_CONTENT_WIDTH * n - Math.min(value, AREA_MIN_CONTENT_WIDTH * n);

				if (diff !== 0) {
					adjustedArea -= AREA_MIN_CONTENT_WIDTH * n;
					adjustedSize -= row.areas[index].size;
					minSize[index] = AREA_MIN_CONTENT_WIDTH * n;

					iterateAgain = true;
					break;
				}
			}
		}

		let left = contentArea.left;
		let top = contentArea.top;

		const contentAreas = row.areas.map((area, i) => {
			const t = area.size / adjustedSize;

			const contentAreaForArea = {
				left,
				top,
				width: Math.floor(
					row.orientation === "horizontal"
						? minSize[i] || adjustedArea * t
						: contentArea.width,
				),
				height: Math.floor(
					row.orientation === "vertical"
						? minSize[i] || adjustedArea * t
						: contentArea.height,
				),
			};

			left += row.orientation === "horizontal" ? contentAreaForArea.width : 0;
			top += row.orientation === "vertical" ? contentAreaForArea.height : 0;

			return contentAreaForArea;
		});

		const contentAreasCombined = contentAreas.reduce(
			(acc, area) => {
				return { width: acc.width + area.width, height: acc.height + area.height };
			},
			{ width: 0, height: 0 },
		);

		const diff = {
			width: contentArea.width - contentAreasCombined.width,
			height: contentArea.height - contentAreasCombined.height,
		};

		if (row.orientation === "horizontal") {
			contentAreas[contentAreas.length - 1].width += diff.width;
		} else {
			contentAreas[contentAreas.length - 1].height += diff.height;
		}

		contentAreas.forEach((contentAreaForArea, i) => {
			const area = row.areas[i];
			compute(area.id, contentAreaForArea);
		});
	}

	function compute(id: string, contentArea: Rect) {
		const layout = areaState.layout[id];

		if (layout.type === "area_row") {
			computeRow(areaState.layout[id] as AreaRowLayout, contentArea);
		}

		computeArea(areaState.layout[id] as AreaLayout, contentArea);
	}

	compute(areaState.rootId, rootViewport);

	return areaToViewport;
};
