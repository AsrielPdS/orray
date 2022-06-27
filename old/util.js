"use strict";
// const proto = Array.prototype;
// /**
//  * Determines whether all the members of an array satisfy the specified test.
//  * @param predicate A function that accepts up to three arguments. The every method calls
//  * the predicate function for each element in the array until the predicate returns a value
//  * which is coercible to the Boolean value false, or until the end of the array.
//  * @param thisArg An object to which the this keyword can refer in the predicate function.
//  * If thisArg is omitted, undefined is used as the this value.
//  */
//  export function all<T,S extends T>(arr: ArrayLike<T>, predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): arr is S[];
//  /**
//   * Determines whether all the members of an array satisfy the specified test.
//   * @param predicate A function that accepts up to three arguments. The every method calls
//   * the predicate function for each element in the array until the predicate returns a value
//   * which is coercible to the Boolean value false, or until the end of the array.
//   * @param thisArg An object to which the this keyword can refer in the predicate function.
//   * If thisArg is omitted, undefined is used as the this value.
//   */
//   export function all<T>(arr: ArrayLike<T>, predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean;
// export function all<T>(arr: ArrayLike<T>, predicate: any, thisArg?: any) {
//   return proto.every.call(arr, predicate, thisArg);
// }
// export function indexOf<T>(arr: ArrayLike<T>, searchElement: T, fromIndex?: number): int {
//   return proto.indexOf.call(arr, searchElement, fromIndex);
// }
// export function includes<T>(arr: ArrayLike<T>, searchElement: T, fromIndex?: number): bool {
//   return proto.includes.call(arr, searchElement, fromIndex);
// }
// export function slice<T>(arr: ArrayLike<T>, start?: number, end?: number): T[] {
//   return proto.slice.call(arr, start, end);
// }
// export function find<T, S extends T>(arr: ArrayLike<T>, predicate: (this: void, value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined;
// export function find<T>(arr: ArrayLike<T>, predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined;
// export function find<T>(arr: ArrayLike<T>, predicate: any, thisArg?: any) {
//   return proto.find.call(arr, predicate, thisArg);
// }
// export function findIndex<T>(arr: ArrayLike<T>, predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): int {
//   return proto.findIndex.call(arr, predicate, thisArg);
// }
// /**
//      * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
//      * @param start The zero-based location in the array from which to start removing elements.
//      * @param deleteCount The number of elements to remove.
//      * @returns An array containing the elements that were deleted.
//      */
// export function splice<T>(arr: ArrayLike<T>, start: number, deleteCount?: number): T[];
// /**
//  * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
//  * @param start The zero-based location in the array from which to start removing elements.
//  * @param deleteCount The number of elements to remove.
//  * @param items Elements to insert into the array in place of the deleted elements.
//  * @returns An array containing the elements that were deleted.
//  */
// export function splice<T>(arr: ArrayLike<T>, start: number, deleteCount: number, ...items: T[]): T[];
// export function splice<T>(arr: ArrayLike<T>, start: number, deleteCount: number, ...items: T[]) {
//   return proto.splice.call(arr, start, deleteCount, ...items);
// }
// /**
//  * Returns the elements of an array that meet the condition specified in a callback function.
//  * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
//  * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
//  */
// export function filter<T, S extends T>(arr: ArrayLike<T>, predicate: (value: T, index: number, array: ArrayLike<T>) => value is S, thisArg?: any): S[];
// /**
//  * Returns the elements of an array that meet the condition specified in a callback function.
//  * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
//  * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
//  */
// export function filter<T>(arr: ArrayLike<T>, predicate: (value: T, index: number, array: ArrayLike<T>) => unknown, thisArg?: any): T[];
// export function filter<T>(arr: ArrayLike<T>, predicate: any, thisArg?: any) {
//   return proto.filter.call(arr, predicate, thisArg);
// }
