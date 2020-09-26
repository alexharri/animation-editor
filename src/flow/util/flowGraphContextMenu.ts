import { CompositionPropertyGroup } from "~/composition/compositionTypes";
import { AreaType } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { ContextMenuOption } from "~/contextMenu/contextMenuReducer";
import { flowActions } from "~/flow/flowActions";
import { FlowNodeInput, FlowNodeOutput, FlowNodeType } from "~/flow/flowTypes";
import { flowEditorGlobalToNormal } from "~/flow/flowUtils";
import { RequestActionParams } from "~/listener/requestAction";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { PropertyGroupName } from "~/types";

interface Options {
	graphId: string;
	areaId: string;
	viewport: Rect;
	params: RequestActionParams;
	setClickCapture: (fn: { fn: ((e: React.MouseEvent) => void) | null }) => void;
}

export const getFlowGraphContextMenuOptions = (options: Options) => {
	const { graphId, areaId, viewport, params, setClickCapture } = options;
	const { dispatch, submitAction } = params;

	const actionState = getActionState();
	const graph = actionState.flowState.graphs[graphId];
	const compositionState = actionState.compositionState;

	let layerId: string;

	if (graph.type === "layer_graph") {
		layerId = graph.layerId;
	} else {
		const property = compositionState.properties[graph.propertyId];
		layerId = property.layerId;
	}

	const layer = compositionState.layers[layerId];

	const propertyGroups = layer.properties.map((id) => compositionState.properties[id]);
	const transformGroup = propertyGroups.find((group): group is CompositionPropertyGroup => {
		return group.type === "group" && group.name === PropertyGroupName.Transform;
	});

	if (!transformGroup) {
		throw new Error("Layer does not contain Transform property group");
	}

	const { scale, pan } = getAreaActionState<AreaType.FlowEditor>(areaId);

	interface AddNodeOptions {
		label: string;
		type: FlowNodeType;
		getIO?: () => { inputs: FlowNodeInput[]; outputs: FlowNodeOutput[] };
	}

	const onAddSelect = (options: AddNodeOptions) => {
		dispatch(flowActions.startAddNode(graphId, options.type, options.getIO?.()));
		dispatch(contextMenuActions.closeContextMenu());

		const fn = (e: React.MouseEvent) => {
			if (!e) {
				return;
			}
			const pos = flowEditorGlobalToNormal(Vec2.fromEvent(e), viewport, scale, pan);
			dispatch(flowActions.submitAddNode(graphId, pos));
			submitAction("Add node");
		};
		setClickCapture({ fn });
	};

	const createAddNodeOption = (options: AddNodeOptions) => ({
		label: options.label,
		onSelect: () => onAddSelect(options),
	});

	const items: ContextMenuOption[] = [];

	items.push({
		label: "Property",
		options: [
			createAddNodeOption({
				type: FlowNodeType.property_input,
				label: "Property input",
			}),
			createAddNodeOption({
				type: FlowNodeType.property_output,
				label: "Property output",
			}),
		],
		default: true,
	});

	items.push(
		createAddNodeOption({
			type: FlowNodeType.composition,
			label: "Composition",
		}),
	);

	items.push(
		createAddNodeOption({
			type: FlowNodeType.expr,
			label: "Expression",
		}),
		{
			label: "Number",
			options: [
				createAddNodeOption({
					type: FlowNodeType.num_input,
					label: "Number Input",
				}),
				createAddNodeOption({
					type: FlowNodeType.num_cap,
					label: "Cap to Range",
				}),
				createAddNodeOption({
					type: FlowNodeType.num_lerp,
					label: "Linear Interpolation",
				}),
			],
		},
		{
			label: "Vec2",
			options: [
				createAddNodeOption({
					type: FlowNodeType.vec2_input,
					label: "Vec2 Input",
				}),
				createAddNodeOption({
					type: FlowNodeType.vec2_add,
					label: "Add",
				}),
				createAddNodeOption({
					type: FlowNodeType.vec2_factors,
					label: "Factors",
				}),
				createAddNodeOption({
					type: FlowNodeType.vec2_lerp,
					label: "Linear Interpolation",
				}),
			],
		},
		{
			label: "Color",
			options: [
				createAddNodeOption({
					type: FlowNodeType.color_input,
					label: "Color Input",
				}),
				createAddNodeOption({
					type: FlowNodeType.color_from_rgba_factors,
					label: "From RGBA Factors",
				}),
				createAddNodeOption({
					type: FlowNodeType.color_to_rgba_factors,
					label: "To RGBA Factors",
				}),
			],
		},
		{
			label: "Conversion",
			options: [
				createAddNodeOption({
					type: FlowNodeType.deg_to_rad,
					label: "Degrees to Radians",
				}),
				createAddNodeOption({
					type: FlowNodeType.rad_to_deg,
					label: "Radians to Degrees",
				}),
			],
		},
	);

	if (graph.type === "array_modifier_graph") {
		items.push(
			createAddNodeOption({
				type: FlowNodeType.array_modifier_index,
				label: "Array modifier index",
			}),
		);
	}

	return items;
};
