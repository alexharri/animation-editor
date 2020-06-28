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
import {
	getLayerCompositionProperties,
	getLayerTransformProperties,
} from "~/composition/util/compositionPropertyUtils";

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

	const properties = useActionState((state) => {
		return getLayerCompositionProperties(layer.id, state.compositions);
	});

	const transformProperties = useActionState((state) => {
		return getLayerTransformProperties(layer.id, state.compositions);
	});

	const { computePropertyValues } = useComputeHistory(() => {
		return { computePropertyValues: computeLayerGraph(transformProperties, graph) };
	});

	const propertyToValue = useActionState((actionState) => {
		const context: ComputeNodeContext = {
			computed: {},
			composition: actionState.compositions.compositions[layer.compositionId],
			layer,
			properties: transformProperties,
			timelines: actionState.timelines,
			timelineSelection: actionState.timelineSelection,
		};

		const mostRecentGraph = actionState.nodeEditor.graphs[layer.graphId];
		return computePropertyValues(context, mostRecentGraph);
	});

	const nameToProperty = properties.reduce((obj, p) => {
		const value = propertyToValue[p.id] ?? p.value;
		(obj as any)[PropertyName[p.name]] = value;
		return obj;
	}, {} as { [key in keyof typeof PropertyName]: number });

	const { Width, Height, PositionX, PositionY, Scale, Rotation } = nameToProperty;

	return (
		<div
			className={s("element")}
			style={{
				width: Width,
				height: Height,
				left: PositionX,
				top: PositionY,
				border: props.isSelected ? "1px solid cyan" : undefined,
				transform: `translateX(${PositionX}px) translateY(${PositionY}px) scale(${Scale}) rotate(${Rotation}deg)`,
			}}
		></div>
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
