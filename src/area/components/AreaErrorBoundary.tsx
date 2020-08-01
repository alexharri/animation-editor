import React from "react";
import { connect } from "react-redux";
import { cssVariables } from "~/cssVariables";
import { store } from "~/state/store";
import { AreaComponentProps } from "~/types/areaTypes";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	header: css`
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 32px;
		background: ${cssVariables.gray500};
	`,

	container: css`
		position: absolute;
		top: 32px;
		left: 0;
		right: 0;
		bottom: 0;
		border: 1px solid #d23434;
		border-radius: 0 0 8px 8px;
		box-shadow: inset 0 0 12px #921313;
		background: ${cssVariables.dark500};
		padding: 24px;
	`,

	pre: css`
		font-family: ${cssVariables.fontMonospace};
		font-weight: 300;
		color: ${cssVariables.white500};
		margin: 0;
		font-size: 13px;
		line-height: 20px;
	`,
}));

interface OwnProps extends AreaComponentProps<any> {
	component: React.ComponentType<AreaComponentProps<any>>;
}
interface StateProps {
	historyIndex: number;
}
type Props = OwnProps & StateProps;

interface State {
	errorAtHistoryIndex: number;
	error: Error | null;
}

class AreaErrorBoundaryComponent extends React.Component<Props> {
	public readonly state: State = {
		errorAtHistoryIndex: -1,
		error: null,
	};

	static getDerivedStateFromError(error: any): Partial<State> {
		const historyIndex = store.getState().nodeEditor.index;
		return {
			errorAtHistoryIndex: historyIndex,
			error,
		};
	}

	public componentDidUpdate(prevProps: Props, _prevState: State) {
		if (!this.state.error) {
			return;
		}

		const { props } = this;

		const tryAgain =
			props.historyIndex !== prevProps.historyIndex ||
			props.areaId !== prevProps.areaId ||
			props.areaState !== prevProps.areaState;

		if (tryAgain) {
			this.setState({
				error: null,
				errorAtHistoryIndex: -1,
			});
		}
	}

	public render() {
		const { error } = this.state;

		if (error) {
			const content = error?.stack || "Component encountered an error";

			return (
				<>
					<div className={s("header")} />
					<div className={s("container")}>
						<pre className={s("pre")}>{content}</pre>
					</div>
				</>
			);
		}

		const { component: Component, areaId, areaState, left, top, width, height } = this.props;

		return (
			<Component
				areaId={areaId}
				areaState={areaState}
				left={left}
				top={top}
				width={width}
				height={height}
			/>
		);
	}
}

const mapState = (state: ApplicationState): StateProps => ({
	historyIndex: state.nodeEditor.index,
});
export const AreaErrorBoundary = connect(mapState)(AreaErrorBoundaryComponent);
