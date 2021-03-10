import * as PIXI from "pixi.js";
import { LineCap, LineJoin } from "~/types";

export const pixiLineCap = (lineCap: LineCap) => {
	switch (lineCap) {
		case "butt":
			return PIXI.LINE_CAP.BUTT;
		case "round":
			return PIXI.LINE_CAP.ROUND;
		case "square":
			return PIXI.LINE_CAP.SQUARE;
	}
};

export const pixiLineJoin = (lineJoin: LineJoin) => {
	switch (lineJoin) {
		case "bevel":
			return PIXI.LINE_JOIN.BEVEL;
		case "round":
			return PIXI.LINE_JOIN.ROUND;
		case "miter":
			return PIXI.LINE_JOIN.MITER;
	}
};
