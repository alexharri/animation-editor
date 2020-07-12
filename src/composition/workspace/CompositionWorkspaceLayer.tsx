import React from "react";
import { useActionState } from "~/hook/useActionState";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";
import { useComputeHistory } from "~/hook/useComputeHistory";
import { ComputeNodeContext } from "~/nodeEditor/graph/computeNode";
import { computeLayerGraph } from "~/nodeEditor/graph/computeLayerGraph";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { connectActionState } from "~/state/stateUtils";
import { CompositionLayer } from "~/composition/compositionTypes";
import { PropertyName } from "~/types";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";

const styles = ({ css }: StyleParams) => ({
	element: css`
		background: red;
		position: absolute;
	`,
});

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	compositionId: string;
	layerId: string;
}
interface StateProps {
	layer: CompositionLayer;
	graph?: NodeEditorGraphState;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompositionWorkspaceLayerComponent: React.FC<Props> = (props) => {
	const { layer, graph } = props;

	const { computePropertyValues } = useComputeHistory(() => {
		return { computePropertyValues: computeLayerGraph(graph) };
	});

	const propertyToValue = useActionState((actionState) => {
		const context: ComputeNodeContext = {
			computed: {},
			compositionId: props.compositionId,
			layerId: props.layerId,
			compositionState: actionState.compositions,
			timelines: actionState.timelines,
			timelineSelection: actionState.timelineSelection,
		};

		const mostRecentGraph = actionState.nodeEditor.graphs[layer.graphId];
		return computePropertyValues(context, mostRecentGraph);
	});

	const properties = useActionState((state) => {
		return getLayerCompositionProperties(layer.id, state.compositions);
	});

	const nameToProperty = properties.reduce<{ [key in keyof typeof PropertyName]: any }>(
		(obj, p) => {
			const value = propertyToValue[p.id] ?? p.value;
			(obj as any)[PropertyName[p.name]] = value.computedValue;
			return obj;
		},
		{} as any,
	);

	const {
		Width,
		Height,
		PositionX,
		PositionY,
		Scale,
		Opacity,
		Rotation,
		Fill,
		StrokeWidth,
		StrokeColor,
		BorderRadius,
	} = nameToProperty;

	const fillColor = `rgba(${Fill.join(",")})`;
	const strokeColor = `rgba(${StrokeColor.join(",")})`;

	return (
		<rect
			width={Width}
			height={Height}
			rx={BorderRadius}
			className={s("element")}
			style={{
				left: 0,
				top: 0,
				opacity: Opacity,
				fill: fillColor,
				strokeWidth: StrokeWidth,
				stroke: strokeColor,
				transform: `translateX(${PositionX}px) translateY(${PositionY}px) scale(${Scale}) rotate(${Rotation}deg)`,
				transformOrigin: `${Width / 2}px ${Height / 2}px`,
			}}
		/>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor, compositions, compositionSelection },
	{ layerId },
) => {
	const layer = compositions.layers[layerId];
	return {
		layer,
		graph: layer.graphId ? nodeEditor.graphs[layer.graphId] : undefined,
		isSelected: !!compositionSelection.layers[layerId],
	};
};

export const CompositionWorkspaceLayer = connectActionState(mapState)(
	CompositionWorkspaceLayerComponent,
);
