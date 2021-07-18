/* eslint-disable @typescript-eslint/no-var-requires */

import { app, BrowserWindow } from "electron";
import fs from "fs";
import path from "path";

let mainWindow: BrowserWindow;

function createWindow() {
	const initPath = path.join(app.getPath("userData"), "init.json");
	let data;
	try {
		data = JSON.parse(fs.readFileSync(initPath, "utf8"));
	} catch (e) {}

	mainWindow = new BrowserWindow(data && data.bounds ? data.bounds : { width: 800, height: 600 });

	mainWindow.loadFile("src/index.html");

	mainWindow.on("close", () => {
		const data = { bounds: mainWindow.getBounds() };
		fs.writeFileSync(initPath, JSON.stringify(data));
	});
}

app.whenReady().then(() => {
	createWindow();

	app.on("window-all-closed", () => {
		if (process.platform !== "darwin") {
			app.quit();
		}
	});

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});
