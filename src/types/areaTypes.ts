import { AreaType } from "~/constants";
import { FlowAreaState } from "~/flow/state/flowAreaReducer";
import { TimelineAreaState } from "~/timeline/timelineAreaReducer";
import { CompositionWorkspaceAreaState } from "~/workspace/workspaceAreaReducer";

interface _AreaStates {
	[AreaType.FlowEditor]: FlowAreaState;
	[AreaType.Timeline]: TimelineAreaState;
	[AreaType.Workspace]: CompositionWorkspaceAreaState;
	[AreaType.History]: {};
	[AreaType.Project]: {};
}

export type AreaState<T extends AreaType> = _AreaStates[T];

export interface Area<T extends AreaType = AreaType> {
	type: T;
	state: AreaState<T>;
}

export interface AreaLayout {
	type: "area";
	id: string;
}

export type AreaRowLayout = {
	type: "area_row";
	id: string;
	orientation: "horizontal" | "vertical";
	areas: Array<{ size: number; id: string }>;
};

export interface AreaComponentProps<T> {
	width: number;
	height: number;
	left: number;
	top: number;
	areaState: T;
	areaId: string;
}
