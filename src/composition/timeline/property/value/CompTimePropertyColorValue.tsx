import React, { useRef, useEffect } from "react";
import { compositionActions } from "~/composition/state/compositionReducer";
import { OpenCustomContextMenuOptions, ContextMenuBaseProps } from "~/contextMenu/contextMenuTypes";
import { useRefRect, useGetRefRectFn } from "~/hook/useRefRect";
import { ColorPicker } from "~/components/colorPicker/ColorPicker";
import { requestAction } from "~/listener/requestAction";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import styles from "~/composition/timeline/property/CompTimeProperty.styles";
import { RGBAColor, RGBColor } from "~/types";

const s = compileStylesheetLabelled(styles);

interface ColorOwnProps {
	propertyId: string;
	value: RGBAColor;
}
type ColorProps = ColorOwnProps;

export const CompTimePropertyColorValue: React.FC<ColorProps> = (props) => {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const getButtonRect = useGetRefRectFn(buttonRef);

	const value = props.value;

	const onClick = () => {
		const [r, g, b] = value;
		const rgb: RGBColor = [r, g, b];

		requestAction({ history: true }, (params) => {
			const Component: React.FC<ContextMenuBaseProps> = ({ updateRect }) => {
				const ref = useRef(null);
				const rect = useRefRect(ref);
				const latestColor = useRef(rgb);

				useEffect(() => {
					updateRect(rect!);
				}, [rect]);

				const onChange = (rgbColor: RGBColor) => {
					latestColor.current = rgbColor;

					const rgbaColor = [...rgbColor, 1] as RGBAColor;

					params.dispatch(
						compositionActions.setPropertyValue(props.propertyId, rgbaColor),
					);
				};

				// Submit on enter
				useKeyDownEffect("Enter", (down) => {
					if (!down) {
						return;
					}

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
					params.submitAction("Update color");
				});

				return (
					<div ref={ref} className={s("colorPickerWrapper")}>
						<ColorPicker rgbColor={rgb} onChange={onChange} />
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
