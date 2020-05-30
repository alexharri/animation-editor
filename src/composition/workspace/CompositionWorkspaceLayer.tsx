import React from "react";
import { useActionState } from "~/hook/useActionState";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";
import { useComputeHistory } from "~/hook/useComputeHistory";
import { ComputeNodeContext } from "~/nodeEditor/graph/computeNode";
import { computeLayerGraph } from "~/nodeEditor/graph/computeLayerGraph";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { connectActionState } from "~/state/stateUtils";
import { CompositionLayer } from "~/composition/compositionTypes";

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
	const allProperties = useActionState((state) => state.compositions.properties);

	const properties = useComputeHistory((state) =>
		layer.properties.map((id) => state.compositions.properties[id]),
	);

	const { computePropertyValues } = useComputeHistory(() => {
		return { computePropertyValues: computeLayerGraph(properties, graph) };
	});

	const propertyToValue = useActionState((actionState) => {
		const context: ComputeNodeContext = {
			computed: {},
			composition: actionState.compositions.compositions[layer.compositionId],
			layer,
			properties: layer.properties.map((id) => actionState.compositions.properties[id]),
			timelines: actionState.timelines,
			timelineSelection: actionState.timelineSelection,
		};

		return computePropertyValues(context);
	});

	const nameToProperty = layer.properties.reduce<{ [key: string]: number }>((obj, propertyId) => {
		const p = allProperties[propertyId];
		const value = propertyToValue[propertyId];
		obj[p.name] = value;
		return obj;
	}, {});

	const { width, height, x, y } = nameToProperty;

	return (
		<div
			className={s("element")}
			style={{
				width: width,
				height: height,
				left: x,
				top: y,
				border: props.isSelected ? "1px solid cyan" : undefined,
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
