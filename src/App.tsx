import React from "react";
import { hot } from "react-hot-loader/root";
import { AreaRoot } from "~/area/components/AreaRoot";
import { Provider } from "react-redux";
import { store } from "~/state/store";

export const AppComponent: React.FC = () => {
	return (
		<>
			<Provider store={store}>
				<AreaRoot />
			</Provider>
		</>
	);
};

export const App = hot(AppComponent);
