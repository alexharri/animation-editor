import { app, Menu } from "electron";
import { createElectronWindow } from "~/main/createWindow";

const isOSX = process.platform === "darwin";
const OptionOrAlt = isOSX ? "Option" : "Alt";

const template: Array<Electron.MenuItemConstructorOptions | Electron.MenuItem> = [
	{
		label: "File",
		submenu: [
			{
				label: "New Project",
				accelerator: "CmdOrCtrl+Shift+N",
				click: () => createElectronWindow(),
			},
			{
				label: "Open Project",
				accelerator: "CmdOrCtrl+Shift+O",
			},
			{ type: "separator" },
			{
				label: "Close Window",
				accelerator: "Command+W",
				role: "close",
			},
		],
		role: "fileMenu",
	},
	{
		label: "Edit",
		submenu: [
			{
				label: "Undo",
				accelerator: "CmdOrCtrl+Z",
				click: (_item, win) => win?.webContents.send("undo"),
			},
			{
				label: "Redo",
				accelerator: "CmdOrCtrl+Shift+Z",
				click: (_item, win) => win?.webContents.send("redo"),
			},
		],
		role: "editMenu",
	},
	{
		label: "View",
		submenu: [
			{
				label: "Reload",
				accelerator: "CmdOrCtrl+R",
				role: "reload",
			},
			{
				label: "Force Reload",
				accelerator: "CmdOrCtrl+Shift+R",
				role: "forceReload",
			},
			{
				label: "Toggle Developer Tools",
				accelerator: `${OptionOrAlt}+CmdOrCtrl+J`,
				role: "toggleDevTools",
			},
			{ type: "separator" },
			{
				label: "Toggle Full Screen",
				accelerator: isOSX ? "Ctrl+Cmd+F" : "F11",
				role: "togglefullscreen",
			},
		],
		role: "viewMenu",
	},
	{
		label: "Window",
		submenu: [
			{
				label: "Minimize",
				accelerator: "Cmd+M",
				role: "minimize",
			},
			{
				label: "Zoom",
				role: "zoom",
			},
		],
		role: "windowMenu",
	},
];

if (isOSX) {
	const name = "Animation Editor";
	template.unshift({
		label: name,
		submenu: [
			{
				label: `About ${name}`,
				role: "about",
			},
			{ type: "separator" },
			{
				label: "Services",
				role: "services",
				submenu: [],
			},
			{ type: "separator" },
			{
				label: `Hide ${name}`,
				accelerator: "Command+H",
				role: "hide",
			},
			{
				label: "Hide Others",
				accelerator: "Command+Alt+H",
				role: "hideOthers",
			},
			{
				label: "Show All",
				role: "unhide",
			},
			{ type: "separator" },
			{
				label: `Quit ${name}`,
				accelerator: "Command+Q",
				click: () => app.quit(),
			},
		],
	});
}

export const electronMenu = Menu.buildFromTemplate(template);
