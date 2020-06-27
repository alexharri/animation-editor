import { NodeEditorNodeType } from "~/types";
import { RequestActionParams } from "~/listener/requestAction";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { transformGlobalToNodeEditorPosition } from "~/nodeEditor/nodeEditorUtils";
import { NodeEditorNodeInput, NodeEditorNodeOutput } from "~/nodeEditor/nodeEditorIO";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { AreaType } from "~/constants";

interface Options {
	graphId: string;
	areaId: string;
	viewport: Rect;
	params: RequestActionParams;
	setClickCapture: (fn: { fn: ((e: React.MouseEvent) => void) | null }) => void;
}

export const getNodeEditorContextMenuOptions = (options: Options) => {
	const { graphId, areaId, viewport, params, setClickCapture } = options;
	const { dispatch, submitAction } = params;

	const actionState = getActionState();
	const graph = actionState.nodeEditor.graphs[graphId];
	const layer = actionState.compositions.layers[graph.layerId];
	const properties = layer.properties.map(
		(propertyId) => actionState.compositions.properties[propertyId],
	);

	const { scale, pan } = getAreaActionState<AreaType.NodeEditor>(areaId);

	interface AddNodeOptions {
		label: string;
		type: NodeEditorNodeType;
		getIO?: () => { inputs: NodeEditorNodeInput[]; outputs: NodeEditorNodeOutput[] };
	}

	const onAddSelect = (options: AddNodeOptions) => {
		dispatch(nodeEditorActions.startAddNode(graphId, options.type, options.getIO?.()));
		dispatch(contextMenuActions.closeContextMenu());

		const fn = (e: React.MouseEvent) => {
			if (!e) {
				return;
			}
			const pos = transformGlobalToNodeEditorPosition(
				Vec2.fromEvent(e),
				viewport,
				scale,
				pan,
			);
			dispatch(nodeEditorActions.submitAddNode(graphId, pos));
			submitAction("Add node");
		};
		setClickCapture({ fn });
	};

	const createAddNodeOption = (options: AddNodeOptions) => ({
		label: options.label,
		onSelect: () => onAddSelect(options),
	});

	return [
		{
			label: "Layer",
			options: [
				createAddNodeOption({
					type: NodeEditorNodeType.layer_input,
					label: "Layer input",
					getIO: () => {
						return {
							outputs: properties.map<NodeEditorNodeOutput>((property) => ({
								name: property.name,
								type: property.type,
							})),
							inputs: [],
						};
					},
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.layer_output,
					label: "Layer output",
					getIO: () => {
						return {
							inputs: properties.map<NodeEditorNodeInput>((property) => ({
								name: property.name,
								pointer: null,
								type: property.type,
								value: null,
							})),
							outputs: [],
						};
					},
				}),
			],
			default: true,
		},
		{
			label: "Number",
			options: [
				createAddNodeOption({
					type: NodeEditorNodeType.num_input,
					label: "Number Input",
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.num_cap,
					label: "Cap to Range",
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.num_lerp,
					label: "Linear Interpolation",
				}),
			],
			default: true,
		},
		{
			label: "Vec2",
			options: [
				createAddNodeOption({
					type: NodeEditorNodeType.vec2_input,
					label: "Vec2 Input",
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.vec2_add,
					label: "Add",
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.vec2_factors,
					label: "Factors",
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.vec2_lerp,
					label: "Linear Interpolation",
				}),
			],
			default: true,
		},
		{
			label: "Conversion",
			options: [
				createAddNodeOption({
					type: NodeEditorNodeType.deg_to_rad,
					label: "Degrees to Radians",
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.rad_to_deg,
					label: "Radians to Degrees",
				}),
			],
			default: true,
		},
		{
			label: "Math",
			options: [
				createAddNodeOption({
					type: NodeEditorNodeType.expr,
					label: "Expression",
				}),
			],
			default: true,
		},
	];
};
