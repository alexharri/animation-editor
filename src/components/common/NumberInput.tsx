import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import styles from "~/components/common/NumberInput.styles";
import { addListener, removeListener } from "~/listener/addListener";
import { interpolate } from "~/util/math";
import { isKeyDown } from "~/listener/keyboard";

function getDistance(a: Vec2, b: Vec2) {
	return Math.hypot(b.x - a.x, b.y - a.y);
}

const s = compileStylesheetLabelled(styles);

const isMixed = (val: number | number[]) => {
	if (Array.isArray(val)) {
		for (let i = 1; i < val.length; i += 1) {
			if (val[i] !== val[0]) {
				return true;
			}
		}
	}
	return false;
};

const getUnmixedValue = (val: number | number[]): number => {
	return (Array.isArray(val) ? val[0] : val) || 0;
};

interface Props {
	tick?: number;
	pxPerTick?: number;
	value: number | number[];
	onChange: (value: number) => void;
	onChangeEnd?: (type: "relative" | "absolute") => void;
	shiftSnap?: number;
	min?: number;
	max?: number;
	decimalPlaces?: number;
	width?: number;
	dragRelative?: boolean;
}

interface State {
	value: number;
	useState: boolean;
	typing: boolean;
	inputValue: string;
}

export class NumberInput extends React.Component<Props, State> {
	public readonly state = {
		inputValue: "",
		value: isMixed(this.props.value) ? 0 : getUnmixedValue(this.props.value),
		useState: false,
		typing: false,
	};

	private input = React.createRef<HTMLInputElement>();
	private onBlurFn: (() => void) | null = null;
	private unmounted = false;

	constructor(props: Props) {
		super(props);

		this.onMouseDown = this.onMouseDown.bind(this);
	}

	public componentDidUpdate() {
		if (this.state.useState) {
			return;
		}

		const wouldBeValue = isMixed(this.props.value) ? 0 : getUnmixedValue(this.props.value);
		if (wouldBeValue !== this.state.value) {
			this.setState({
				value: wouldBeValue,
			});
		}
	}

	public componentWillUnmount() {
		this.unmounted = true;
	}

	public render() {
		if (this.state.typing) {
			return (
				<div
					className={s("container", { typing: this.state.typing })}
					style={{ width: this.props.width }}
				>
					<input
						className={s("input")}
						ref={this.input}
						value={this.state.inputValue}
						onChange={(e) => {
							this.setState({ inputValue: e.currentTarget.value });
							e.stopPropagation();
						}}
						onBlur={() => {
							if (this.onBlurFn) {
								this.onBlurFn();
							}
						}}
						style={{ width: this.props.width }}
					/>
				</div>
			);
		}
		return (
			<div className={s("container")} style={{ width: this.props.width }}>
				<button className={s("button")} onMouseDown={this.onMouseDown}>
					{isMixed(this.props.value) && !this.state.useState
						? "Mixed"
						: (this.state.useState
								? this.state.value
								: getUnmixedValue(this.props.value)
						  ).toFixed(
								typeof this.props.decimalPlaces === "number"
									? this.props.decimalPlaces
									: 1,
						  )}
				</button>
			</div>
		);
	}

	private onMouseDown(e: React.MouseEvent) {
		const tick = this.props.tick || 1;
		const initialPosition = Vec2.fromEvent(e);
		const initialValue = this.state.useState
			? this.state.value
			: getUnmixedValue(this.props.value);
		this.setState({ useState: true });

		let tokenTriggerMoveChangeValue = "";
		let tokenMoveChangeValue = "";

		tokenTriggerMoveChangeValue = addListener.repeated("mousemove", (e) => {
			const dist = getDistance(initialPosition, Vec2.fromEvent(e));
			if (dist > 5) {
				removeListener(tokenTriggerMoveChangeValue);
				tokenMoveChangeValue = addListener.repeated("mousemove", (e) => {
					let pxMoved = e.clientX - initialPosition.x;

					if (typeof this.props.pxPerTick === "number") {
						pxMoved = Math.round(pxMoved / this.props.pxPerTick);
					}

					let value = initialValue + interpolate(0, pxMoved, tick);

					value = Number(
						value.toFixed(
							typeof this.props.decimalPlaces === "number"
								? this.props.decimalPlaces
								: 1,
						),
					);

					if (isKeyDown("Shift")) {
						const shiftSnap = this.props.shiftSnap;
						if (typeof shiftSnap === "number") {
							value -= value % shiftSnap;
						}
					}

					if (!isNaN(this.props.min!)) {
						value = Math.max(this.props.min!, value);
					}

					if (!isNaN(this.props.max!)) {
						value = Math.min(this.props.max!, value);
					}

					this.props.onChange(this.props.dragRelative ? value - initialValue : value);
					this.setState({ value });
				});
			}
		});

		console.log("adding listener once");
		addListener.once("mouseup", () => {
			console.log("mouseup");
			if (tokenMoveChangeValue) {
				// The mouse was moved enough to trigger the mouse move value change
				removeListener(tokenMoveChangeValue);

				if (this.props.onChange) {
					this.props.onChange(
						this.props.dragRelative
							? this.state.value - initialValue
							: this.state.value,
					);

					if (this.props.onChangeEnd) {
						this.props.onChangeEnd("relative");
					}
				}

				requestAnimationFrame(() => this.setState({ useState: false }));
			} else {
				// Click
				removeListener(tokenTriggerMoveChangeValue);
				this.setState(
					(prevState) => ({ typing: true, inputValue: prevState.value.toString() }),
					() => {
						const input = this.input.current;
						if (input) {
							input.focus();
							input.scrollLeft = 0;
							input.setSelectionRange(0, input.value.length);
						}
					},
				);

				const onDone = () => {
					const value = parseFloat(this.state.inputValue);

					if (this.props.onChange && !isNaN(value) && value !== this.props.value) {
						this.props.onChange(value);

						if (this.props.onChangeEnd) {
							this.props.onChangeEnd("absolute");
						}
					}

					requestAnimationFrame(() => {
						if (!this.unmounted) {
							this.setState({ typing: false, useState: false });
						}
					});
				};

				let mouseDownToken: string;
				let enterToken: string;
				let tabToken: string;

				const removeAndDone = () => {
					this.onBlurFn = null;
					removeListener(mouseDownToken);
					removeListener(enterToken);
					removeListener(tabToken);
					onDone();
				};

				this.onBlurFn = () => removeAndDone();

				mouseDownToken = addListener.repeated("mousedown", (ev) => {
					if (ev.target !== this.input.current) {
						removeAndDone();
					}
				});
				enterToken = addListener.keyboardOnce("Tab", "keydown", () => {
					removeAndDone();
				});
				tabToken = addListener.keyboardOnce("Enter", "keydown", () => {
					removeAndDone();
				});
			}
		});
	}
}
