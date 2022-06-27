import { Group } from "./group";
import { L } from "./orray";
export declare const enum SelectionTp {
    set = 0,
    add = 1,
    range = 2,
    addRange = 3
}
export declare function pivot(l: L, tag: string): number;
export declare function add<T, A = T>(l: L<T, A>, key: string, value: T | number | string, tp: SelectionTp): L<T, A>;
/**select all elements */
export declare function addAll<T, A = T>(l: L<T, A>, tag: string): L<T, A>;
/** remove focus */
export declare function clear<T, A = T>(l: L<T, A>, tag: string): L<T, A>;
export declare function onchange<T, A = T>(l: L<T, A>, tag: string, listener?: (this: L<T, A>, active: T, selected?: Group<T>) => void): L<T, A>;
/**select type */
export declare const tp: (control: boolean, shift: boolean) => SelectionTp;
export declare function move(l: L, tag: string, distance: number, tp: SelectionTp): L<any, any>;
export declare function movePivot(l: L, tag: string, distance: number, revert?: boolean): L<any, any>;
export declare function list<T, A = T>(l: L<T, A>, key: string): T[];
