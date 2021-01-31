import React, { useEffect, useRef } from "react";
import { ColorPicker } from "~/components/colorPicker/ColorPicker";
import { compositionActions } from "~/composition/compositionReducer";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { ContextMenuBaseProps, OpenCustomContextMenuOptions } from "~/contextMenu/contextMenuTypes";
import { DiffFactoryFn } from "~/diff/diffFactory";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { useGetRefRectFn, useRefRect } from "~/hook/useRefRect";
import { requestAction } from "~/listener/requestAction";
import { getActionState } from "~/state/stateUtils";
import styles from "~/timeline/property/TimelineProperty.styles";
import { RGBAColor, RGBColor } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

interface ColorOwnProps {
	propertyId: string;
	value: RGBAColor | RGBColor;
}
type ColorProps = ColorOwnProps;

export const TimelinePropertyColorValue: React.FC<ColorProps> = (props) => {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const getButtonRect = useGetRefRectFn(buttonRef);

	const value = props.value;

	const onClick = () => {
		const [r, g, b] = value;
		const rgb: RGBColor = [r, g, b];

		requestAction({ history: true }, (params) => {
			const { compositionState } = getActionState();
			const property = compositionState.properties[props.propertyId];

			const Component: React.FC<ContextMenuBaseProps> = ({ updateRect }) => {
				const ref = useRef(null);
				const rect = useRefRect(ref);
				const latestColor = useRef(rgb);

				useEffect(() => {
					updateRect(rect!);
				}, [rect]);

				const diffFn: DiffFactoryFn = (diff) => diff.modifyProperty(property.id);

				const onChange = (rgbColor: RGBColor) => {
					latestColor.current = rgbColor;

					let value: RGBColor | RGBAColor = rgbColor;
					if (props.value.length === 4) {
						value = [...rgbColor, props.value[3]] as RGBAColor;
					}

					params.dispatch(compositionActions.setPropertyValue(props.propertyId, value));
					params.performDiff(diffFn);
				};

				const onSubmit = () => {
					let changed = false;

					for (let i = 0; i < rgb.length; i += 1) {
						if (rgb[i] !== latestColor.current[i]) {
							changed = true;
							break;
						}
					}

					if (!changed) {
						params.cancelAction();
						return;
					}

					params.dispatch(contextMenuActions.closeContextMenu());
					params.addDiff(diffFn);
					params.submitAction("Update color");
				};

				// Submit on enter
				useKeyDownEffect("Enter", (down) => {
					if (!down) {
						return;
					}

					onSubmit();
				});

				return (
					<div ref={ref} className={s("colorPickerWrapper")}>
						<ColorPicker rgbColor={rgb} onChange={onChange} onSubmit={onSubmit} />
					</div>
				);
			};

			const rect = getButtonRect()!;

			const options: OpenCustomContextMenuOptions = {
				component: Component,
				props: {},
				position: Vec2.new(rect.left + rect.width + 8, rect.top + rect.height),
				alignPosition: "bottom-left",
				closeMenuBuffer: Infinity,
				close: () => params.cancelAction(),
			};
			params.dispatch(contextMenuActions.openCustomContextMenu(options));
		});
	};

	return (
		<div className={s("value")}>
			<button
				ref={buttonRef}
				onClick={onClick}
				className={s("colorValueButton")}
				style={{ backgroundColor: `rgb(${value.join(",")})` }}
			/>
		</div>
	);
};
