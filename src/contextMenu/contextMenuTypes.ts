export interface ContextMenuBaseProps {
	updateRect: (rect: Rect) => void;
}

export interface OpenCustomContextMenuOptions<
	T extends ContextMenuBaseProps = ContextMenuBaseProps
> {
	component: React.ComponentType<T>;
	props: Omit<T, "updateRect">;
	position: Vec2;
	close: () => void;
}
