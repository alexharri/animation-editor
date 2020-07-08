import React, { useEffect } from "react";
import { hot } from "react-hot-loader/root";
import { Provider } from "react-redux";
import { store } from "~/state/store";

import { Toolbar } from "~/toolbar/Toolbar";
import { AreaRoot } from "~/area/components/AreaRoot";
import { ContextMenu } from "~/contextMenu/ContextMenu";
import { addListener, removeListener } from "~/listener/addListener";
import { isKeyCodeOf } from "~/listener/keyboard";
import { CustomContextMenu } from "~/contextMenu/CustomContextMenu";

export const AppComponent: React.FC = () => {
	useEffect(() => {
		const token = addListener.repeated("keydown", { modifierKeys: ["Command"] }, (e) => {
			if (isKeyCodeOf("S", e.keyCode)) {
				e.preventDefault();
				(window as any).saveActionState();
				console.log("Saved!");
			}
		});
		return () => {
			removeListener(token);
		};
	}, []);

	return (
		<>
			<Provider store={store}>
				<ContextMenu />
				<CustomContextMenu />
				<Toolbar />
				<AreaRoot />
			</Provider>
		</>
	);
};

export const App = hot(AppComponent);
