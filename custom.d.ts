import { ElectronICP } from "~/types";

declare global {
	const electron: ElectronICP;

	export interface Window {
		electron: ElectronICP;
	}
}
