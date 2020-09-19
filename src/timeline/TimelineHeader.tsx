import React from "react";
import { areaActions } from "~/area/state/areaActions";
import { requestAction } from "~/listener/requestAction";
import { timelineAreaActions } from "~/timeline/timelineAreaReducer";
import TimelineHeaderStyles from "~/timeline/TimelineHeader.styles";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(TimelineHeaderStyles);

interface Props {
	areaId: string;
}

export const TimelineHeader: React.FC<Props> = (props) => {
	const onToggleGraphEditor = () => {
		requestAction({ history: false }, (params) => {
			params.dispatch(
				areaActions.dispatchToAreaState(
					props.areaId,
					timelineAreaActions.toggleGraphEditorOpen(),
				),
			);
			params.submitAction();
		});
	};

	return (
		<div className={s("header")}>
			<div className={s("labelWrapper")}>
				<div className={s("label")} style={{ width: 102, paddingLeft: 3 }}>
					Name
				</div>
				<div className={s("label")} style={{ width: 48 }}>
					Graph
				</div>
				<div className={s("label")} style={{ width: 98, paddingLeft: 3 }}>
					Parent
				</div>
			</div>
			<button
				className={s("graphEditorToggle")}
				onMouseDown={(e) => e.stopPropagation()}
				onClick={onToggleGraphEditor}
			>
				Graph Editor
			</button>
		</div>
	);
};
