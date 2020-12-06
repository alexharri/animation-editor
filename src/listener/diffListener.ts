import { Diff } from "~/diff/diffs";

const diffSubscribers: Array<{
	id: string;
	fn: (diffs: Diff[], direction: "forward" | "backward") => void;
}> = [];

export const subscribeToDiffs = (
	fn: (diffs: Diff[], direction: "forward" | "backward") => void,
): string => {
	const id = (Math.max(0, ...diffSubscribers.map((item) => parseInt(item.id))) + 1).toString();
	diffSubscribers.push({ id, fn });
	return id;
};

export const unsubscribeToDiffs = (id: string) => {
	for (let i = 0; i < diffSubscribers.length; i++) {
		if (diffSubscribers[i].id === id) {
			diffSubscribers.splice(i, 1);
			break;
		}
	}
};

export const sendDiffsToSubscribers = (
	diffs: Diff[],
	direction: "forward" | "backward" = "forward",
) => {
	for (const { fn } of diffSubscribers) {
		fn(diffs, direction);
	}
};
