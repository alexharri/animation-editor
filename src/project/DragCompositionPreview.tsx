import React, { useRef } from "react";
import { cssVariables, cssZIndex } from "~/cssVariables";
import { useActionState } from "~/hook/useActionState";
import { getDragCompositionEligibleTargets } from "~/project/dragCompositionEligibleTargets";
import { hexToRGBAString } from "~/util/color/convertColor";
import { isVecInRect } from "~/util/math";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css, keyframes }) => {
	const fadeIn = keyframes`
		0% { transform: scale(0.5); opacity: .2 }
		50% { transform: scale(1.04); opacity: 1; }
		100% { transform: scale(1); }
	`;
	return {
		container: css`
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: ${cssZIndex.dragComp};
		`,

		previewBar: css`
			height: 2px;
			background: ${cssVariables.primary700};
			box-shadow: 0 0 8px 3px ${hexToRGBAString(cssVariables.primary500, 0.5)};
			pointer-events: none;
		`,

		compPreview: css`
			position: absolute;
			top: 0;
			left: 0;
			height: 24px;
			border-radius: 4px;
			line-height: 24px;
			color: ${cssVariables.white500};
			background: ${cssVariables.dark300};
			border: 1px solid ${cssVariables.gray800};
			padding: 0 16px;
			pointer-events: none;
			transform-origin: 0 0;
			animation: ${fadeIn} 0.3s;
		`,
	};
});

export const DragCompositionPreview: React.FC = () => {
	const dragComp = useActionState(({ project }) => project.dragComp);
	const composition = useActionState((actionState) => {
		return dragComp && actionState.compositionState.compositions[dragComp.compositionId];
	});

	const targetGroupsRef = useRef<ReturnType<typeof getDragCompositionEligibleTargets> | null>(
		null,
	);

	if (!dragComp) {
		if (targetGroupsRef.current) {
			targetGroupsRef.current = null;
		}
		return null;
	}

	if (!targetGroupsRef.current) {
		targetGroupsRef.current = getDragCompositionEligibleTargets();
	}

	const vec = dragComp.position;

	let renderCoords: { top: number; left: number; width: number } | undefined;

	const targetGroups = targetGroupsRef.current!;
	i: for (let i = 0; i < targetGroups.length; i += 1) {
		const { rect, targets } = targetGroups[i];
		if (!isVecInRect(vec, rect)) {
			continue;
		}

		for (let j = 0; j < targets.length; j += 1) {
			const target = targets[j];

			if (!isVecInRect(vec, target.rect)) {
				continue;
			}

			const isInTopHalf = vec.y < target.rect.top + target.rect.height / 2;
			renderCoords = {
				left: rect.left,
				width: rect.width,
				top: target.rect.top + (isInTopHalf ? 0 : target.rect.height),
			};
			break i;
		}

		// Below last item
		const yMax = Math.max(rect.top, ...targets.map(({ rect }) => rect.top + rect.height));
		renderCoords = {
			left: rect.left,
			width: rect.width,
			top: yMax,
		};
	}

	return (
		<div className={s("container")}>
			{renderCoords && (
				<div
					className={s("previewBar")}
					style={{
						width: renderCoords.width,
						transform: `translate(${renderCoords.left}px, ${renderCoords.top}px)`,
					}}
				/>
			)}
			<div
				style={{
					position: "relative",
					transform: `translate(${vec.x}px, ${vec.y}px) translate(8px, 20px)`,
				}}
			>
				<div className={s("compPreview")}>{composition!.name}</div>
			</div>
		</div>
	);
};
