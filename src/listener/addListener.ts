import {
	addListenerExecuteOnce,
	addListenerExecutedRepeated,
	removeListenerExecuted,
	addKeyboardListenerExecuteOnce,
	addKeydownListenerLongPress,
} from "~/listener/registerListener";

export const addListener = {
	once: addListenerExecuteOnce,
	repeated: addListenerExecutedRepeated,
	keyboardOnce: addKeyboardListenerExecuteOnce,
	keydownLong: addKeydownListenerLongPress,
};

export const removeListener = removeListenerExecuted;
