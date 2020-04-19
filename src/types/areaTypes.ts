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
	viewport: Rect;
	areaState: T;
	areaId: string;
	childAreas: {
		[key: string]: string;
	};
}
