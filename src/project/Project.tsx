import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { ProjectComp } from "~/project/composition/ProjectComp";
import { createProjectContextMenu } from "~/project/projectContextMenu";
import { separateLeftRightMouse } from "~/util/mouse";
import ProjectStyles from "~/project/Project.styles";

const s = compileStylesheetLabelled(ProjectStyles);

interface OwnProps {}
interface StateProps {
	compositionIds: string[];
}
type Props = OwnProps & StateProps;

const ProjectComponent: React.FC<Props> = (props) => {
	const onRightClick = (e: React.MouseEvent) => {
		createProjectContextMenu(Vec2.fromEvent(e), {});
	};

	return (
		<div
			className={s("container")}
			onMouseDown={separateLeftRightMouse({ right: onRightClick })}
		>
			<div className={s("compWrapper")}>
				{props.compositionIds.map((compositionId) => (
					<ProjectComp key={compositionId} compositionId={compositionId} />
				))}
			</div>
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({ project }) => ({
	compositionIds: project.compositions,
});

export const Project = connectActionState(mapState)(ProjectComponent);
