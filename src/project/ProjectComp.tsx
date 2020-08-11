import React from "react";
import { OpenInAreaIcon } from "~/components/icons/OpenInAreaIcon";
import { dragProjectComp } from "~/project/composition/handlers/dragProjectComp";
import { dragProjectTimelineToArea } from "~/project/composition/handlers/dragProjectTimelineToArea";
import { dragProjectWorkspaceToArea } from "~/project/composition/handlers/dragProjectWorkspaceToArea";
import ProjectCompStyles from "~/project/ProjectComp.styles";
import { ProjectCompLayerName } from "~/project/ProjectCompName";
import { createProjectContextMenu } from "~/project/projectContextMenu";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(ProjectCompStyles);

interface OwnProps {
	compositionId: string;
}
interface StateProps {}
type Props = OwnProps & StateProps;

const ProjectCompComponent: React.FC<Props> = (props) => {
	const { compositionId } = props;

	const onMouseDown = (e: React.MouseEvent) => {
		dragProjectComp(e, compositionId);
	};

	return (
		<div
			className={s("container")}
			onMouseDown={separateLeftRightMouse({
				left: onMouseDown,
				right: (e) => createProjectContextMenu(Vec2.fromEvent(e), { compositionId }),
			})}
		>
			<ProjectCompLayerName compositionId={compositionId} key={compositionId} />
			<div
				title="Open Workspace in area"
				className={s("openInArea", { active: true })}
				onMouseDown={separateLeftRightMouse({
					left: (e) => dragProjectWorkspaceToArea(e, { compositionId }),
				})}
			>
				<OpenInAreaIcon />
			</div>
			<div
				title="Open Timeline in area"
				className={s("openInArea", { active: true })}
				onMouseDown={separateLeftRightMouse({
					left: (e) => dragProjectTimelineToArea(e, { compositionId }),
				})}
			>
				<OpenInAreaIcon />
			</div>
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({}) => ({});

export const ProjectComp = connectActionState(mapState)(ProjectCompComponent);
