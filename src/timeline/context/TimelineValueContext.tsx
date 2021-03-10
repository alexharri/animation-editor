import React, { useEffect, useMemo, useRef } from "react";
import { createPropertyManager } from "~/composition/manager/property/propertyManager";
import { propertyManagerDiffHandler } from "~/composition/manager/property/propertyManagerDiffHandler";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { subscribeToDiffs, unsubscribeToDiffs } from "~/listener/diffListener";
import { getActionState } from "~/state/stateUtils";

export const TimelinePropertyStoreContext = React.createContext<PropertyStore>({} as any);

interface Props {
	compositionId: string;
}

export const TimelinePropertyStoreProvider: React.FC<Props> = (props) => {
	const { compositionId } = props;

	const propertyManager = useMemo(() => {
		const actionState = getActionState();

		return createPropertyManager(compositionId, actionState);
	}, []);

	const prevStateRef = useRef<ActionState>(null!);
	if (!prevStateRef.current) {
		prevStateRef.current = getActionState();
	}

	useEffect(() => {
		const id = subscribeToDiffs((diffs, direction) => {
			const actionState = getActionState();
			propertyManagerDiffHandler(
				compositionId,
				propertyManager,
				actionState,
				diffs,
				direction,
				prevStateRef.current,
			);
			prevStateRef.current = actionState;
		});
		return () => unsubscribeToDiffs(id);
	}, []);

	return (
		<TimelinePropertyStoreContext.Provider value={propertyManager.store}>
			{props.children}
		</TimelinePropertyStoreContext.Provider>
	);
};
