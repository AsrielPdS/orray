import { EventObject, EventTargetCallback } from "handler";
import type { L } from "./orray";
declare type Key = string | number;
interface Events<T = any> {
    push: T[];
    remove: T[];
    set: SetEvent<T>;
}
export interface SetEvent<T> {
    add?: T[];
    addId?: number[];
    remove?: T[];
    remvId?: number[];
}
export declare class Group<T> extends Array<T> implements EventObject<Events<T>> {
    eh: {
        [P in keyof Events<T>]?: EventTargetCallback<this, Events<T>[P]>[];
    };
    slip?: boolean;
    /**no update */
    nu?: boolean;
    l: L<T, any>;
    push(...items: T[]): number;
    pushRange(start: number, end: number): number;
    pushAll(): number;
    remove(...items: T[]): number[];
    removeAt(index: number, count?: number): void;
    clear(): number[];
    removeRange(from: number, to?: number): number[];
    set(add: T[]): this;
    invert(): this;
    setRange(start: number, end: number): void;
    indexes(): number[];
    keyField(): Key[];
    /**on update */
    on(callback: EventTargetCallback<Group<T>, SetEvent<T>>): Group<T>;
    reload(v: T, i?: number): this;
}
export {};
