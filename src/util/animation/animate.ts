import BezierEasing from "bezier-easing";
import { interpolate } from "~/util/math";

interface Options {
	from?: number;
	to?: number | (() => number);
	duration?: number;
	bezier?: [number, number, number, number];
	callback?: any;
}

interface AnimationOpts {
	from: number;
	to: number | (() => number);
	duration: number;
	bezier: [number, number, number, number];
}

const defaultOpts: AnimationOpts = {
	from: 0,
	to: 1,
	duration: 500,
	bezier: [0.46, 0.19, 0.13, 0.98],
};

export function animate(
	options: Options,
	fn: (t: number) => void,
): Promise<boolean> & { cancel: () => void } {
	let cancelled = false;

	const promise = new Promise<boolean>((resolve) => {
		const opts = {
			...defaultOpts,
			...options,
		};

		const [p0, p1, p2, p3] = opts.bezier;
		const easing = BezierEasing(p0, p1, p2, p3);
		const startTime = Date.now();

		let f = opts.from;

		const tick = () => {
			if (cancelled) {
				resolve(true);
				return;
			}

			const actualF = (Date.now() - startTime) / opts.duration;
			f = easing(actualF);

			if (actualF >= 1) {
				f = 1;
			} else {
				requestAnimationFrame(tick);
			}

			const to = typeof opts.to === "number" ? opts.to : opts.to();

			fn(interpolate(opts.from, to, f));

			if (f === 1) {
				resolve(false);
			}
		};

		tick();
	}) as Promise<boolean> & { cancel: () => void };

	promise.cancel = () => {
		cancelled = true;
	};

	return promise;
}
