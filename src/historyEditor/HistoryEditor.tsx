import React from "react";
import { connect } from "react-redux";
import styles from "~/historyEditor/HistoryEditor.styles";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

const EditIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="469.331"
		height="469.331"
		viewBox="0 0 469.331 469.331"
	>
		<g>
			<path d="M438.931,30.403c-40.4-40.5-106.1-40.5-146.5,0l-268.6,268.5c-2.1,2.1-3.4,4.8-3.8,7.7l-19.9,147.4 c-0.6,4.2,0.9,8.4,3.8,11.3c2.5,2.5,6,4,9.5,4c0.6,0,1.2,0,1.8-0.1l88.8-12c7.4-1,12.6-7.8,11.6-15.2c-1-7.4-7.8-12.6-15.2-11.6 l-71.2,9.6l13.9-102.8l108.2,108.2c2.5,2.5,6,4,9.5,4s7-1.4,9.5-4l268.6-268.5c19.6-19.6,30.4-45.6,30.4-73.3 S458.531,49.903,438.931,30.403z M297.631,63.403l45.1,45.1l-245.1,245.1l-45.1-45.1L297.631,63.403z M160.931,416.803l-44.1-44.1 l245.1-245.1l44.1,44.1L160.931,416.803z M424.831,152.403l-107.9-107.9c13.7-11.3,30.8-17.5,48.8-17.5c20.5,0,39.7,8,54.2,22.4 s22.4,33.7,22.4,54.2C442.331,121.703,436.131,138.703,424.831,152.403z" />
		</g>
	</svg>
);

const UndoIcon = () => (
	<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g clipPath="url(#clip0)">
			<path d="M32 18C32 22.7788 29.9048 27.0683 26.5828 30L23.937 27C26.4284 24.8012 28 21.5842 28 18C28 11.3726 22.6272 5.99996 16 5.99996C12.6862 5.99996 9.68633 7.34331 7.51469 9.51495L12 14L2.60685e-07 14L1.30976e-06 2L4.68659 6.68684C7.58201 3.79124 11.5817 2 16 2C24.8366 1.99994 32 9.16341 32 18Z" />
		</g>
		<defs>
			<clipPath id="clip0">
				<rect width="32" height="32" fill="white" />
			</clipPath>
		</defs>
	</svg>
);

const RedoIcon = () => (
	<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g clipPath="url(#clip0)">
			<path d="M0 18C0 22.7788 2.0952 27.0682 5.41716 30L8.06298 27C5.5716 24.8011 4.00002 21.5842 4.00002 18C4.00002 11.3726 9.37284 5.99999 16 5.99999C19.3138 5.99999 22.3137 7.34332 24.4854 9.51496L20.0001 14H32.0001V2.00003L27.3135 6.68687C24.418 3.79127 20.4184 2.00003 16 2.00003C7.16346 1.99997 0 9.16342 0 18Z" />
		</g>
		<defs>
			<clipPath id="clip0">
				<rect width="32" height="32" fill="white" />
			</clipPath>
		</defs>
	</svg>
);

const ArrowDownRightIcon = () => (
	<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M12.5 21.5H21.6913V26L32 19.4667L21.6913 12.9333V17.4333H13.2181V2H9.20471V18.1667C9.20471 20.56 10.1277 21.5 12.5 21.5Z" />
	</svg>
);

interface State {
	loaded: boolean;
}

class HistoryEditor extends React.Component<ApplicationState, State> {
	public readonly state: State = {
		loaded: false,
	};

	private scrollContainer = React.createRef<HTMLDivElement>();
	private currentEl = React.createRef<HTMLDivElement>();

	public shouldComponentUpdate(prevProps: ApplicationState) {
		if (this.props.flowState.index !== prevProps.flowState.index) {
			return true;
		}

		return false;
	}

	public componentDidMount() {
		this.setState({ loaded: true });
	}

	public componentDidUpdate() {
		const scroll = this.scrollContainer.current;
		const target = this.currentEl.current;

		if (!scroll || !target) {
			return;
		}

		const { top: elTop, height } = scroll.getBoundingClientRect();
		const { top: targetTop } = target.getBoundingClientRect();

		const scrollY = targetTop - elTop + scroll.scrollTop;
		scroll.scrollTop = scrollY - height / 2;
	}

	public render() {
		const { list, index } = this.props.flowState;

		const undo = list.slice(0, index);
		const redo = list.slice(index + 1);

		return (
			<div className={s("container")} ref={this.scrollContainer}>
				<div className={s("stack")}>
					<i className={s("stackIcon", { undo: true })}>
						<UndoIcon />
					</i>
					<ul className={s("list")}>
						{undo.map((item, i) => (
							<li key={i} className={s("item")}>
								{/* <div className={s("savedIndicator", { active: item.saved })} /> */}
								<span className={s("itemIcon")}>
									<EditIcon />
								</span>
								&nbsp;({i + 1})&nbsp;{item.name}
							</li>
						))}
					</ul>
				</div>
				<div className={s("currentItem")} ref={this.currentEl}>
					<span className={s("itemIcon")}>
						<ArrowDownRightIcon />
					</span>
					{/* <div
            className={s("savedIndicator", {
              active: fields.saved && fields.undo[fields.undo.length - 1].state === fields.current,
            })}
          /> */}
					&nbsp;({index + 1})&nbsp;{list[index].name}
				</div>
				<div className={s("stack")}>
					<i className={s("stackIcon", { redo: true })}>
						<RedoIcon />
					</i>
					<ul className={s("list")}>
						{redo.map((item, i) => (
							<li key={i} className={s("item", { redo: true })}>
								{/* <div className={s("savedIndicator", { active: item.saved })} /> */}
								<span className={s("itemIcon", { redo: true })}>
									<EditIcon />
								</span>{" "}
								{item.name}
							</li>
						))}
					</ul>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state: ApplicationState) => state;

export default connect(mapStateToProps)(HistoryEditor);
