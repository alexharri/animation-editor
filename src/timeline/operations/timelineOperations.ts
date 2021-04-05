import { compositionActions } from "~/composition/compositionReducer";
import { Property, PropertyGroup } from "~/composition/compositionTypes";
import { reduceCompProperties } from "~/composition/compositionUtils";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { isKeyDown } from "~/listener/keyboard";
import { getActionState } from "~/state/stateUtils";
import { timelineActions } from "~/timeline/timelineActions";
import { TimelineKeyframeControlPoint } from "~/timeline/timelineTypes";
import {
	createTimelineForLayerProperty,
	getTimelineValueAtIndex,
	timelineSelectionFromState,
} from "~/timeline/timelineUtils";
import { CompoundPropertyName, Operation, PropertyGroupName, PropertyName } from "~/types";
import { areSetsEqual } from "~/util/setUtils";

const removeTimeline = (op: Operation, timelineId: string): void => {
	op.add(timelineActions.removeTimeline(timelineId));
};

const removeTimelineFromProperty = (op: Operation, propertyId: string) => {
	const { compositionState, timelineState, timelineSelectionState } = op.state;
	const property = compositionState.properties[propertyId] as Property;
	const layer = compositionState.layers[property.layerId];
	const composition = compositionState.compositions[property.compositionId];
	const { timelineId } = property;

	// Delete timeline and make the value of the timeline at the current time
	// the value of the property
	const timeline = timelineState[timelineId];
	const value = getTimelineValueAtIndex({
		timeline,
		frameIndex: composition.frameIndex,
		layerIndex: layer.index,
		selection: timelineSelectionState[timeline.id],
	});

	op.add(
		timelineActions.removeTimeline(property.timelineId),
		compositionActions.setPropertyValue(propertyId, value),
		compositionActions.setPropertyTimelineId(propertyId, ""),
	);
	op.addDiff((diff) => diff.togglePropertyAnimated(propertyId));
};

const removeSelectedKeyframes = (
	op: Operation,
	timelineIds: string[],
	compositionId: string,
): void => {
	const { compositionState, timelineState, timelineSelectionState } = getActionState();

	const timelineToPropertyId = reduceCompProperties<{
		[timelineId: string]: string;
	}>(
		compositionId,
		compositionState,
		(obj, property) => {
			if (property.timelineId) {
				obj[property.timelineId] = property.id;
			}

			return obj;
		},
		{},
	);

	for (const timelineId of timelineIds) {
		const timeline = timelineState[timelineId];
		const selection = timelineSelectionFromState(timelineId, timelineSelectionState);
		const keyframeIds = Object.keys(selection.keyframes);

		let allKeyframesSelected = true;
		for (const k of timeline.keyframes) {
			if (!selection.keyframes[k.id]) {
				allKeyframesSelected = false;
				break;
			}
		}

		if (allKeyframesSelected) {
			// Timeline should be removed
			removeTimelineFromProperty(op, timelineToPropertyId[timelineId]);
			continue;
		}

		op.add(timelineActions.removeKeyframes(timelineId, keyframeIds));
	}
};

const easyEaseSelectedKeyframes = (op: Operation, timelineIds: string[]): void => {
	const { timelineState, timelineSelectionState } = getActionState();

	for (const timelineId of timelineIds) {
		const timeline = timelineState[timelineId];
		const selection = timelineSelectionFromState(timelineId, timelineSelectionState);

		for (let i = 0; i < timeline.keyframes.length; i++) {
			const k = timeline.keyframes[i];

			if (!selection.keyframes[k.id]) {
				continue;
			}

			const t = 0.33;
			const cp = (tx: number): TimelineKeyframeControlPoint => ({
				value: 0,
				relativeToDistance: 1,
				tx,
			});
			op.add(
				timelineActions.setKeyframeControlPoint(timelineId, i, "left", cp(1 - t)),
				timelineActions.setKeyframeControlPoint(timelineId, i, "right", cp(t)),
				timelineActions.setKeyframeReflectControlPoints(timelineId, i, true),
			);
		}
	}
};

const viewTransformProperties = (
	op: Operation,
	compositionId: string,
	propertyNames: Array<PropertyName | CompoundPropertyName>,
): void => {
	const { compositionState, compositionSelectionState } = getActionState();

	const composition = compositionState.compositions[compositionId];
	const selection = compSelectionFromState(compositionId, compositionSelectionState);

	let layerIds = composition.layers.filter((layerId) => selection.layers[layerId]);

	if (layerIds.length === 0) {
		// If none are selected, all are selected
		layerIds = composition.layers;
	}

	const nameSet = new Set(propertyNames);

	const additive = isKeyDown("Shift");

	for (const layerId of layerIds) {
		const layer = compositionState.layers[layerId];
		const transformGroupId = layer.properties.find((propertyId) => {
			const group = compositionState.properties[propertyId];
			return group.name === PropertyGroupName.Transform;
		})!;
		const transformGroup = compositionState.properties[transformGroupId] as PropertyGroup;

		if (additive) {
			const active = layer.viewProperties;
			const toggled: string[] = [];

			for (const propertyId of transformGroup.properties) {
				const property = compositionState.properties[propertyId] as Property;
				if (nameSet.has(property.name)) {
					toggled.push(propertyId);
					op.add(compositionActions.toggleLayerViewProperty(layerId, propertyId));
				}
			}

			if (areSetsEqual(new Set(active), new Set(toggled))) {
				op.add(compositionActions.clearViewProperties(layerId));
				op.add(compositionActions.setLayerCollapsed(layerId, true));
			}
			return;
		}

		const propertyIds: string[] = [];

		for (const propertyId of transformGroup.properties) {
			const property = compositionState.properties[propertyId] as Property;
			if (nameSet.has(property.name)) {
				propertyIds.push(propertyId);
			}
		}

		op.add(compositionActions.clearViewProperties(layerId));

		if (areSetsEqual(new Set(propertyIds), new Set(layer.viewProperties))) {
			op.add(
				compositionActions.setLayerCollapsed(layerId, true),
				compositionActions.setLayerViewProperties(layerId, []),
			);
		} else {
			op.add(compositionActions.setLayerViewProperties(layerId, propertyIds));
		}
	}
};

const viewAnimatedProperties = (op: Operation, compositionId: string): void => {
	const { compositionState, compositionSelectionState } = getActionState();

	const composition = compositionState.compositions[compositionId];
	const selection = compSelectionFromState(compositionId, compositionSelectionState);

	let layerIds = composition.layers.filter((layerId) => selection.layers[layerId]);

	if (layerIds.length === 0) {
		// If none are selected, all are selected
		layerIds = composition.layers;
	}

	const groupToVisibleProperties: { [groupId: string]: string[] } = {};

	for (const layerId of layerIds) {
		const layer = compositionState.layers[layerId];

		function crawl(propertyId: string): { hasVisible: boolean } {
			const group = compositionState.properties[propertyId];

			if (group.type === "property") {
				throw new Error("Should not encounter properties");
			}

			const visibleProperties: string[] = [];

			for (const propertyId of group.properties) {
				const property = compositionState.properties[propertyId];

				if (property.type === "property") {
					if (property.timelineId) {
						visibleProperties.push(propertyId);
					}
					continue;
				}

				const { hasVisible } = crawl(propertyId);

				if (hasVisible) {
					visibleProperties.push(propertyId);
				}
			}

			groupToVisibleProperties[group.id] = visibleProperties;

			return { hasVisible: visibleProperties.length > 0 };
		}

		for (const propertyId of layer.properties) {
			crawl(propertyId);
		}
	}

	const groupIds = Object.keys(compositionState.properties).filter(
		(propertyId) => compositionState.properties[propertyId].type === "group",
	);

	let equal = true;
	for (const groupId of groupIds) {
		const curr = new Set(groupToVisibleProperties[groupId] || []);
		const prev = new Set(
			(compositionState.properties[groupId] as PropertyGroup).viewProperties,
		);

		if (!areSetsEqual(curr, prev)) {
			equal = false;
			break;
		}
	}

	// Reset view properties
	for (const layerId of layerIds) {
		op.add(compositionActions.clearViewProperties(layerId));
	}

	if (!equal) {
		// Open appropriate ones
		const groupIds = Object.keys(groupToVisibleProperties);
		for (const groupId of groupIds) {
			op.add(
				compositionActions.setPropertyGroupViewProperties(
					groupId,
					groupToVisibleProperties[groupId],
				),
			);
		}

		for (const layerId of layerIds) {
			const layer = compositionState.layers[layerId];
			const viewProperties = layer.properties.filter((groupId) => {
				const visible = groupToVisibleProperties[groupId] || [];
				return visible.length > 0;
			});
			op.add(compositionActions.setLayerViewProperties(layerId, viewProperties));
		}
	}
};

const addTimelineToProperty = (op: Operation, propertyId: string) => {
	const { compositionState } = op.state;
	const property = compositionState.properties[propertyId] as Property;
	const composition = compositionState.compositions[property.compositionId];
	const layer = compositionState.layers[property.layerId];

	const timeline = createTimelineForLayerProperty(
		property.value,
		composition.frameIndex - layer.index,
	);
	op.add(
		timelineActions.setTimeline(timeline.id, timeline),
		compositionActions.setPropertyTimelineId(propertyId, timeline.id),
	);
	op.addDiff((diff) => diff.togglePropertyAnimated(propertyId));
};

export const timelineOperations = {
	addTimelineToProperty,
	removeTimelineFromProperty,
	removeTimeline,
	removeSelectedKeyframes,
	easyEaseSelectedKeyframes,
	viewTransformProperties,
	viewAnimatedProperties,
};
