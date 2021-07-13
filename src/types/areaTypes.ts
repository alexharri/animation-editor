import { AreaType } from "~/constants";
import { FlowAreaState } from "~/flow/state/flowAreaReducer";
import { TimelineAreaState } from "~/timeline/timelineAreaReducer";
import { WorkspaceAreaState } from "~/workspace/workspaceAreaReducer";

export interface AreaToOpen {
	position: Vec2;
	area: Area;
}

interface _AreaStates {
	[AreaType.FlowEditor]: FlowAreaState;
	[AreaType.Timeline]: TimelineAreaState;
	[AreaType.Workspace]: WorkspaceAreaState;
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

export type AreaRowOrientation = "horizontal" | "vertical";

export type AreaRowLayout = {
	type: "area_row";
	id: string;
	orientation: AreaRowOrientation;
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
