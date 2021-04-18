import React from "react";

interface Props {
	error: Error;
}

export const FlowNodeError: React.FC<Props> = (props) => {
	const { error } = props;

	let message = error.message;

	return <>{message}</>;
};
