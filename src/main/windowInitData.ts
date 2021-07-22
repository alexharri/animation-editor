import { app, BrowserWindow } from "electron";
import fs from "fs";
import path from "path";

const getInitDataPath = () => path.join(app.getPath("userData"), "init.json");

interface InitData {
	bounds: Electron.Rectangle;
}

export const getWindowInitData = (): InitData | null => {
	let initData: InitData | null = null;
	try {
		initData = JSON.parse(fs.readFileSync(getInitDataPath(), "utf8"));
	} catch (e) {}
	return initData;
};

export const saveWindowInitData = (win: BrowserWindow) => {
	const initData: InitData = {
		bounds: win.getBounds(),
	};
	fs.writeFileSync(getInitDataPath(), JSON.stringify(initData));
};
