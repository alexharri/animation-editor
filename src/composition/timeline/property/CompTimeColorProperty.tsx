import React, { useRef, useEffect } from "react";
import { StopwatchIcon } from "~/components/icons/StopwatchIcon";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import {
	CompositionProperty,
	Composition,
	PropertyToValueMap,
} from "~/composition/compositionTypes";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { Timeline } from "~/timeline/timelineTypes";
import styles from "~/composition/timeline/property/CompTimeProperty.styles";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { RGBAColor, RGBColor } from "~/types";
import { CompTimePropertyName } from "~/composition/timeline/property/common/CompTimePropertyName";
import { compositionActions } from "~/composition/state/compositionReducer";
import { OpenCustomContextMenuOptions, ContextMenuBaseProps } from "~/contextMenu/contextMenuTypes";
import { useRefRect, useGetRefRectFn } from "~/hook/useRefRect";
import { ColorPicker } from "~/components/colorPicker/ColorPicker";
import { requestAction } from "~/listener/requestAction";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { useKeyDownEffect } from "~/hook/useKeyDown";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	compositionId: string;
	propertyId: string;
	propertyToValue: PropertyToValueMap;
	depth: number;
}
interface StateProps {
	property: CompositionProperty;
	isSelected: boolean;
	composition: Composition;
	timeline?: Timeline;
}
type Props = OwnProps & StateProps;

const CompTimeColorPropertyComponent: React.FC<Props> = (props) => {
	const { property } = props;

	const buttonRef = useRef<HTMLButtonElement>(null);
	const getButtonRect = useGetRefRectFn(buttonRef);

	const value = props.propertyToValue[props.propertyId].rawValue as RGBAColor;

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
		<div className={s("container")}>
			<div className={s("contentContainer")} style={{ marginLeft: 16 + props.depth * 16 }}>
				<div
					className={s("timelineIcon", { active: !!property.timelineId })}
					onMouseDown={separateLeftRightMouse({
						left: () =>
							compTimeHandlers.onPropertyKeyframeIconMouseDown(
								props.compositionId,
								property.id,
								property.timelineId,
							),
					})}
				>
					<StopwatchIcon />
				</div>
				<CompTimePropertyName propertyId={props.propertyId} />
				<div className={s("value")}>
					<button
						ref={buttonRef}
						onClick={onClick}
						className={s("colorValueButton")}
						style={{ backgroundColor: `rgb(${value.join(",")})` }}
					/>
				</div>
			</div>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ timelines, compositions, compositionSelection },
	{ propertyId, compositionId },
) => {
	const composition = compositions.compositions[compositionId];
	const property = compositions.properties[propertyId] as CompositionProperty;
	const isSelected = !!compositionSelection.properties[propertyId];

	const timeline = property.timelineId ? timelines[property.timelineId] : undefined;

	return {
		composition,
		timeline,
		isSelected,
		property,
	};
};

export const CompTimeColorProperty = connectActionState(mapStateToProps)(
	CompTimeColorPropertyComponent,
);
