interface Options {
	graphId: string;
	nodeId: string;
}

export class FlowNodeError extends Error {
	public graphId: string;
	public nodeId: string;

	constructor(message: string, options: Options) {
		super(message);

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, FlowNodeError);
		}

		this.name = "FlowNodeError";

		const { graphId, nodeId } = options;
		this.graphId = graphId;
		this.nodeId = nodeId;
	}
}
