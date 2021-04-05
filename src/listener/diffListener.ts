import { Diff } from "~/diff/diffs";

type SubscribeFn = (
	actionState: ActionState,
	diffs: Diff[],
	direction: "forward" | "backward",
) => void;

const diffSubscribers: Array<{ id: string; fn: SubscribeFn }> = [];

export const subscribeToDiffs = (fn: SubscribeFn): string => {
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
	actionState: ActionState,
	diffs: Diff[],
	direction: "forward" | "backward" = "forward",
) => {
	for (const { fn } of diffSubscribers) {
		fn(actionState, diffs, direction);
	}
};
