import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";

export const calculateNodeHeight = (node: NodeEditorNode<NodeEditorNodeType>): number => {
	const inputs = node.inputs;
	const outputs = node.outputs;
	return 2 + 28 + outputs.length * 20 + 8 + inputs.length * 20 + 16;
};

export const calculateNodeInputY = (
	node: NodeEditorNode<NodeEditorNodeType>,
	inputIndex: number,
): number => {
	const outputs = node.outputs;
	return 1 + 28 + outputs.length * 20 + 8 + inputIndex * 20 + 10;
};

export const calculateNodeOutputY = (outputIndex: number): number => {
	return 1 + 28 + outputIndex * 20 + 10;
};

export const calculateNodeOutputPosition = (
	node: NodeEditorNode<NodeEditorNodeType>,
	outputIndex: number,
): Vec2 => {
	return node.position.addX(node.width).addY(1 + 28 + outputIndex * 20 + 10);
};

export const calculateNodeInputPosition = (
	node: NodeEditorNode<NodeEditorNodeType>,
	inputIndex: number,
): Vec2 => {
	return node.position.addY(1 + 28 + node.outputs.length * 20 + 8 + inputIndex * 20 + 10);
};
