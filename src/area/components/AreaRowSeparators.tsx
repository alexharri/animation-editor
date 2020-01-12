import React from "react";
import { handleDragAreaResize } from "~/area/handlers/areaDragResize";
import { AreaRowLayout } from "~/types/areaTypes";
import { AREA_BORDER_WIDTH } from "~/constants";
import { compileStylesheet } from "~/util/stylesheets";
import { cssZIndex } from "~/cssVariables";

const s = compileStylesheet(({ css }) => ({
	separator: css`
		position: absolute;
		z-index: ${cssZIndex.area.separator};
		cursor: ns-resize;

		&--horizontal {
			cursor: ew-resize;
		}
	`,
}));

interface OwnProps {
	row: AreaRowLayout;
	areaToViewport: MapOf<Rect>;
}
type Props = OwnProps;

export const AreaRowSeparators: React.FC<Props> = props => {
	const { row, areaToViewport } = props;

	return (
		<>
			{row.areas.slice(1).map((area, i) => {
				const viewport = areaToViewport[area.id];
				const horizontal = row.orientation === "horizontal";

				const separatorRect: Rect = horizontal
					? {
							height: viewport.height - AREA_BORDER_WIDTH * 4,
							width: AREA_BORDER_WIDTH * 2,
							left: viewport.left - AREA_BORDER_WIDTH,
							top: viewport.top + AREA_BORDER_WIDTH * 2,
					  }
					: {
							height: AREA_BORDER_WIDTH * 2,
							width: viewport.width - AREA_BORDER_WIDTH * 4,
							left: viewport.left + AREA_BORDER_WIDTH * 2,
							top: viewport.top - AREA_BORDER_WIDTH,
					  };

				return (
					<div
						key={area.id}
						className={s("separator", { horizontal })}
						style={separatorRect}
						onMouseDown={e => handleDragAreaResize(e, row, horizontal, i + 1)}
					/>
				);
			})}
		</>
	);
};
