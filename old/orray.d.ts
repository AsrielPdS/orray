import { Group } from "./group";
import { EventObject, EventTargetCallback } from "handler";
interface Dic<T = any> {
    [key: string]: T;
}
declare type Key = string | number;
export declare type ANYElement = HTMLElement | SVGElement;
declare type CalcOptions = {
    vars: Dic;
};
declare type Exp = {
    calc(opts: CalcOptions): any;
};
/**selection of elements */
interface S<T extends ANYElement = HTMLElement> {
    /** clear and insert new content to element*/
    set(child?: any): any;
    /**place content at index */
    place(index: number, child: any): any;
    /**remove child at index */
    unplace(index: number): any;
    /**get child at index */
    child(index: number): S;
}
export interface Tag<T = any> {
    value: T;
    index: number;
    replace: boolean;
}
export interface ListPlaceEvent<T> {
    old: number;
    new: number;
    item: T;
}
export declare type UpdateEvent<T> = {
    tp: "insert";
    items: T[];
    start: number;
} | {
    tp: "remove";
    items: T[];
    start: number;
} | {
    tp: "place";
} | {
    tp: "edit";
} | {
    tp: "set";
    items: T[];
    removed: T[];
} | {
    tp: "tag";
    tag: string;
    newI: number;
    oldI: number;
};
export interface EventMap<T> {
    update: UpdateEvent<T>;
    insert: T[];
    edit: EditEvent<T>[];
    remove: T[];
    place: ListPlaceEvent<T>;
}
export interface ListEditItem<T = Dic> {
    item: Key | T;
    props: Partial<T>;
}
export interface EditEvent<T = Dic> {
    item: T;
    props: Partial<T>;
}
declare type Parse<T, A> = (this: L<T, A>, value: T | A, index: number) => void | T;
export declare type IList<T, A = T> = {
    key?: string;
    child?: string;
    parse?: Parse<T, A>;
    /**@deprecated */
    converter?: Parse<T, A>;
    g?: string[];
    sorts?: Exp[];
    clear?: boolean;
} | Parse<T, A>;
export declare class L<T = any, A = T> extends Array<T> implements EventObject<EventMap<T>> {
    put(start: number, ...values: Array<T | A>): this;
    removeAt(start: number, length?: number): T[];
    push(...values: Array<T | A>): number;
    pop(): T;
    shift(): T;
    unshift(...values: Array<T | A>): number;
    has(id: Key): boolean;
    addGroup(key: string): Group<T>;
    group(key: string): Group<T>;
    onupdate(callback: EventTargetCallback<L<T, A>, UpdateEvent<T>>): L<T, A>;
    /**events handlers*/
    eh: {
        [P in keyof T]?: EventTargetCallback<this, T[P]>[];
    };
    /**when true this List do not raise events */
    slip?: boolean;
    tags?: Dic<Tag<T>>;
    sorts?: Exp[];
    /**groups */
    g: Dic<Group<T>>;
    /**no update */
    nu?: boolean;
    key?: string;
    childKey?: string;
    parse?: Parse<T, A>;
    binds?: [s: S<any>, fn: Function][];
}
export declare type Alias<T = any, A = T> = Array<T | A> | L<T, A>;
export declare const isF: (f: unknown) => f is Function;
export declare function replace<T, A = T>(l: L<T, A>, oldI: T | Key, newI: T | A): void;
export declare function set<T, A = T>(l: L<T, A>): L<T, A>;
/**
 * clear array and insert new elements
 * @param values
 */
export declare function set<T, A = T>(l: L<T, A>, values: Array<T | A>): L<T, A>;
export declare function sort<T, A = T>(l: L<T, A>, compareFn?: (a: T, b: T) => number): L<T, A>;
export declare function remove<T, A = T>(l: L<T, A>, ...items: Array<Key | T>): L<T, A>;
/**
*
* @param item
* @param newIndex
*/
export declare function place<T, A = T>(l: L<T, A>, item: Key | T, newIndex: number): L<T, A>;
/**
 * volta a chamar o bind do elemento
 * @param items
 */
export declare function reload<T, A = T>(l: L<T, A>, item: T | Key): void;
export declare function reloadAll<T, A = T>(l: L<T, A>): void;
export declare function copy<N, T, A = T>(src: L<T, A>, dest: L<N>, fn: (value: T, index: number) => N): L<N>;
export declare function copy<N, T, A = T>(src: L<T, A>, fn: (value: T, index: number) => N): L<N>;
export declare function tryPush<T, A = T>(l: L<T, A>, item: T): void;
/**
 * edit properties of an element of collection
 * @param item
 * @param prop
 * @param value
 */
export declare function edit<T, A = T>(l: L<T, A>, item: ListEditItem<T>): L<T, A>;
export declare function editItems<T, A = T>(l: L<T, A>, ...items: T[]): L<T, A>;
/**
 *
 * @param id
 */
export declare function get<T, A = T>(l: L<T, A>, id: Key): T;
export declare function itemIndex<T, A = T>(l: L<T, A>, arg: Key | T, fromIndex?: number): number;
export declare function map<U, T, A = T>(l: L<T, A>, callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
/**
 * get a group from id if it not exist create new
 */
/**event handlers */
export declare function tag<T, A = T>(l: L<T, A>, name: string): T;
export declare function getTag<T, A = T>(l: L<T, A>, name: string): Tag<T>;
/**remove tag */
export declare function setTag<T, A = T>(l: L<T, A>, key: string): L<T, A>;
export declare function setTag<T, A = T>(l: L<T, A>, key: string, value: T | Key, replace?: boolean): L<T, A>;
export declare function ontag<T, A = T>(l: L<T, A>, key: string, callback: (this: L<T, A>, e: T) => any): L<T, A>;
export declare function unbind<T, A = T>(l: L<T, A>, s: S<any>): L<T, A>;
export declare function bind<T, TS extends S<ANYElement> = S<HTMLElement>, A = T>(l: L<T, A>, s: TS, opts?: LBond<T, A, TS>): TS;
export declare function bind<T, TS extends S<ANYElement> = S<HTMLElement>, A = T>(l: L<T, A>, s: TS, opts?: LBondInsert<T, A, TS>): TS;
export declare function bindGroup<T, TS extends S<ANYElement> = S<HTMLElement>, A = T>(l: L<T, A>, s: TS, groupKey: string, bond: GroupBind<T, TS>): TS;
declare type LBondInsert<T, A, TS extends S<ANYElement>> = (this: L<T, A>, value: T, index?: number, container?: TS) => any;
export interface LBond<T = any, A = T, TS extends S<ANYElement> = any> {
    /**
     * metodo que sera chamado no clear, caso n�ot tenha removera um item de cada vez*/
    clear?: false | ((container: S) => void);
    /**inset an element in arbitrary position
     se retornar um valor inserira este elemento n�o posi��o do item adicionado*/
    insert?: LBondInsert<T, A, TS>;
    /**
     * remove an arbitrary element
     * se retornar true remove o item naquela posi��o
     * se n�o definido remove o item automaticamente
     * @param this
     * @param pos
     */
    remove?: (this: L<T, A>, item: T, index: number, container?: TS) => true | void;
    /**
     *
     * @param this
     * @param value
     * @param props
     * @param container
     */
    edit?: (this: L<T, A>, item: T, index: number, props: Partial<T>, container: S) => S | void;
    /**chamado quando tenta se reposicionar um elemento */
    place?: (this: L<T, A>, oldPlace: number, newPlace: number, container: TS) => boolean | void;
    /**
     *
     * @param this
     * @param empty
     * @param container
     */
    empty?: (this: L<T, A>, empty: boolean, container?: TS) => any;
    /**
     * */
    groups?: Dic<GroupBind<T, TS>> | GroupBind<T, TS>;
    /** */
    tag?: (this: L<T, A>, s: TS, active: boolean, tag: string, value: T, index: number, parent: TS) => void;
}
declare type GroupBind<T, TS extends S<ANYElement>> = (this: L<T>, element: TS, value: boolean, item: T, groupKey: string, index: number, parent: TS) => void;
export declare function extend<T = any, A = T>(l?: L<T, A>, options?: IList<T, A>): L<T, A>;
export default function orray<T = any, A = T>(options: IList<T, A>): L<T, A>;
export default function orray<T = any, A = T>(array?: Array<T | A>, options?: IList<T, A>): L<T, A>;
export {};
