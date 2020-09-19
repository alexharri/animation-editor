export interface ContextMenuBaseProps {
	updateRect: (rect: Rect) => void;
}

export interface OpenCustomContextMenuOptions<
	P extends ContextMenuBaseProps = ContextMenuBaseProps
> {
	component: React.ComponentType<P>;
	props: Omit<P, "updateRect">;
	position: Vec2;
	alignPosition?: "top-left" | "bottom-left" | "center";
	closeMenuBuffer?: number;
	close: () => void;
}
