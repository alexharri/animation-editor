import React from "react";
import { hot } from "react-hot-loader/root";
import { Provider } from "react-redux";
import { store } from "~/state/store";

import { Toolbar } from "~/toolbar/Toolbar";
import { AreaRoot } from "~/area/components/AreaRoot";
import { ContextMenu } from "~/contextMenu/ContextMenu";

export const AppComponent: React.FC = () => {
	return (
		<>
			<Provider store={store}>
				<ContextMenu />
				<Toolbar />
				<AreaRoot />
			</Provider>
		</>
	);
};

export const App = hot(AppComponent);
