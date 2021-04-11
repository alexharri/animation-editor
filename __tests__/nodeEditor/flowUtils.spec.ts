import { FlowGraph, FlowNode } from "~/flow/flowTypes";
import {
	findInputsThatReferenceFlowNodeOutputs,
	removeFlowNodeAndReferencesToIt,
} from "~/flow/flowUtils";
import "~/globals";
import { ValueType } from "~/types";

const _graphBase: FlowGraph = {
	_addNodeOfTypeOnClick: null,
	_dragSelectRect: null,
	type: "layer_graph",
	id: "0",
	layerId: "",
	propertyId: "",
	nodes: {},
};

const _nodeBase: FlowNode<any> = {
	id: "0",
	inputs: [],
	outputs: [],
	position: Vec2.new(0, 0),
	state: {},
	type: null,
	width: 0,
};

describe("findInputsThatReferenceNodeOutputs", () => {
	it("correctly finds references", () => {
		const graph: FlowGraph = {
			..._graphBase,
			nodes: {
				a: {
					..._nodeBase,
					id: "a",
					inputs: [
						{
							name: "Input 0",
							pointer: null,
							type: ValueType.Any,
							value: null,
						},
						{
							name: "Input 1",
							pointer: { nodeId: "b", outputIndex: 1 },
							type: ValueType.Any,
							value: null,
						},
					],
				},
				b: {
					..._nodeBase,
					id: "b",
					outputs: [
						{
							type: ValueType.Any,
							name: "Output 0",
						},
					],
				},
			},
		};

		const output: ReturnType<typeof findInputsThatReferenceFlowNodeOutputs> = [
			{ nodeId: "a", inputIndex: 1 },
		];

		expect(findInputsThatReferenceFlowNodeOutputs("b", graph)).toEqual(output);
	});
});

describe("removeNodeAndReferencesToItInGraph", () => {
	it("removes the node and references to it", () => {
		const graph: FlowGraph = {
			..._graphBase,
			nodes: {
				a: {
					..._nodeBase,
					id: "a",
					inputs: [
						{
							name: "Input 0",
							pointer: null,
							type: ValueType.Any,
							value: null,
						},
						{
							name: "Input 1",
							pointer: { nodeId: "b", outputIndex: 1 },
							type: ValueType.Any,
							value: null,
						},
					],
				},
				b: {
					..._nodeBase,
					id: "b",
					outputs: [
						{
							type: ValueType.Any,
							name: "Output 0",
						},
					],
				},
			},
		};

		const output: ReturnType<typeof removeFlowNodeAndReferencesToIt> = {
			..._graphBase,
			nodes: {
				a: {
					..._nodeBase,
					id: "a",
					inputs: [
						{
							name: "Input 0",
							pointer: null,
							type: ValueType.Any,
							value: null,
						},
						{
							name: "Input 1",
							pointer: null,
							type: ValueType.Any,
							value: null,
						},
					],
				},
			},
		};

		expect(removeFlowNodeAndReferencesToIt("b", graph)).toEqual(output);
	});
});
