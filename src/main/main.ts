import { app, BrowserWindow, ipcMain, Menu, session, systemPreferences } from "electron";
import { createElectronWindow } from "~/main/createWindow";
import { electronMenu } from "~/main/menu";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	app.quit();
}

// When the draggable area is double clicked, trigger a window maximize/minimize
ipcMain.on("double-click-drag-area", () => {
	const win = BrowserWindow.getFocusedWindow()!;
	switch (systemPreferences.getUserDefault("AppleActionOnDoubleClick", "string")) {
		case "Minimize":
			win.minimize();
			break;
		case "Maximize":
			win.isMaximized() ? win.unmaximize() : win.maximize();
			break;
	}
});

app.on("ready", () => {
	Menu.setApplicationMenu(electronMenu);

	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				// DevTools don't work when unsafe-eval is present. Commenting this out until I figure out
				// how to add a CSP without breaking DevTools or something else.
				//
				// "Content-Security-Policy": [
				// 	"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self';",
				// ],

				// See https://developer.chrome.com/blog/enabling-shared-array-buffer/
				"Cross-Origin-Embedder-Policy": "require-corp",
				"Cross-Origin-Opener-Policy": "same-origin",
			},
		});
	});

	createElectronWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createElectronWindow();
	}
});
