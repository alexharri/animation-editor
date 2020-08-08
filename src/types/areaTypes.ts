import { CompTimeAreaState } from "~/composition/timeline/compTimeAreaReducer";
import { CompositionWorkspaceAreaState } from "~/composition/workspace/compWorkspaceAreaReducer";
import { AreaType } from "~/constants";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";

interface _AreaStates {
	[AreaType.NodeEditor]: NodeEditorAreaState;
	[AreaType.CompositionTimeline]: CompTimeAreaState;
	[AreaType.CompositionWorkspace]: CompositionWorkspaceAreaState;
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
