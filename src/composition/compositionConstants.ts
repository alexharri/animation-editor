import { CompoundPropertyName, LayerType, PropertyGroupName, PropertyName } from "~/types";

const layerTypeToName: { [key in keyof typeof LayerType]: string } = {
	Ellipse: "Ellipse layer",
	Rect: "Rect layer",
	Composition: "Composition layer",
	Shape: "Shape layer",
	Line: "Line layer",
};

const propertyGroupNameToLabel: { [key in keyof typeof PropertyGroupName]: string } = {
	Dimensions: "Dimensions",
	Transform: "Transform",
	Content: "Content",
	Structure: "Structure",
	Modifiers: "Modifiers",
	ArrayModifier: "Array Modifier",
	Shape: "Shape",
	Fill: "Fill",
	Stroke: "Stroke",
};

const compoundPropertyNameToLabel: { [key in keyof typeof CompoundPropertyName]: string } = {
	Anchor: "Anchor",
	ArrayModifier_Origin: "Origin",
	Position: "Position",
	Scale: "Scale",
};

const propertyNameToLabel: { [key in keyof typeof PropertyName]: string } = {
	AnchorX: "Anchor X",
	AnchorY: "Anchor Y",
	Scale: "Scale",
	ScaleX: "X Scale",
	ScaleY: "Y Scale",
	Rotation: "Rotation",
	PositionX: "X Position",
	PositionY: "Y Position",
	Opacity: "Opacity",

	Height: "Height",
	Width: "Width",
	Fill: "Fill",
	StrokeColor: "Stroke Color",
	StrokeWidth: "Stroke Width",
	BorderRadius: "Border Radius",
	InnerRadius: "Inner Radius",
	OuterRadius: "Outer Radius",

	ArrayModifier_Count: "Count",
	ArrayModifier_TransformBehavior: "Transform Behavior",
	ArrayModifier_RotationCorrection: "Rotation Correction",
	ArrayModifier_OriginX: "X Origin",
	ArrayModifier_OriginY: "Y Origin",
	ArrayModifier_OriginBehavior: "Origin Behavior",

	ShapeLayer_Path: "Path",
	RGBAColor: "Color",
	RGBColor: "Color",
	FillRule: "Fill Rule",
	LineCap: "Line Cap",
	LineJoin: "Line Join",
	MiterLimit: "Miter Limit",
};

export const compositionConstants = {
	layerTypeToName,
	propertyNameToLabel,
	propertyGroupNameToLabel,
	compoundPropertyNameToLabel,
};
