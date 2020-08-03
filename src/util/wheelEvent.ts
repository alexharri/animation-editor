/**
 * Based on https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
 */

import { isSafari } from "~/util/browserDetection";

const PIXEL_STEP = 10;
const LINE_HEIGHT = 40;
const PAGE_HEIGHT = 800;

type ParsedWheelEvent =
	| {
			type: "pinch_zoom";
			delta: number;
	  }
	| {
			type: "mouse_wheel";
			deltaX: number;
			deltaY: number;
	  }
	| {
			type: "pan";
			deltaX: number;
			deltaY: number;
	  };

export function parseWheelEvent(e: WheelEvent): ParsedWheelEvent {
	let isMouse = false;
	let sX = 0;
	let sY = 0;
	let deltaX = 0;
	let deltaY = 0;

	if (!isSafari) {
		// No wheel deltas exist
		const { wheelDelta, wheelDeltaY, wheelDeltaX } = e as any;
		if (typeof wheelDelta === "number") {
			isMouse = isMouse || !!(wheelDelta && wheelDelta % 120 === 0);
			sY = -wheelDelta / 120;
		}
		if (typeof wheelDeltaY === "number") {
			isMouse = isMouse || !!(wheelDeltaY && wheelDeltaY % 120 === 0);
			sY = -wheelDeltaY / 120;
		}
		if (typeof wheelDeltaX === "number") {
			isMouse = isMouse || !!(wheelDeltaX && wheelDeltaX % 120 === 0);
			sX = -wheelDeltaX / 120;
		}
	}

	// side scrolling on FF with DOMMouseScroll
	if ("axis" in (e as any) && (e as any).axis === (e as any).HORIZONTAL_AXIS) {
		sX = sY;
		sY = 0;
	}

	deltaX = sX * PIXEL_STEP;
	deltaY = sY * PIXEL_STEP;

	if ("deltaY" in e) {
		deltaY = e.deltaY;
	}
	if ("deltaX" in e) {
		deltaX = e.deltaX;
	}

	if ((deltaX || deltaY) && e.deltaMode) {
		if (e.deltaMode == 1) {
			isMouse = true;
			// delta in LINE units
			deltaX *= LINE_HEIGHT;
			deltaY *= LINE_HEIGHT;
		} else {
			isMouse = true;
			// delta in PAGE units
			deltaX *= PAGE_HEIGHT;
			deltaY *= PAGE_HEIGHT;
		}
	}

	// Fall-back if spin cannot be determined
	if (deltaX && !sX) {
		sX = deltaX < 1 ? -1 : 1;
	}
	if (deltaY && !sY) {
		sY = deltaY < 1 ? -1 : 1;
	}

	if (e.ctrlKey) {
		return {
			type: "pinch_zoom",
			delta: deltaY,
		};
	}

	if (isMouse) {
		return {
			type: "mouse_wheel",
			deltaX,
			deltaY,
		};
	}

	return {
		type: "pan",
		deltaX,
		deltaY,
	};
}
