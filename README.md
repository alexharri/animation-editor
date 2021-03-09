# Animation Editor

![Hero image](/files/readme-images/graph-editor-multiple.png)

## Overview

-   [Introduction](#introduction)
-   [Compositions and Layers](#compositions-and-layers)
-   [Pen Tool](#pen-tool)
-   [SVG Import](#compositions-and-layers)
-   [Array Modifiers](#array-modifiers)
-   [Flow Editor](#flow-editor)
-   [Other](#other)

## Introduction

The goal of this project is to become a production-grade animation suite for the web, comprised of an editor and a runetime.

The project is, and will remain, open source and free to use.

Right now this project is just the editor part of the equasion. Once the editors basic feature set reaches maturity, work on the runtime will begin.

## What can I do with this right now?

Not much yet.

The core of the editor and its main features are approaching stability, but the project is still incredibly inaccessible. The learning curve is very steep and there is no way to save your changes permanently (the project uses localstorage).

What I can offer you is a glimpse into the future. Take a look at the features below and marvel at the feature you may, or may not, be able to use months and years from now!

# Main features

## Compositions and Layers

To the people familiar with Adobe After Effects, the term "composition" will feel very natural. But for programmers and designers coming from Figma, "composition" is just another word for "component".

![A composition][img_composition]

Compositions have a width, a height and a length. The width and height specify the display area, whilst the length specifies the number of frames in the compositions "run time".

Compositions also contain any number of layers. Right now five types of layers are supported:

-   Rect
-   Ellipse
-   Shape
-   Line
-   Composition

The first four are relatively straightforward. They are the primite building blocks that are used to create more complex graphics.

But composition layers allow us to create reusable compositions. Compositions can be nested within one another.

![Composition nesting][img_composition_nesting]

Barring circular references, compositions can be infinitely nested within other compositions.

[img_composition]: /files/readme-images/composition.png
[img_composition_nesting]: /files/readme-images/composition-nesting.png

## Timeline

The Timeline shows you the layers within a composition, and allows you to view and modify their properties.

A layer may be animated by clicking on the stopwatch icon. The keyframes of the layer will be displayed to the right in the Track Editor. The keyframes being blue indicates that they are selected. The different shapes indicate different types of interpolation.

![Timeline][img_timeline]

By clicking on the "Graph Editor" button, the Graph Editor can be viewed instead of the Track Editor. It allows for more fine-grained control over animations.

![Graph Editor][img_graph_editor_single]

Multiple timelines can be edited at the same time by selecting multiple properties.

![Graph Editor][img_graph_editor_multiple]

[img_timeline]: /files/readme-images/timeline.png
[img_graph_editor_single]: /files/readme-images/graph-editor-single.png
[img_graph_editor_multiple]: /files/readme-images/graph-editor-multiple.png

## Pen Tool

The pen tool allows you to create shape layers with arbitrary paths.

![Pen tool][img_pen_tool]

Shape layers contain the configuration options you would expect:

-   Fill color and opacity
-   Stroke width, color and opacity
-   Line cap (butt, round, square)
-   Line join (bevel, round, miter)
-   Miter limit

A single shape layer may contain any number of paths.

[img_pen_tool]: /files/readme-images/pen-tool.png

## SVG Import

Note: The SVG importer is still very much a work-in-progress,. The SVG spec is incredibly feature rich, so the imported result may differ significantly from the source SVG.

The SVG imported supports most basic SVG element types.

![An imported SVG][img_svg_import]

CSS transforms are supported, but any `matrix` transforms result in the content of the layer being converted to a shape layer with no transform. This is because CSS `matrix` transforms cannot be represented with a single layer transform (shears are not supported).

Styles can be applied to elements via inline styles or a `style` tag, though the support for CSS within `style` is very, very basic (just direct class names and IDs).

Right now there is no way to import SVGs in the UI. It can only be done via code as of right now.

[img_svg_import]: /files/readme-images/svg-import.png

## Array modifiers

Array modifiers allow any layer to be have a transform recursively applied to it.

Here is a basic example of a single circle layer being repeatedly rotated and scaled up slightly.

![Array modifier circle example][img_array_modifier_circle]

The array modifier for the example looks like so:

![Array modifier circle properties][img_array_modifier_circle_properties]

A layer may have any number of array modifiers. Here is an example of a rect layer with two array modifiers.

![Array modifier rect][img_2d_array_modifier_rect]

Its array modifiers look like so:

![Array modifier rect properties][img_2d_array_modifier_rect_properties]

And as I said, we can have ANY number of array modifiers. We can keep going:

![Rect with three array modifiers][img_3d_array_modifier_rect]

You get the idea.

But array modifiers can be applied to any layer type, even composition layers. Let's take a look at the composition with shapes again:

![Shape composition][img_composition_nesting]

We can take that composition as a layer into another composition and apply an array modifier to it.

![Shape composition with array modifier][img_shapes_array_modifier]

An of course, we can animate array modifiers.

![Animating an array modifier][img_shapes_array_modifier_animated]

[img_array_modifier_circle]: /files/readme-images/array-modifier-circles.png
[img_array_modifier_circle_properties]: /files/readme-images/array-modifier-circle-properties.png
[img_2d_array_modifier_rect]: /files/readme-images/2d-array-modifier-rect.png
[img_2d_array_modifier_rect_properties]: /files/readme-images/2d-array-modifier-rect-properties.png
[img_3d_array_modifier_rect]: /files/readme-images/3d-array-modifier-rect.png
[img_shapes_array_modifier]: /files/readme-images/shapes-array-modifier.png
[img_shapes_array_modifier_animated]: /files/readme-images/shapes-array-modifier-animated.gif

## Flow Editor

The Flow Editor allows data to flow from one source to another, and allows that data to be transformed along the way.

![Basic example][img_flow_editor_basic]

The Flow Editor allows you to create a graph for each layer. Values can be written to the properties of the layer via the "Property Output" node, and values can be read from other layers within the composition via the "Property Input" node.

![Vector math][img_vector_math]

The "Composition" node can also be used to read the current playback frame alongside the width and height of the composition instance that the layer belongs to.

In fact, there are a lot of nodes. Here's all of them.

![All node types][img_all_nodes]

We can also create a graph for each array modifier. Here's a fun little graph:

![Wave Flow Graph][img_wave_flow_editor]

It produces a really fun and hypnotizing result.

![Wave result][img_wave_result]

[img_flow_editor_basic]: /files/readme-images/flow-editor-basic.png
[img_all_nodes]: /files/readme-images/all-nodes.png
[img_vector_math]: /files/readme-images/vector-math.png
[img_wave_flow_editor]: /files/readme-images/wave-flow-editor.png
[img_wave_result]: /files/readme-images/wave-result.gif

## Layout

The editor's layout system is extremely flexible, allowing you to create any number of areas to work with. You can multiple instances of an area to say, view what you're doing at different levels of zoom.

![Split view][img_split_view]

The area system is heavily based on [how Blender does it][blender_areas].

![Combining view][img_combining_view]

[img_split_view]: /files/readme-images/split-view.png
[img_combining_view]: /files/readme-images/combining-view.png
[blender_areas]: https://docs.blender.org/manual/en/latest/interface/window_system/areas.html
