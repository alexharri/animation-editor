import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";

const inputHeight = 20;
const outputHeight = 20;
const borderWidth = 1;
const headerHeight = 20;
const spacing = 8;
const bottomPadding = 16;
const selectHeight = 18;

export const NODE_HEIGHT_CONSTANTS = {
	inputHeight,
	outputHeight,
	borderWidth,
	headerHeight,
	spacing,
	bottomPadding,
	selectHeight,
};

const getVec2InputHeight = (node: NodeEditorNode<NodeEditorNodeType>, index: number) => {
	return node.inputs[index].pointer ? inputHeight : inputHeight * 3;
};

const getInputHeight = (node: NodeEditorNode<NodeEditorNodeType>, index: number) => {
	switch (node.type) {
		case NodeEditorNodeType.vec2_lerp: {
			switch (index) {
				case 0:
					return getVec2InputHeight(node, index);
				case 1:
					return getVec2InputHeight(node, index);
			}
			break;
		}
	}

	return inputHeight;
};

const getCombinedInputsHeight = (
	node: NodeEditorNode<NodeEditorNodeType>,
	upToIndex = node.inputs.length,
) => {
	let out = 0;
	for (let i = 0; i < upToIndex; i += 1) {
		out += getInputHeight(node, i);
	}
	return out;
};

const aboveOutputs: Partial<
	{ [key in NodeEditorNodeType]: (node: NodeEditorNode<any>) => number }
> = {
	[NodeEditorNodeType.property_input]: () => {
		return selectHeight + spacing + selectHeight + spacing;
	},
	[NodeEditorNodeType.property_output]: () => {
		return selectHeight + spacing;
	},
};

const getAboveOutputs = (node: NodeEditorNode<NodeEditorNodeType>): number => {
	return aboveOutputs[node.type]?.(node) ?? 0;
};

const aboveInputs: Partial<
	{ [key in NodeEditorNodeType]: (node: NodeEditorNode<any>) => number }
> = {
	[NodeEditorNodeType.expr]: (node: NodeEditorNode<NodeEditorNodeType.expr>) => {
		return node.state.textareaHeight + spacing;
	},
};

const getAboveInputs = (node: NodeEditorNode<NodeEditorNodeType>): number => {
	return aboveInputs[node.type]?.(node) ?? 0;
};

export const calculateNodeHeight = (node: NodeEditorNode<NodeEditorNodeType>): number => {
	const outputs = node.outputs;
	return (
		borderWidth * 2 +
		headerHeight +
		spacing +
		getAboveOutputs(node) +
		outputs.length * outputHeight +
		spacing +
		getAboveInputs(node) +
		getCombinedInputsHeight(node) +
		bottomPadding
	);
};

export const calculateNodeOutputPosition = (
	node: NodeEditorNode<NodeEditorNodeType>,
	outputIndex: number,
): Vec2 => {
	return node.position
		.addX(node.width)
		.addY(
			borderWidth +
				headerHeight +
				spacing +
				getAboveOutputs(node) +
				outputIndex * outputHeight +
				outputHeight / 2,
		);
};

export const calculateNodeInputPosition = (
	node: NodeEditorNode<NodeEditorNodeType>,
	inputIndex: number,
): Vec2 => {
	return node.position.addY(
		borderWidth +
			headerHeight +
			spacing +
			getAboveOutputs(node) +
			node.outputs.length * outputHeight +
			(node.outputs.length ? spacing : 0) +
			getAboveInputs(node) +
			getCombinedInputsHeight(node, inputIndex) +
			inputHeight / 2,
	);
};
