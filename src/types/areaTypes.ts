import { AreaType } from "~/constants";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { CompositionTimelineAreaState } from "~/composition/timeline/compositionTimelineAreaReducer";
import { CompositionWorkspaceAreaState } from "~/composition/workspace/compositionWorkspaceAreaReducer";

interface _AreaWindowStates {
	[AreaType.NodeEditor]: NodeEditorAreaState;
	[AreaType.CompositionTimeline]: CompositionTimelineAreaState;
	[AreaType.CompositionWorkspace]: CompositionWorkspaceAreaState;
	[AreaType.VectorEditor]: {};
	[AreaType.History]: {};
}

export type AreaState<T extends AreaType> = _AreaWindowStates[T];

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

export type AreaLayoutType = AreaLayout["type"] | AreaRowLayout["type"];

export interface AreaComponentProps<T> {
	width: number;
	height: number;
	left: number;
	top: number;
	areaState: T;
	areaId: string;
}
