import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";
import { TRACK_KEYFRAME_HEIGHT } from "~/constants";

export default ({ css }: StyleParams) => ({
	wrapper: css`
		overflow: hidden;
		height: 16px;
		margin-bottom: 1px;
		background: ${cssVariables.dark600};
		position: relative;
	`,

	keyframe: css`
		position: absolute;
		top: ${(16 - TRACK_KEYFRAME_HEIGHT) / 2}px;
		left: 0;
		width: ${TRACK_KEYFRAME_HEIGHT}px;
		height: ${TRACK_KEYFRAME_HEIGHT}px;
		line-height: ${TRACK_KEYFRAME_HEIGHT}px;
	`,
});
