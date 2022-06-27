import { Group } from "./group";
import { emit, EventObject, EventTargetCallback, on } from "handler";

interface Dic<T = any> { [key: string]: T; }
type Key = string | number;
export type ANYElement = HTMLElement | SVGElement;

type CalcOptions = { vars: Dic };
type Exp = { calc(opts: CalcOptions): any };
/**selection of elements */
interface S<T extends ANYElement = HTMLElement> {
  /** clear and insert new content to element*/
  set(child?);
  /**place content at index */
  place(index: number, child);
  /**remove child at index */
  unplace(index: number);
  /**get child at index */
  child(index: number): S;

}
//adicionar tipo especifico para listas de s� um item;
export interface Tag<T = any> {
  value: T,
  index: number,
  replace: boolean;
}

// export interface ET<T extends Dic = Dic> {
//   on<K extends keyof T>(event: K, callback: EventTargetCallback<this, T[K]>);

//   off<K extends keyof T>(event: K, callback?: EventTargetCallback<this, T[K]>);

//   emit<K extends keyof T>(event: K, data?: T[K]): boolean | -1;
// }
export interface ListPlaceEvent<T> {
  old: number,
  new: number,
  item: T;
}
export type UpdateEvent<T> = {
  tp: "insert";
  items: T[];
  start: number
} | {
  tp: "remove";
  items: T[];
  start: number
} | {
  tp: "place",
} | {
  tp: "edit",
} | {
  tp: "set";
  items: T[];
  removed: T[]
} | {
  tp: "tag",
  tag: string;
  newI: number;
  oldI: number;
}
//<T> {
//  tp: 'insert' | 'remove' | 'place' | 'edit' | 'set',
//  items: T[];
//  removed?: T[];
//  start?: number;
//}
export interface EventMap<T> {
  update: UpdateEvent<T>;
  insert: T[];
  edit: EditEvent<T>[];
  remove: T[];
  place: ListPlaceEvent<T>;
}

//export const on = 'on';

export interface ListEditItem<T = Dic> { item: Key | T, props: Partial<T>; }
export interface EditEvent<T = Dic> { item: T, props: Partial<T>; }

type Parse<T, A> = (this: L<T, A>, value: T | A, index: number/*, length: number*/) => void | T;
export type IList<T, A = T> = {
  key?: string;
  child?: string;
  parse?: Parse<T, A>;
  /**@deprecated */
  converter?: Parse<T, A>;
  g?: string[];
  sorts?: Exp[];
  clear?: boolean;
} | Parse<T, A>;
// export interface Alias<T, A = T> extends Array<T | A> {
//   edit?(...item: Array<ListEditItem<T>>);
//   put?(place: number, ...values: Array<T | A>);
//   remove?(...item: Array<Key | T>): boolean;
//   removeAt?(start: number, length?: number);
//   place?(item: Key | T, newPos: number);
//   set?(values?: Array<T | A>);
//   get?: (id: Key) => T;
//   has?: (id: Key) => boolean;
//   groups?: Dic<Group<T>>;

//   replace?(oldValue: Key | T, newValue: T);

//   nest?: Exp;

//   setTag?(name: string, value?: T | Key, replace?: boolean): L<T, A>;
//   getTag?(name: string): Tag<T>;

//   itemIndex?(arg: Key | T, fromIndex?: number): number;

//   emit?<K extends keyof EventMap<T>>(event: K, data?: EventMap<T>[K]): boolean | -1;
//   on?<K extends keyof EventMap<T>>(event: K, callback: EventTargetCallback<this, EventMap<T>[K]>): L<T, A>;

//   unbind?(s: S): L<T, A>;
//   bind?<TS extends S<ANYElement> = S<HTMLElement>>(s: TS, opts?: LBond<T, A, TS>): TS;
// }
export class L<T = any, A = T> extends Array<T> implements EventObject<EventMap<T>> {

  put(start: number, ...values: Array<T | A>) {

    if (this.parse)
      for (let i = 0; i < values.length; i++) {
        let t = this.parse(values[i], i + start);
        if (t === undefined)
          values.splice(i--, 1);
        else values[i] = <T>t;
      }

    if (!values.length) return;
    let
      length = values.length,
      oldLength = this.length;

    this.length += length;

    //impurra todos items afrente do start para frente
    for (let c = oldLength - 1; c >= start; c--)
      this[c + length] = this[c];

    for (let c = 0; c < length; c++) {
      this[start + c] = <T>values[c];
    }

    if (this.tags) {
      for (let key in this.tags) {
        let tag = this.tags[key];
        if (tag.index >= start)
          tag.index += length;
      }
    }

    emit(this, 'insert', <T[]>values);
    if (!this.nu)
      emit(this, 'update', {
        tp: 'insert',
        start: start,
        items: <T[]>values
      });

    return this;
  }

  removeAt(start: number, length = 1) {
    if (length + start > this.length)
      length = this.length - start;

    if (length <= 0) return;
    var removed: T[] = Array(length);

    for (let c = 0; c < length; c++)
      removed[c] = this[start + c];

    for (let c = start + length; c < this.length; c++)
      this[c - length] = this[c];

    this.length -= length;

    for (let key in this.g)

      this.g[key].remove(...Array.from(removed));


    if (this.tags)
      for (let key in this.tags) {
        let tag = this.tags[key];
        if (tag.index >= (start + length))
          tag.index -= length;
        else if (tag.index >= start) {
          //o que estava antes
          //if (tag.replace) {
          //  this._tags[key] = null;
          //  setTag(this,key, this[Math.min(tag.index, this.length - 1)], true);
          //} else delete this._tags[key];

          setTag(this, key,
            tag.replace ?
              this[Math.min(tag.index, this.length - 1)] :
              null, tag.replace);
        }
      }

    emit(this, 'remove', removed);

    if (!this.nu)
      emit(this, 'update', { tp: 'remove', start, items: removed });

    return removed;

  }
  push(...values: Array<T | A>) {
    this.put(this.length, ...values);
    return this.length;
  }
  pop() {
    if (this.length)
      return this.removeAt(this.length - 1)[0];
  }
  shift() {
    return this.removeAt(0)[0];
  }
  unshift(...values: Array<T | A>) {
    this.put(0, ...values);
    return this.length;
  }
  has(id: Key) {
    for (let i = 0; i < this.length; i++) {
      if (this[i][this.key] === id)
        return true;
    }

    return false;
  }
  addGroup(key: string) {
    // t.key = key;
    let t = this.g[key] = new Group<T>();
    t.eh = {}; t.l = this;
    return t;
  }
  group(key: string) {
    return this.g[key] || this.addGroup(key);
  }
  onupdate(callback: EventTargetCallback<L<T, A>, UpdateEvent<T>>) {
    return on(this, "update", callback)
  }
  /**events handlers*/
  eh: { [P in keyof T]?: EventTargetCallback<this, T[P]>[] };
  /**when true this List do not raise events */
  slip?: boolean;
  tags?: Dic<Tag<T>>;
  /*private */sorts?: Exp[];

  /**groups */
  g: Dic<Group<T>>;

  /**no update */
  nu?: boolean;

  key?: string;
  childKey?: string;
  parse?: Parse<T, A>;

  binds?: [s: S<any>, fn: Function][];
}
export type Alias<T = any, A = T> = Array<T | A> | L<T, A>;
// static get [Symbol.species]() { return Array; }


// #region methods
// function distinct<T>(): Parse<T, T> {
//   return function (item: T) {
//     if (indexOf(l,item) == -1)
//       return item;
//   }
// }
export const isF = (f: unknown): f is Function => typeof f == "function";



// #region update items

export function replace<T, A = T>(l: L<T, A>, oldI: T | Key, newI: T | A) {
  throw "not implemented";
}
export function set<T, A = T>(l: L<T, A>): L<T, A>;
/**
 * clear array and insert new elements
 * @param values
 */
export function set<T, A = T>(l: L<T, A>, values: Array<T | A>): L<T, A>;
export function set<T, A = T>(l: L<T, A>, values?: Array<T | A>) {
  if (!l.length && (!values || !values.length))
    return;

  l.nu = true;
  let removed = l.removeAt(0, l.length);

  if (values) {
    if (l.sorts) {
      for (let i = 0; i < l.sorts.length; i++) {
        let sort = l.sorts[i],
          opt: CalcOptions = { vars: {} };
        values.sort((a, b) => {
          opt.vars[0] = a;
          opt.vars.b = b;
          return sort.calc(opt) as any;
        });
      }
    }
    l.put(0, ...values);
  }
  l.nu = false;
  emit(l, 'update', { tp: 'set', items: l, removed });
  return l;
}
export function sort<T, A = T>(l: L<T, A>, compareFn?: (a: T, b: T) => number): L<T, A> {
  //TODO make better algorithm
  set(l, l.slice().sort(compareFn));
  return l;
}

export function remove<T, A = T>(l: L<T, A>, ...items: Array<Key | T>) {
  for (let item of items) {
    let i = itemIndex(l, item);
    if (i >= 0)
      l.removeAt(i);
  }
  return l;
}

/**
* 
* @param item
* @param newIndex
*/
export function place<T, A = T>(l: L<T, A>, item: Key | T, newIndex: number) {
  let oldIndex = itemIndex(l, item);
  item = l[oldIndex];

  l.removeAt(oldIndex);
  l.put(newIndex, item);
  emit(l, 'update');

  return l;
}
/**
 * volta a chamar o bind do elemento
 * @param items
 */
export function reload<T, A = T>(l: L<T, A>, item: T | Key) {
  let
    index = itemIndex(l, item),
    t = l[index];
  l.removeAt(index);
  l.put(index, t);
}
export function reloadAll<T, A = T>(l: L<T, A>) {
  // TODO make a reload that not emit events
  set(l, l.slice());
}
export function copy<N, T, A = T>(src: L<T, A>, dest: L<N>, fn: (value: T, index: number) => N): L<N>;
export function copy<N, T, A = T>(src: L<T, A>, fn: (value: T, index: number) => N): L<N>;
export function copy<N, T, A = T>(src: L<T, A>, a: L<N> | ((value: T, index: number) => N), b?: (value: T, index: number) => N) {
  if (isF(a))
    a = orray<N>(map(src, b = a));
  else set(a, map(src, b));

  on(src, 'update', e => {
    switch (e.tp) {
      case 'insert':
        (a as L<N>).put( e.start, e.items.map((v, i) => b(v, e.start + i)));
        break;
      case 'remove':
        (a as L<N>).removeAt(e.start, e.items.length);
        break;
      case 'set':
        set(a as L<N>, e.items.map(b));
        break;
      case 'edit':
        throw "not implemented";
    }
  });
  return a;
}
export function tryPush<T, A = T>(l: L<T, A>, item: T) {
  let k = item[l.key];
  if (l.find(v => v[l.key] == k))
    edit(l, { item: k, props: item });
  else l.push(item);
}
/**
 * edit properties of an element of collection
 * @param item
 * @param prop
 * @param value
 */
export function edit<T, A = T>(l: L<T, A>, item: ListEditItem<T>) {
  let index = itemIndex(l, item.item);
  if (index !== -1) {
    item.item = Object.assign(item.item = l[index], item.props);

    emit(l, 'edit', [<EditEvent<T>>item]);
    emit(l, 'update', null);
  }
  return l;
}
export function editItems<T, A = T>(l: L<T, A>, ...items: T[]) {
  let a: boolean;
  for (let item of items) {
    let k = item[l.key], index = l.findIndex(v => v[l.key] == k);
    if (index !== -1) {
      l[index] = item;
      a = true;
    }
  }
  if (a) {
    emit(l, 'edit', null);
    emit(l, 'update', null);
  }
  return l;
}
// #endregion

// #region util

/**
 * 
 * @param id
 */
export function get<T, A = T>(l: L<T, A>, id: Key) {
  for (let i = 0; i < l.length; i++) {
    let value = l[i];

    if (value[l.key] == id)
      return value;
  }

  return undefined;
}
export function itemIndex<T, A = T>(l: L<T, A>, arg: Key | T, fromIndex?: number) {
  if (l.key)
    for (let i = fromIndex || 0, _l = l.length; i < _l; i++) {
      let value = l[i];
      if (value === arg || value[l.key] == arg)
        return i;
    }

  else for (let i = fromIndex || 0, _l = l.length; i < _l; i++) {
    let value = l[i];
    if (value === arg)
      return i;
  }

  return -1;
}

export function map<U, T, A = T>(l: L<T, A>, callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
  var r: U[] = Array(l.length);
  if (!thisArg)
    thisArg = l;
  for (let i = 0; i < r.length; i++)
    r[i] = callbackfn.call(thisArg, l[i], i, l);
  return r;
}

/**
 * get a group from id if it not exist create new 
 */

// #endregion

// #region events
// private readonly __eh: Dic < EventTargetCallback < this > [] > = { };
/**event handlers */

// #endregion

// #region tags
export function tag<T, A = T>(l: L<T, A>, name: string) { return getTag(l, name)?.value; }
export function getTag<T, A = T>(l: L<T, A>, name: string) {
  return (l.tags ||= {})[name];
}
/**remove tag */
export function setTag<T, A = T>(l: L<T, A>, key: string): L<T, A>;
export function setTag<T, A = T>(l: L<T, A>, key: string, value: T | Key, replace?: boolean): L<T, A>;
export function setTag<T, A = T>(l: L<T, A>, key: string, value?: T | Key, replace?: boolean) {
  let
    index: number = null,
    oldValue = getTag(l, key),
    newValue: Tag<T>;

  if (value == null) {
    if (!oldValue) return l;

    delete l.tags[key];

  } else {
    index = itemIndex(l, value);
    if (index == -1) {
      console.warn({ message: "value is not in list", value });
      return l;
    }

    if (oldValue && index == oldValue.index)
      return l;


    value = l[index];

    newValue = {
      value: value,
      index: index,
      replace: replace
    };
    l.tags[key] = newValue;
  }

  emit(l, 'tag:' + key, value);
  emit(l, "update", {
    tp: "tag",
    tag: key,
    newI: index,
    oldI: oldValue ? oldValue.index : null
  })
  return l;
}
export function ontag<T, A = T>(l: L<T, A>, key: string, callback: (this: L<T, A>, e: T) => any) {
  on(l, `tag:${key}`, callback);
  return l;
  //return on(l,<any>(), callback);
}
// #endregion

// #region binding

export function unbind<T, A = T>(l: L<T, A>, s: S<any>) {
  let b = l.binds
  if (b) {
    let i = b.findIndex(b => b[0] == s);
    if (i != -1)
      b.splice(i, 1);
  }
  return l;
}
export function bind<T, TS extends S<ANYElement> = S<HTMLElement>, A = T>(l: L<T, A>, s: TS, opts?: LBond<T, A, TS>): TS;
export function bind<T, TS extends S<ANYElement> = S<HTMLElement>, A = T>(l: L<T, A>, s: TS, opts?: LBondInsert<T, A, TS>): TS;
export function bind<T, A = T>(l: L<T, A>, s: S<any>, opts: LBond<any, any> | LBondInsert<T, A, any> = {}) {
  let bond = isF(opts) ? { insert: opts } : opts;

  let
    empty = (value: boolean) => {
      if (bond.empty) {
        let v = bond.empty.call(l, value);
        if (v)
          s.set(value);
      }
    },
    insert = (items: ArrayLike<any>, start: number) => {
      for (let i = 0; i < items.length; i++) {
        let
          item = items[i],
          v = bond.insert ? bond.insert.call(l, item, start + i, s) : item;
        if (v) s.place(start + i, v);
      }
    },
    remove = (items: any[], start: number) => {
      for (let i = 0; i < items.length; i++) {
        if (bond.remove ? bond.remove.call(l, items[i], start + i, s) : true)
          s.unplace(start + i);
      }
    },
    fn = (opts: UpdateEvent<any>) => {
      switch (opts.tp) {
        case 'insert':
          if (l.length == opts.items.length)
            empty(false);
          insert(opts.items, opts.start);
          break;
        case 'remove':
          remove(opts.items, opts.start);
          if (!l.length)
            empty(true);
          break;
        case 'tag':
          if (bond.tag) {
            if (opts.oldI != null)
              bond.tag.call(l, s.child(opts.oldI), false, opts.tag, l[opts.oldI], opts.oldI, s);

            if (opts.newI != null)
              bond.tag.call(l, s.child(opts.newI), true, opts.tag, l[opts.newI], opts.newI, s);
          }
          break;
        case 'set':
          if (bond.clear === false)
            remove(opts.removed, 0);
          else if (bond.clear)
            bond.clear(s);
          else s.set();

          if (opts.items) {
            if (!opts.removed)
              empty(false);
            insert(opts.items, 0);
          } else empty(true);
      }
    }

  l.onupdate(fn);
  if (bond.groups)
    if (isF(bond.groups))
      for (let g in l.g)
        bindGroup(l, s, g, bond.groups);
    else for (let g in bond.groups)
      bindGroup(l, s, g, bond.groups[g]);


  if (l.binds)
    l.binds.push([s, fn]);
  else l.binds = [[s, fn]];
  insert(l, 0);

  return s;
}

export function bindGroup<T, TS extends S<ANYElement> = S<HTMLElement>, A = T>(l: L<T, A>, s: TS, groupKey: string, bond: GroupBind<T, TS>): TS {
  let g = l.g[groupKey];
  if (g) {
    let call = (items: any[], indexes: number[], state: boolean) => {
      for (let i = 0; i < items.length; i++) {
        let id = indexes[i];
        bond.call(l, s.child(id), state, items[i], groupKey, id, s);
      }
    };
    on(g, "set", e => {
      if (e.add)
        call(e.add, e.addId, true);
      if (e.remove)
        call(e.remove, e.remvId, false);
    });
  } else console.error(`group '${groupKey}' not found`);
  return s;
}
// #endregion

// #endregion

type LBondInsert<T, A, TS extends S<ANYElement>> = (this: L<T, A>, value: T, index?: number, container?: TS) => any;
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
type GroupBind<T, TS extends S<ANYElement>> = (this: L<T>, element: TS, value: boolean, item: T, groupKey: string, index: number, parent: TS) => void;


export function extend<T = any, A = T>(l?: L<T, A>, options?: IList<T, A>) {
  if (!l.eh) l = orray(l, options);
  else if (options) {
    if (isF(options))
      options = { parse: options };
    if (options.g)
      for (let g of options.g)
        if (!(g in l.g))
          l.addGroup(g);
    if (options.sorts)
      throw "not implemented";
    if (options.key && l.key && l.key != options.key)
      throw "inconpatible lists";
  }
  return l;
}
export default function orray<T = any, A = T>(options: IList<T, A>): L<T, A>
export default function orray<T = any, A = T>(array?: Array<T | A>, options?: IList<T, A>): L<T, A>
export default function orray<T = any, A = T>(array?: Array<T | A> | IList<T, A>, opts?: IList<T, A>) {
  if (array && !('length' in array)) {
    opts = <IList<any>>array
    array = null;
  }
  let l = new L<T,A>();
  l.g = {};
  l.eh = {};
  if (opts) {
    if (isF(opts))
      opts = { parse: opts };
    l.key = opts.key;
    l.childKey = opts.child;
    l.sorts = opts.sorts;
    l.parse = opts.parse || opts.converter;

    if (opts.g)
      for (let g of opts.g)
        l.addGroup( g);
  }
  if (array)
    l.put(0, ...<Array<T | A>>array);
  return l;
}