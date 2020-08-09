import "~/globals";
import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import {
	findInputsThatReferenceNodeOutputs,
	removeNodeAndReferencesToItInGraph,
} from "~/nodeEditor/nodeEditorUtils";
import { ValueType } from "~/types";

const _graphBase: NodeEditorGraphState = {
	_addNodeOfTypeOnClick: null,
	_dragInputTo: null,
	_dragOutputTo: null,
	_dragSelectRect: null,
	moveVector: Vec2.new(0, 0),
	type: "layer_graph",
	id: "0",
	layerId: "",
	propertyId: "",
	nodes: {},
	selection: { nodes: {} },
};

const _nodeBase: NodeEditorNode<any> = {
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
		const graph: NodeEditorGraphState = {
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

		const output: ReturnType<typeof findInputsThatReferenceNodeOutputs> = [
			{ nodeId: "a", inputIndex: 1 },
		];

		expect(findInputsThatReferenceNodeOutputs("b", graph)).toEqual(output);
	});
});

describe("removeNodeAndReferencesToItInGraph", () => {
	it("removes the node and references to it", () => {
		const graph: NodeEditorGraphState = {
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

		const output: ReturnType<typeof removeNodeAndReferencesToItInGraph> = {
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

		expect(removeNodeAndReferencesToItInGraph("b", graph)).toEqual(output);
	});
});
