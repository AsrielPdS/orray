import { emit, EventObject, EventTargetCallback, on } from "handler";
import type { L } from "./orray";


type Key = string | number;
interface Events<T = any> {
  push: T[];
  remove: T[];
  set: SetEvent<T>;
};
export interface SetEvent<T> {
  add?: T[];
  addId?: number[];
  remove?: T[];
  remvId?: number[];
}
export class Group<T> extends Array<T> implements EventObject<Events<T>> {
  eh: { [P in keyof Events<T>]?: EventTargetCallback<this, Events<T>[P]>[] }={};
  slip?: boolean;
  /**no update */
  nu?: boolean;
  l: L<T, any>;

  push(...items: T[]) {
    let indexes = Array(items.length);
    for (let i = 0; i < items.length; i++) {
      let
        item = items[i],
        index = this.l.indexOf(item);

      if (index != -1 && !this.includes(item)) {
        indexes[i] = index;

        (<any>this.push)(item);
      } else items.splice(i--, 1);
    }


    if (items.length) {
      // this.length += items.length;

      emit(this, 'push', items);
      if (!this.nu)
        emit(this, "set", { add: items, addId: indexes });
    }

    return this.length;
  }
  pushRange(start: number, end: number) {
    return this.push(...this.l.slice(start, end));
  }
  pushAll() {
    return this.push(...this.l.slice());
  }
  remove(...items: T[]): number[] {
    let indexes = Array(items.length);
    for (let i = 0; i < items.length; i++) {
      let item = items[i],
        indexInList = this.l.indexOf(item),
        index = this.indexOf(item);

      if (index != -1) {
        indexes[i] = indexInList;

        for (let i = index; i < this.length - 1; i++)
          this[i] = this[i + 1];

        delete this[this.length - 1];

      } else items.splice(i--, 1);
    }

    this.length -= items.length;

    if (items.length) {
      emit(this, 'remove', items);
      if (!this.nu)
        emit(this, 'set', { remove: items, remvId: indexes });
    }
    return indexes;
  }
  removeAt(index: number, count: number = 0) {
    // for (let i = index; i < this.length - 1; i++)
    //   this[i] = this[i + 1];
    let
      item = this[index],
      items = [item];
    this.splice(index, count);


    // delete this[--this.length];

    emit(this, 'remove', items);
    if (!this.nu)
      emit(this, 'set', { remove: items, remvId: [this.indexOf(item)] });
  }

  clear() {
    return this.remove(...this);
  }
  removeRange(from: number, to?: number) {
    return this.remove(...this.l.slice(from, to));
  }

  set(add: T[]) {
    if (!add.length && !this.length)
      return;
    this.nu = true;
    let
      r = this.slice(),
      remvId = this.clear(),
      addId = this.push(...add);
    this.nu = false;

    emit(this, 'set', {
      remove: r, remvId,
      add, addId
    });
    return this;
  }
  invert() {
    this.set(this.l.filter(i => !this.includes(i)))
    return this;
  }
  setRange(start: number, end: number) {
    this.set(this.l.slice(start, end));
  }
  
  indexes() {
    for (var r: number[] = Array(this.length), i = 0; i < this.length; i++)
      r[i] = this.l.indexOf(this[i]);
  
    return r;
  }
  keyField() {
    for (var key = this.l.key, r: Key[] = [], i = 0; i < this.length; i++)
      r.push(this[i][key]);
    return r;
  }
  /**on update */
  on(callback: EventTargetCallback<Group<T>, SetEvent<T>>) {
    return on(this, "set", callback)
  }
  reload(v: T, i = this.l.indexOf(v)) {
    emit(this, "set", <SetEvent<T>>{ add: [v], addId: [i] });
    return this;
  }
}