import { contextBridge, ipcRenderer } from "electron";
import { ElectronICP } from "~/types";

let _onUndo: () => void;
let _onRedo: () => void;

contextBridge.exposeInMainWorld("electron", <ElectronICP>{
	onDoubleClickDragArea: () => {
		ipcRenderer.send("double-click-drag-area");
	},
	registerUndo: (fn) => {
		_onUndo = fn;
	},
	registerRedo: (fn) => {
		_onRedo = fn;
	},
});

ipcRenderer.on("undo", () => {
	_onUndo();
});
ipcRenderer.on("redo", () => {
	_onRedo();
});
