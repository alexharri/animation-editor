/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate"]("main_window",{

/***/ "./src/area/areaRegistry.tsx":
/*!***********************************!*\
  !*** ./src/area/areaRegistry.tsx ***!
  \***********************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("/* module decorator */ module = __webpack_require__.nmd(module);\n\n\nvar _exports$areaComponen, _exports$areaStateRed, _exports$_areaReactKe, _exports$areaKeyboard;\n\n(function () {\n  var enterModule = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.enterModule : undefined;\n  enterModule && enterModule(module);\n})();\n\nfunction _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }\n\nvar __signature__ = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal[\"default\"].signature : function (a) {\n  return a;\n};\n\nvar __importDefault = this && this.__importDefault || function (mod) {\n  return mod && mod.__esModule ? mod : {\n    \"default\": mod\n  };\n};\n\nObject.defineProperty(exports, \"__esModule\", ({\n  value: true\n}));\nexports.areaKeyboardShortcutRegistry = exports._areaReactKeyRegistry = exports.areaStateReducerRegistry = exports.areaComponentRegistry = void 0;\n\nvar constants_1 = __webpack_require__(/*! ~/constants */ \"./src/constants.ts\");\n\nvar FlowEditor_1 = __webpack_require__(/*! ~/flow/FlowEditor */ \"./src/flow/FlowEditor.tsx\");\n\nvar flowEditorKeyboardShortcuts_1 = __webpack_require__(/*! ~/flow/flowEditorKeyboardShortcuts */ \"./src/flow/flowEditorKeyboardShortcuts.ts\");\n\nvar flowAreaReducer_1 = __webpack_require__(/*! ~/flow/state/flowAreaReducer */ \"./src/flow/state/flowAreaReducer.ts\");\n\nvar HistoryEditor_1 = __importDefault(__webpack_require__(/*! ~/historyEditor/HistoryEditor */ \"./src/historyEditor/HistoryEditor.tsx\"));\n\nvar Project_1 = __webpack_require__(/*! ~/project/Project */ \"./src/project/Project.tsx\");\n\nvar Timeline_1 = __webpack_require__(/*! ~/timeline/Timeline */ \"./src/timeline/Timeline.tsx\");\n\nvar timelineAreaReducer_1 = __webpack_require__(/*! ~/timeline/timelineAreaReducer */ \"./src/timeline/timelineAreaReducer.ts\");\n\nvar timelineShortcuts_1 = __webpack_require__(/*! ~/timeline/timelineShortcuts */ \"./src/timeline/timelineShortcuts.ts\");\n\nvar Workspace_1 = __webpack_require__(/*! ~/workspace/Workspace */ \"./src/workspace/Workspace.tsx\"); // import { Workspace } from \"~/workspace/Workspace\";\n\n\nvar workspaceAreaReducer_1 = __webpack_require__(/*! ~/workspace/workspaceAreaReducer */ \"./src/workspace/workspaceAreaReducer.ts\");\n\nvar workspaceShortcuts_1 = __webpack_require__(/*! ~/workspace/workspaceShortcuts */ \"./src/workspace/workspaceShortcuts.ts\");\n\nconsole.log(FlowEditor_1.FlowEditor);\nexports.areaComponentRegistry = (_exports$areaComponen = {}, _defineProperty(_exports$areaComponen, constants_1.AreaType.Timeline, Timeline_1.Timeline), _defineProperty(_exports$areaComponen, constants_1.AreaType.Workspace, Workspace_1.PixiWorkspace), _defineProperty(_exports$areaComponen, constants_1.AreaType.FlowEditor, FlowEditor_1.FlowEditor), _defineProperty(_exports$areaComponen, constants_1.AreaType.History, HistoryEditor_1[\"default\"]), _defineProperty(_exports$areaComponen, constants_1.AreaType.Project, Project_1.Project), _exports$areaComponen);\nexports.areaStateReducerRegistry = (_exports$areaStateRed = {}, _defineProperty(_exports$areaStateRed, constants_1.AreaType.Timeline, timelineAreaReducer_1.timelineAreaReducer), _defineProperty(_exports$areaStateRed, constants_1.AreaType.Workspace, workspaceAreaReducer_1.compositionWorkspaceAreaReducer), _defineProperty(_exports$areaStateRed, constants_1.AreaType.FlowEditor, flowAreaReducer_1.flowAreaReducer), _defineProperty(_exports$areaStateRed, constants_1.AreaType.History, function () {\n  return {};\n}), _defineProperty(_exports$areaStateRed, constants_1.AreaType.Project, function () {\n  return {};\n}), _exports$areaStateRed);\nexports._areaReactKeyRegistry = (_exports$_areaReactKe = {}, _defineProperty(_exports$_areaReactKe, constants_1.AreaType.Timeline, \"compositionId\"), _defineProperty(_exports$_areaReactKe, constants_1.AreaType.Workspace, \"compositionId\"), _defineProperty(_exports$_areaReactKe, constants_1.AreaType.FlowEditor, \"graphId\"), _exports$_areaReactKe);\nexports.areaKeyboardShortcutRegistry = (_exports$areaKeyboard = {}, _defineProperty(_exports$areaKeyboard, constants_1.AreaType.Timeline, timelineShortcuts_1.timelineKeyboardShortcuts), _defineProperty(_exports$areaKeyboard, constants_1.AreaType.FlowEditor, flowEditorKeyboardShortcuts_1.flowEditorKeyboardShortcuts), _defineProperty(_exports$areaKeyboard, constants_1.AreaType.Workspace, workspaceShortcuts_1.workspaceKeyboardShortcuts), _exports$areaKeyboard);\n;\n\n(function () {\n  var reactHotLoader = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.default : undefined;\n\n  if (!reactHotLoader) {\n    return;\n  }\n\n  reactHotLoader.register(__importDefault, \"__importDefault\", \"/Users/alex/web/editor-boiler/src/area/areaRegistry.tsx\");\n  reactHotLoader.register(HistoryEditor_1, \"HistoryEditor_1\", \"/Users/alex/web/editor-boiler/src/area/areaRegistry.tsx\");\n})();\n\n;\n\n(function () {\n  var leaveModule = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.leaveModule : undefined;\n  leaveModule && leaveModule(module);\n})();//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvYXJlYS9hcmVhUmVnaXN0cnkudHN4P2JlODYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0Esb0csQ0FDQTs7O0FBQ0E7O0FBQ0E7O0FBRUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSx1QkFBWjtBQUVhLG9HQUdYLHFCQUFTLFFBSEUsRUFHUyxtQkFIVCwwQ0FJWCxxQkFBUyxTQUpFLEVBSVUseUJBSlYsMENBS1gscUJBQVMsVUFMRSxFQUtXLHVCQUxYLDBDQU1YLHFCQUFTLE9BTkUsRUFNUSwwQkFOUiwwQ0FPWCxxQkFBUyxPQVBFLEVBT1EsaUJBUFI7QUFVQSx1R0FHWCxxQkFBUyxRQUhFLEVBR1MseUNBSFQsMENBSVgscUJBQVMsU0FKRSxFQUlVLHNEQUpWLDBDQUtYLHFCQUFTLFVBTEUsRUFLVyxpQ0FMWCwwQ0FNWCxxQkFBUyxPQU5FLEVBTVE7QUFBQSxTQUFPLEVBQVA7QUFBQSxDQU5SLDBDQU9YLHFCQUFTLE9BUEUsRUFPUTtBQUFBLFNBQU8sRUFBUDtBQUFBLENBUFI7QUFVQSxvR0FLWCxxQkFBUyxRQUxFLEVBS1MsZUFMVCwwQ0FNWCxxQkFBUyxTQU5FLEVBTVUsZUFOViwwQ0FPWCxxQkFBUyxVQVBFLEVBT1csU0FQWDtBQVVBLDJHQUtYLHFCQUFTLFFBTEUsRUFLUyw2Q0FMVCwwQ0FNWCxxQkFBUyxVQU5FLEVBTVcseURBTlgsMENBT1gscUJBQVMsU0FQRSxFQU9VLCtDQVBWOzs7Ozs7Ozs7OzswQkE1Q2IsZSIsImZpbGUiOiIuL3NyYy9hcmVhL2FyZWFSZWdpc3RyeS50c3guanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcmVhVHlwZSB9IGZyb20gXCJ+L2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgRmxvd0VkaXRvciB9IGZyb20gXCJ+L2Zsb3cvRmxvd0VkaXRvclwiO1xuaW1wb3J0IHsgZmxvd0VkaXRvcktleWJvYXJkU2hvcnRjdXRzIH0gZnJvbSBcIn4vZmxvdy9mbG93RWRpdG9yS2V5Ym9hcmRTaG9ydGN1dHNcIjtcbmltcG9ydCB7IGZsb3dBcmVhUmVkdWNlciB9IGZyb20gXCJ+L2Zsb3cvc3RhdGUvZmxvd0FyZWFSZWR1Y2VyXCI7XG5pbXBvcnQgSGlzdG9yeUVkaXRvciBmcm9tIFwifi9oaXN0b3J5RWRpdG9yL0hpc3RvcnlFZGl0b3JcIjtcbmltcG9ydCB7IFByb2plY3QgfSBmcm9tIFwifi9wcm9qZWN0L1Byb2plY3RcIjtcbmltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSBcIn4vdGltZWxpbmUvVGltZWxpbmVcIjtcbmltcG9ydCB7IHRpbWVsaW5lQXJlYVJlZHVjZXIgfSBmcm9tIFwifi90aW1lbGluZS90aW1lbGluZUFyZWFSZWR1Y2VyXCI7XG5pbXBvcnQgeyB0aW1lbGluZUtleWJvYXJkU2hvcnRjdXRzIH0gZnJvbSBcIn4vdGltZWxpbmUvdGltZWxpbmVTaG9ydGN1dHNcIjtcbmltcG9ydCB7IEtleWJvYXJkU2hvcnRjdXQgfSBmcm9tIFwifi90eXBlc1wiO1xuaW1wb3J0IHsgQXJlYUNvbXBvbmVudFByb3BzLCBBcmVhU3RhdGUgfSBmcm9tIFwifi90eXBlcy9hcmVhVHlwZXNcIjtcbmltcG9ydCB7IFBpeGlXb3Jrc3BhY2UgfSBmcm9tIFwifi93b3Jrc3BhY2UvV29ya3NwYWNlXCI7XG4vLyBpbXBvcnQgeyBXb3Jrc3BhY2UgfSBmcm9tIFwifi93b3Jrc3BhY2UvV29ya3NwYWNlXCI7XG5pbXBvcnQgeyBjb21wb3NpdGlvbldvcmtzcGFjZUFyZWFSZWR1Y2VyIH0gZnJvbSBcIn4vd29ya3NwYWNlL3dvcmtzcGFjZUFyZWFSZWR1Y2VyXCI7XG5pbXBvcnQgeyB3b3Jrc3BhY2VLZXlib2FyZFNob3J0Y3V0cyB9IGZyb20gXCJ+L3dvcmtzcGFjZS93b3Jrc3BhY2VTaG9ydGN1dHNcIjtcblxuY29uc29sZS5sb2coRmxvd0VkaXRvcik7XG5cbmV4cG9ydCBjb25zdCBhcmVhQ29tcG9uZW50UmVnaXN0cnk6IHtcblx0W1QgaW4gQXJlYVR5cGVdOiBSZWFjdC5Db21wb25lbnRUeXBlPEFyZWFDb21wb25lbnRQcm9wczxBcmVhU3RhdGU8VD4+Pjtcbn0gPSB7XG5cdFtBcmVhVHlwZS5UaW1lbGluZV06IFRpbWVsaW5lLFxuXHRbQXJlYVR5cGUuV29ya3NwYWNlXTogUGl4aVdvcmtzcGFjZSxcblx0W0FyZWFUeXBlLkZsb3dFZGl0b3JdOiBGbG93RWRpdG9yLFxuXHRbQXJlYVR5cGUuSGlzdG9yeV06IEhpc3RvcnlFZGl0b3IsXG5cdFtBcmVhVHlwZS5Qcm9qZWN0XTogUHJvamVjdCxcbn07XG5cbmV4cG9ydCBjb25zdCBhcmVhU3RhdGVSZWR1Y2VyUmVnaXN0cnk6IHtcblx0W1QgaW4gQXJlYVR5cGVdOiAoc3RhdGU6IEFyZWFTdGF0ZTxUPiwgYWN0aW9uOiBhbnkpID0+IEFyZWFTdGF0ZTxUPjtcbn0gPSB7XG5cdFtBcmVhVHlwZS5UaW1lbGluZV06IHRpbWVsaW5lQXJlYVJlZHVjZXIsXG5cdFtBcmVhVHlwZS5Xb3Jrc3BhY2VdOiBjb21wb3NpdGlvbldvcmtzcGFjZUFyZWFSZWR1Y2VyLFxuXHRbQXJlYVR5cGUuRmxvd0VkaXRvcl06IGZsb3dBcmVhUmVkdWNlcixcblx0W0FyZWFUeXBlLkhpc3RvcnldOiAoKSA9PiAoe30pLFxuXHRbQXJlYVR5cGUuUHJvamVjdF06ICgpID0+ICh7fSksXG59O1xuXG5leHBvcnQgY29uc3QgX2FyZWFSZWFjdEtleVJlZ2lzdHJ5OiBQYXJ0aWFsPFxuXHR7XG5cdFx0W1QgaW4gQXJlYVR5cGVdOiBrZXlvZiBBcmVhU3RhdGU8VD47XG5cdH1cbj4gPSB7XG5cdFtBcmVhVHlwZS5UaW1lbGluZV06IFwiY29tcG9zaXRpb25JZFwiLFxuXHRbQXJlYVR5cGUuV29ya3NwYWNlXTogXCJjb21wb3NpdGlvbklkXCIsXG5cdFtBcmVhVHlwZS5GbG93RWRpdG9yXTogXCJncmFwaElkXCIsXG59O1xuXG5leHBvcnQgY29uc3QgYXJlYUtleWJvYXJkU2hvcnRjdXRSZWdpc3RyeTogUGFydGlhbDxcblx0e1xuXHRcdFtUIGluIEFyZWFUeXBlXTogS2V5Ym9hcmRTaG9ydGN1dFtdO1xuXHR9XG4+ID0ge1xuXHRbQXJlYVR5cGUuVGltZWxpbmVdOiB0aW1lbGluZUtleWJvYXJkU2hvcnRjdXRzLFxuXHRbQXJlYVR5cGUuRmxvd0VkaXRvcl06IGZsb3dFZGl0b3JLZXlib2FyZFNob3J0Y3V0cyxcblx0W0FyZWFUeXBlLldvcmtzcGFjZV06IHdvcmtzcGFjZUtleWJvYXJkU2hvcnRjdXRzLFxufTtcbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/area/areaRegistry.tsx\n");

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ "use strict";
/******/ 
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("5b7779a6521e604ec7f2")
/******/ })();
/******/ 
/******/ }
);