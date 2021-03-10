import { computeValueByPropertyIdForComposition } from "~/composition/property/propertyRawValues";

let n = 0;
const getId = () => (++n).toString();

type ListenerFn = (computedValue: any, rawValue: any) => void;

export class PropertyStore {
	private rawValues: Record<string, any> = {};
	private computedValues: Partial<Record<string, any>> = {};
	private listenersByPropertyId: Partial<
		Record<string, Array<{ id: string; fn: ListenerFn }>>
	> = {};

	public getPropertyValue(propertyId: string): any {
		return this.computedValues[propertyId] ?? this.rawValues[propertyId];
	}
	public getComputedPropertyValue(propertyId: string): any {
		return this.computedValues[propertyId];
	}
	public getRawPropertyValue(propertyId: string): any {
		return this.rawValues[propertyId];
	}
	public setComputedPropertyValue(propertyId: string, computedPropertyValue: any) {
		this.computedValues[propertyId] = computedPropertyValue;
		this.executeListeners(propertyId);
	}
	public setRawPropertyValue(propertyId: string, rawPropertyValue: any) {
		this.rawValues[propertyId] = rawPropertyValue;
		this.executeListeners(propertyId);
	}
	public reset(actionState: ActionState, compositionId: string) {
		this.rawValues = computeValueByPropertyIdForComposition(actionState, compositionId);
		this.computedValues = {};
	}
	public addListener(propertyId: string, fn: ListenerFn) {
		if (!this.listenersByPropertyId[propertyId]) {
			this.listenersByPropertyId[propertyId] = [];
		}
		const id = getId();
		this.listenersByPropertyId[propertyId]!.push({ id, fn });
		return id;
	}
	public removeListener(propertyId: string, id: string) {
		const warnDoesNotExist = () =>
			console.warn(`Attempted to remove a listener that does not exist. Id '${id}'`);

		const listeners = this.listenersByPropertyId[propertyId];

		if (!listeners) {
			warnDoesNotExist();
			return;
		}

		const index = listeners.findIndex((item) => item.id === id);
		if (index === -1) {
			warnDoesNotExist();
			return;
		}

		listeners.splice(index, 1);
		if (listeners.length === 0) {
			delete this.listenersByPropertyId[propertyId];
		}
	}

	private executeListeners(propertyId: string) {
		const listeners = this.listenersByPropertyId[propertyId] || [];

		for (const { fn } of listeners) {
			fn(this.getPropertyValue(propertyId), this.getRawPropertyValue(propertyId));
		}
	}
}
