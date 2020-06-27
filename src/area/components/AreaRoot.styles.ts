import { StyleParams } from "~/util/stylesheets";
import { cssZIndex, cssVariables } from "~/cssVariables";

export default ({ css, keyframes }: StyleParams) => {
	const areaToOpenContainerAnimation = keyframes`
		0% { transform: scale(0.25); opacity: .3 }
		50% { transform: scale(0.52); opacity: .8; }
		100% { transform: scale(0.5); }
	`;
	return {
		cursorCapture: css`
			display: none;

			&--active {
				position: absolute;
				display: block;
				top: 0;
				left: 0;
				bottom: 0;
				right: 0;
				z-index: ${cssZIndex.area.cursorCapture};
				cursor: not-allowed;
			}
		`,

		areaToOpenContainer: css`
			z-index: ${cssZIndex.area.areaToOpen};
			transform: scale(0.5);
			position: absolute;
			opacity: 0.8;
			animation: ${areaToOpenContainerAnimation} 0.3s;
			cursor: grabbing;

			& > * > * {
				pointer-events: none;
			}
		`,

		areaToOpenTargetOverlay: css`
			z-index: ${cssZIndex.area.areaToOpenTarget};
			position: absolute;
			background: ${cssVariables.primary700};
			border-radius: 8px;
			opacity: 0.1;
		`,
	};
};
