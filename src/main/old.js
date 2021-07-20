/* eslint-disable @typescript-eslint/no-var-requires */

if (module.hot) {
	module.hot.accept();
}

const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const isDevelopment = process.env.NODE_ENV !== "production";

let mainWindow;

function createWindow() {
	const initPath = path.join(app.getPath("userData"), "init.json");
	let data;
	try {
		data = JSON.parse(fs.readFileSync(initPath, "utf8"));
	} catch (e) {}

	const bounds = data && data.bounds ? data.bounds : { width: 800, height: 600 };

	mainWindow = new BrowserWindow({
		...bounds,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	if (isDevelopment) {
		mainWindow.webContents.openDevTools();
	}

	if (isDevelopment) {
		mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
	} else {
		mainWindow.loadURL(
			formatUrl({
				pathname: path.join(__dirname, "index.html"),
				protocol: "file",
				slashes: true,
			}),
		);
	}

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
