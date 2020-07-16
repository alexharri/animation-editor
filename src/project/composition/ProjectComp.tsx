import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import ProjectCompStyles from "~/project/composition/ProjectComp.styles";
import { ProjectCompLayerName } from "~/project/composition/ProjectCompName";
import { separateLeftRightMouse } from "~/util/mouse";
import { dragProjectCompTimeToArea } from "~/project/composition/handlers/dragProjectCompTimeToArea";
import { OpenInAreaIcon } from "~/components/icons/OpenInAreaIcon";
import { dragProjectComp } from "~/project/composition/handlers/dragProjectComp";
import { dragProjectCompWorkspaceToArea } from "~/project/composition/handlers/dragProjectCompWorkspaceToArea";

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
		<div className={s("container")} onMouseDown={separateLeftRightMouse({ left: onMouseDown })}>
			<ProjectCompLayerName compositionId={compositionId} key={compositionId} />
			<div
				title="Open Timeline in area"
				className={s("openGraphInArea", { active: true })}
				onMouseDown={separateLeftRightMouse({
					left: (e) => dragProjectCompTimeToArea(e, { compositionId }),
				})}
			>
				<OpenInAreaIcon />
			</div>
			<div
				title="Open Workspace in area"
				className={s("openGraphInArea", { active: true })}
				onMouseDown={separateLeftRightMouse({
					left: (e) => dragProjectCompWorkspaceToArea(e, { compositionId }),
				})}
			>
				<OpenInAreaIcon />
			</div>
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({}) => ({});

export const ProjectComp = connectActionState(mapState)(ProjectCompComponent);
