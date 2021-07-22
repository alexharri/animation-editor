import { contextBridge, ipcRenderer } from "electron";
import { ElectronGlobal } from "~/types";

let _onUndo: () => void;
let _onRedo: () => void;

contextBridge.exposeInMainWorld("electron", <ElectronGlobal>{
	onDoubleClickDragArea: () => ipcRenderer.send("double-click-drag-area"),
	registerUndo: (fn) => {
		_onUndo = fn;
	},
	registerRedo: (fn) => {
		_onRedo = fn;
	},
});

ipcRenderer.on("undo", () => _onUndo());
ipcRenderer.on("redo", () => _onRedo());
