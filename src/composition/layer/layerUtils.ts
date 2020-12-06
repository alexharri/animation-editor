import { CompositionState } from "~/composition/compositionReducer";
import { CompoundProperty, Layer, Property, PropertyGroup } from "~/composition/compositionTypes";
import { propertyUtil } from "~/composition/property/propertyUtil";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { TIMELINE_HEADER_HEIGHT, TIMELINE_LAYER_HEIGHT } from "~/constants";
import { getPathIdToShapeGroupId, getShapeLayerPathIds, pathIdToCurves } from "~/shape/shapeUtils";
import { getActionState } from "~/state/stateUtils";
import { getTimelineTrackYPositions } from "~/trackEditor/trackEditorUtils";
import {
	CompoundPropertyName,
	LayerTransform,
	LayerType,
	NameToProperty,
	PropertyGroupName,
	PropertyName,
	PropertyValueMap,
} from "~/types";
import { boundingRectOfRects, isVecInRect } from "~/util/math";
import { pathBoundingRect } from "~/util/math/boundingRect";
import { Mat2 } from "~/util/math/mat";

const layerTypeToName: { [key in keyof typeof LayerType]: string } = {
	Ellipse: "Ellipse layer",
	Rect: "Rect layer",
	Composition: "Composition layer",
	Shape: "Shape layer",
	Line: "Line layer",
};

export const getLayerTypeName = (type: LayerType): string => {
	const key = LayerType[type] as keyof typeof LayerType;
	return layerTypeToName[key];
};

type GetLayerDimensionsStateRequired = Pick<
	ActionState,
	"compositionState" | "compositionSelectionState" | "shapeState" | "shapeSelectionState"
>;

const getShapeLayerBoundingRect = (
	state: GetLayerDimensionsStateRequired,
	layer: Layer,
): Rect | null => {
	const { compositionState, compositionSelectionState, shapeState, shapeSelectionState } = state;

	const pathIdToShapeGroupId = getPathIdToShapeGroupId(layer.id, compositionState);

	const pathIds = getShapeLayerPathIds(layer.id, compositionState);
	const composition = compositionState.compositions[layer.compositionId];
	const compositionSelection = compSelectionFromState(composition.id, compositionSelectionState);

	const rects = pathIds
		.map((pathId) => {
			const shapeGroupId = pathIdToShapeGroupId[pathId];
			const shapeSelected = compositionSelection.properties[shapeGroupId];
			const shapeMoveVector = shapeSelected ? composition.shapeMoveVector : Vec2.ORIGIN;
			return pathIdToCurves(pathId, shapeState, shapeSelectionState, shapeMoveVector)!;
		})
		.filter(Boolean)
		.map((curves) => pathBoundingRect(curves)!)
		.filter(Boolean);
	return boundingRectOfRects(rects);
};

export const getLayerRectDimensionsAndOffset = (
	layer: Layer,
	nameToProperty: { [key in keyof typeof PropertyName]: any },
	state: GetLayerDimensionsStateRequired,
) => {
	let width: number;
	let height: number;
	let offX = 0;
	let offY = 0;

	switch (layer.type) {
		case LayerType.Composition: {
			width = nameToProperty.Width;
			height = nameToProperty.Height;
			break;
		}

		case LayerType.Shape: {
			const rect = getShapeLayerBoundingRect(state, layer);

			if (rect) {
				width = rect.width;
				height = rect.height;
				offX = rect.left;
				offY = rect.top;
			} else {
				width = 50;
				height = 50;
			}

			break;
		}

		case LayerType.Rect: {
			width = nameToProperty.Width;
			height = nameToProperty.Height;
			break;
		}

		case LayerType.Ellipse: {
			width = nameToProperty.OuterRadius * 2;
			height = nameToProperty.OuterRadius * 2;
			break;
		}

		case LayerType.Line: {
			width = nameToProperty.Width;
			height = 2;
			offY -= 1;
		}
	}

	return [width, height, offX, offY];
};

export const getLayerNameToProperty = (
	propertyValueMap: PropertyValueMap,
	compositionState: CompositionState,
	layerId: string,
) => {
	const properties = getLayerCompositionProperties(layerId, compositionState);

	const nameToProperty = properties.reduce<NameToProperty>((obj, p) => {
		const value = propertyValueMap[p.id];
		(obj as any)[PropertyName[p.name]] = value.computedValue;
		return obj;
	}, {} as any);

	return nameToProperty;
};

export const getPickWhipLayerTarget = (
	globalMousePosition: Vec2,
	fromLayerId: string,
	compositionId: string,
	compositionState: CompositionState,
	panY: number,
	viewport: Rect,
): {
	layerId: string;
} | null => {
	const yPosMap = getTimelineTrackYPositions(compositionId, compositionState, panY);

	const mousePos = globalMousePosition
		.subXY(viewport.left, viewport.top)
		.subY(TIMELINE_HEADER_HEIGHT);

	const layerIds = getValidLayerParentLayerIds(fromLayerId, compositionState);

	for (let i = 0; i < layerIds.length; i += 1) {
		const layerId = layerIds[i];
		if (layerId === fromLayerId) {
			continue;
		}

		const top = yPosMap.layer[layerId];

		const rect: Rect = {
			left: 0,
			top,
			height: TIMELINE_LAYER_HEIGHT,
			width: viewport.width,
		};

		if (isVecInRect(mousePos, rect)) {
			return { layerId: layerId };
		}
	}

	return null;
};

export const getValidLayerParentLayerIds = (
	layerId: string,
	compositionState: CompositionState,
) => {
	const layer = compositionState.layers[layerId];
	const composition = compositionState.compositions[layer.compositionId];
	const layerIds = composition.layers.filter((id) => id !== layer.id);

	const isReferencedBy = (id: string): boolean => {
		const layer = compositionState.layers[id];
		if (!layer.parentLayerId) {
			return false;
		}
		if (layer.parentLayerId === layerId) {
			return true;
		}
		return isReferencedBy(layer.parentLayerId);
	};

	return layerIds.filter((layerId) => !isReferencedBy(layerId));
};

export const layerUtils = {
	findLayerProperty: <T extends Property | CompoundProperty | PropertyGroup>(
		inGroup: PropertyGroupName,
		layerId: string,
		compositionState: CompositionState,
		fn: (property: Property | CompoundProperty | PropertyGroup) => boolean,
	): T | null => {
		const layer = compositionState.layers[layerId];

		function crawl(propertyId: string): T | null {
			const property = compositionState.properties[propertyId];

			if (fn(property)) {
				return property as T;
			}

			if (property.type === "group") {
				for (const propertyId of property.properties) {
					const property = crawl(propertyId);
					if (property) {
						return property;
					}
				}
			}

			return null;
		}

		for (const propertyId of layer.properties) {
			const group = compositionState.properties[propertyId];
			if (group.name !== inGroup) {
				continue;
			}

			const property = crawl(propertyId);
			return property || null;
		}

		return null;
	},

	getPosition: (layerId: string): Vec2 => {
		const { compositionState } = getActionState();
		const property = layerUtils.findLayerProperty<CompoundProperty>(
			PropertyGroupName.Transform,
			layerId,
			compositionState,
			(property) => {
				return property.name === CompoundPropertyName.Position;
			},
		)!;
		const [xId, yId] = property.properties;
		const x = propertyUtil.getValue(xId);
		const y = propertyUtil.getValue(yId);
		return Vec2.new(x, y);
	},

	getTransform: (layerId: string): LayerTransform => {
		const { compositionState } = getActionState();
		const layer = compositionState.layers[layerId];

		let transformGroup!: PropertyGroup;

		for (const propertyId of layer.properties) {
			const group = compositionState.properties[propertyId];
			if (group.name === PropertyGroupName.Transform) {
				transformGroup = group;
				break;
			}
		}

		const transform: LayerTransform = {
			anchor: Vec2.new(0, 0),
			matrix: Mat2.identity(),
			origin: Vec2.ORIGIN,
			originBehavior: "relative",
			rotation: 0,
			scaleX: 0,
			scaleY: 0,
			translate: Vec2.new(0, 0),
		};

		const propertyIds = [...transformGroup.properties];
		for (let i = 0; i < propertyIds.length; i++) {
			const propertyId = propertyIds[i];
			const property = compositionState.properties[propertyId];

			switch (property.name) {
				case CompoundPropertyName.Position: {
					const [x, y] = property.properties.map(propertyUtil.getValue);
					transform.translate = Vec2.new(x, y);
					break;
				}
				case CompoundPropertyName.Anchor: {
					const [x, y] = property.properties.map(propertyUtil.getValue);
					transform.anchor = Vec2.new(x, y);
					break;
				}
				case CompoundPropertyName.Scale: {
					const [x, y] = property.properties.map(propertyUtil.getValue);
					transform.scaleX = x;
					transform.scaleY = y;
					break;
				}
				case PropertyName.Rotation: {
					const rotation = propertyUtil.getValue(property.id);
					transform.rotation = rotation;
				}
			}
		}

		return transform;
	},
};
