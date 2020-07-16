import { NodeEditorNodeType, PropertyGroupName } from "~/types";
import { RequestActionParams } from "~/listener/requestAction";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { transformGlobalToNodeEditorPosition } from "~/nodeEditor/nodeEditorUtils";
import { NodeEditorNodeInput, NodeEditorNodeOutput } from "~/nodeEditor/nodeEditorIO";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { AreaType } from "~/constants";
import { CompositionPropertyGroup } from "~/composition/compositionTypes";

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
	const compositionState = actionState.compositions;
	const graph = actionState.nodeEditor.graphs[graphId];
	const layer = compositionState.layers[graph.layerId];

	const propertyGroups = layer.properties.map((id) => compositionState.properties[id]);
	const transformGroup = propertyGroups.find((group): group is CompositionPropertyGroup => {
		return group.type === "group" && group.name === PropertyGroupName.Transform;
	});

	if (!transformGroup) {
		throw new Error("Layer does not contain Transform property group");
	}

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
			label: "Property",
			options: [
				createAddNodeOption({
					type: NodeEditorNodeType.property_input,
					label: "Property input",
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.property_output,
					label: "Property output",
				}),
			],
			default: true,
		},
		createAddNodeOption({
			type: NodeEditorNodeType.composition,
			label: "Composition",
		}),
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
		},
		{
			label: "Color",
			options: [
				createAddNodeOption({
					type: NodeEditorNodeType.color_input,
					label: "Color Input",
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.color_from_rgba_factors,
					label: "From RGBA Factors",
				}),
				createAddNodeOption({
					type: NodeEditorNodeType.color_to_rgba_factors,
					label: "To RGBA Factors",
				}),
			],
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
		},
		{
			label: "Math",
			options: [
				createAddNodeOption({
					type: NodeEditorNodeType.expr,
					label: "Expression",
				}),
			],
		},
	];
};
