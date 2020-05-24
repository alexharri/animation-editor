import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";

const inputHeight = 20;
const outputHeight = 20;
const borderWidth = 1;
const headerHeight = 20;
const spacing = 8;
const bottomPadding = 16;

export const NODE_HEIGHT_CONSTANTS = {
	inputHeight,
	outputHeight,
	borderWidth,
	headerHeight,
	spacing,
	bottomPadding,
};

const aboveInputs: Partial<
	{ [key in NodeEditorNodeType]: (node: NodeEditorNode<any>) => number }
> = {
	[NodeEditorNodeType.expr]: (node: NodeEditorNode<NodeEditorNodeType.expr>) => {
		return node.state.textareaHeight + spacing;
	},
};

export const getAboveInputs = (node: NodeEditorNode<NodeEditorNodeType>): number => {
	return aboveInputs[node.type]?.(node) ?? 0;
};

export const calculateNodeHeight = (node: NodeEditorNode<NodeEditorNodeType>): number => {
	const inputs = node.inputs;
	const outputs = node.outputs;
	return (
		borderWidth * 2 +
		headerHeight +
		spacing +
		outputs.length * outputHeight +
		spacing +
		getAboveInputs(node) +
		inputs.length * inputHeight +
		bottomPadding
	);
};

export const calculateNodeInputY = (
	node: NodeEditorNode<NodeEditorNodeType>,
	inputIndex: number,
): number => {
	const outputs = node.outputs;
	return (
		borderWidth +
		headerHeight +
		spacing +
		outputs.length * outputHeight +
		(outputs.length ? spacing : 0) +
		getAboveInputs(node) +
		inputIndex * inputHeight +
		inputHeight / 2
	);
};

export const calculateNodeOutputY = (outputIndex: number): number => {
	return borderWidth + headerHeight + spacing + outputIndex * outputHeight + outputHeight / 2;
};

export const calculateNodeOutputPosition = (
	node: NodeEditorNode<NodeEditorNodeType>,
	outputIndex: number,
): Vec2 => {
	return node.position
		.addX(node.width)
		.addY(borderWidth + headerHeight + spacing + outputIndex * outputHeight + outputHeight / 2);
};

export const calculateNodeInputPosition = (
	node: NodeEditorNode<NodeEditorNodeType>,
	inputIndex: number,
): Vec2 => {
	return node.position.addY(
		borderWidth +
			headerHeight +
			spacing +
			node.outputs.length * outputHeight +
			(node.outputs.length ? spacing : 0) +
			getAboveInputs(node) +
			inputIndex * inputHeight +
			inputHeight / 2,
	);
};
