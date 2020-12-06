import { HSLColor, RGBAColor, RGBColor } from "~/types";

export const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export const hexToRGB = (hex: string): RGBColor => {
	const [, r, g, b] = hexRegex.exec(hex)!;
	return [r, g, b].map((c) => parseInt(c, 16)) as RGBColor;
};
export const hexToBinary = (hex: string): number => {
	if (hex.substr(0, 1) === "#") {
		hex = hex.substr(1);
	}
	return parseInt(hex, 16);
};

export const rgbToBinary = (rgb: RGBColor): number => {
	const [r, g, b] = rgb;
	let n = r * 256;
	n += g;
	n *= 256;
	n += b;
	return n;
};

export const hexToRGBA = (hex: string): RGBAColor => {
	const [r, g, b] = hexToRGB(hex);
	return [r, g, b, 1];
};

export const hexToRGBAString = (hex: string, alpha = 1): string =>
	`rgba(${hexToRGB(hex).join(",")},${alpha})`;

export const rgbToString = (rgb: RGBColor, alpha = 1): string => `rgba(${rgb.join(",")},${alpha})`;
export const rgbaToString = (rgba: RGBAColor): string => `rgba(${rgba.join(",")})`;

export const rgbToHSL = (rgbColor: RGBColor): HSLColor => {
	let [r, g, b] = rgbColor;

	// 0-1
	r /= 255;
	g /= 255;
	b /= 255;

	const cmin = Math.min(r, g, b);
	const cmax = Math.max(r, g, b);

	const delta = cmax - cmin;

	let h = 0;
	let l = (cmax + cmin) / 2;
	let s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

	// Calculate hue
	if (delta === 0) {
		h = 0;
	} else if (cmax === r) {
		h = ((g - b) / delta) % 6;
	} else if (cmax === g) {
		h = (b - r) / delta + 2;
	} else {
		h = (r - g) / delta + 4;
	}

	h = Math.round(h * 60);

	if (h < 0) {
		h += 360;
	}

	s = Number((s * 100).toFixed(1));
	l = Number((l * 100).toFixed(1));

	return [h, s, l];
};

export const hslToRGB = ([h, s, l]: HSLColor): RGBColor => {
	// 0-1
	s /= 100;
	l /= 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0;
	let g = 0;
	let b = 0;

	if (h >= 0 && h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (h >= 60 && h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (h >= 120 && h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (h >= 180 && h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (h >= 240 && h < 300) {
		r = x;
		g = 0;
		b = c;
	} else if (h >= 300 && h < 360) {
		r = c;
		g = 0;
		b = x;
	}

	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return [r, g, b];
};
