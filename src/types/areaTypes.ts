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

export interface AreaWindowProps<T> {
	width: number;
	height: number;
	left: number;
	top: number;
	areaState: T;
	areaId: string;
}
