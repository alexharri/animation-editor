import { RequestActionParams, requestAction } from "~/listener/requestAction";
import { useRef } from "react";

interface Options {
	onChange: (value: number, params: RequestActionParams) => void;
	onChangeEnd: (type: "relative" | "absolute", params: RequestActionParams) => void;
}

export const useNumberInputAction = (options: Options) => {
	const paramsRef = useRef<RequestActionParams | null>(null);
	const onChangeFn = useRef<((value: number) => void) | null>(null);
	const onChangeEndFn = useRef<((type: "relative" | "absolute") => void) | null>(null);

	const onChange = (value: number) => {
		if (onChangeFn.current) {
			onChangeFn.current(value);
			return;
		}

		requestAction({ history: true }, (params) => {
			paramsRef.current = params;

			onChangeFn.current = (value) => options.onChange(value, params);
			onChangeEndFn.current = (type) => options.onChangeEnd(type, params);

			onChangeFn.current(value);
		});
	};

	const onChangeEnd = (type: "relative" | "absolute") => {
		onChangeEndFn.current?.(type);

		paramsRef.current = null;
		onChangeFn.current = null;
		onChangeEndFn.current = null;
	};

	return { onChange, onChangeEnd };
};
