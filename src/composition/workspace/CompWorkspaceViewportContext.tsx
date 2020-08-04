import React from "react";

export const CompWorkspaceViewportContext = React.createContext<{ scale: number; viewport: Rect }>({
	scale: 1,
	viewport: { top: 0, left: 0, width: 0, height: 0 },
});
