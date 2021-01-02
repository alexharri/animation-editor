import { flowNodeArg } from "~/flow/flowArgs";
import { FlowComputeNodeArg, FlowNodeType } from "~/flow/flowTypes";

interface ArrayModifierIndexResolver {
	type: FlowNodeType.array_modifier_index;
	fn: (index: number) => FlowComputeNodeArg[];
}

interface CompositionResolver {
	type: FlowNodeType.composition;
	fn: (width: number, height: number, frameIndex: number) => FlowComputeNodeArg[];
}

interface PropertyInputResolver {
	type: FlowNodeType.property_input;
	fn: (...args: FlowComputeNodeArg[]) => FlowComputeNodeArg[];
}

type Resolver = ArrayModifierIndexResolver | CompositionResolver | PropertyInputResolver;

const resolvers = {
	[FlowNodeType.array_modifier_index]: (index: number): FlowComputeNodeArg[] => {
		return [flowNodeArg.number(index)];
	},
	[FlowNodeType.composition]: (
		width: number,
		height: number,
		frameIndex: number,
	): FlowComputeNodeArg[] => {
		return [
			flowNodeArg.number(width),
			flowNodeArg.number(height),
			flowNodeArg.number(frameIndex),
		];
	},
	[FlowNodeType.property_input]: (...args: FlowComputeNodeArg[]): FlowComputeNodeArg[] => {
		return args;
	},
};

export const getResolver = ()