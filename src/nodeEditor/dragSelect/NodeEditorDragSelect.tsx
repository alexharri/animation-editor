import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { cssZIndex } from "~/cssVariables";
import { useRef } from "react";
import { AreaComponentProps } from "~/types/areaTypes";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { connectActionState } from "~/state/stateUtils";

type OwnProps = AreaComponentProps<NodeEditorAreaState>;
interface StateProps {
	rect: Rect | null;
}
type Props = OwnProps & StateProps;

const s = compileStylesheetLabelled(({ css }) => ({
	target: css`
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: ${cssZIndex.nodeEditor.dragSelectPreview};
	`,

	rect: css`
		position: absolute;
		border: 1px solid red;
		background: rgba(255, 0, 0, 0.2);
	`,
}));

const NodeEditorDragSelectComponent: React.FC<Props> = (props) => {
	const ref = useRef<HTMLDivElement>(null);

	let { rect } = props;

	if (!rect) {
		return null;
	}

	const vec = Vec2.new(rect.left, rect.top)
		.scale(props.areaState.scale)
		.add(props.areaState.pan)
		.add(Vec2.new(props.width / 2, props.height / 2));
	const width = rect.width / props.areaState.scale;
	const height = rect.height / props.areaState.scale;

	return (
		<div className={s("target")} ref={ref}>
			<div className={s("rect")} style={{ left: vec.x, top: vec.y, width, height }} />
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ nodeEditor }, props) => {
	return { rect: nodeEditor.graphs[props.areaState.graphId]._dragSelectRect };
};

export const NodeEditorDragSelect = connectActionState(mapStateToProps)(
	NodeEditorDragSelectComponent,
);
