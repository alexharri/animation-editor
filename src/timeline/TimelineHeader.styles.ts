import { TIMELINE_HEADER_HEIGHT } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	header: css`
		position: relative;
		height: ${TIMELINE_HEADER_HEIGHT}px;
		display: flex;
		align-items: center;
	`,

	graphEditorToggle: css`
		position: absolute;
		top: 50%;
		right: 8px;
		transform: translate(0, -50%);
		color: ${cssVariables.light500};
		background: ${cssVariables.gray400};
		border-radius: 4px;
		font-size: 11px;
		padding: 0 8px;
		height: 24px;
		border: none;
		cursor: pointer;
	`,

	labelWrapper: css`
		padding-left: 32px;
		display: flex;
		align-items: flex-end;
		height: 32px;
	`,

	label: css`
		font-family: ${cssVariables.fontFamily};
		font-size: 11px;
		color: ${cssVariables.gray800};
	`,
});
