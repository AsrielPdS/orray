import { S, ANYElement, E, ET, EventTargetCallback } from "galho";

type int = number;
type float = number;
type str = string;
type bool = boolean;
type Key = str | int;
interface Dic<T = any> { [key: string]: T; }

function o<T = any, A = T>(options: o.IList<T, A>): o.L<T, A>
function o<T = any, A = T>(array: o.Alias<T, A>, options?: o.IList<T, A>): o.L<T, A>
function o<T = any, A = T>(array?: Array<T | A> | o.L<T, A>, options?: o.IList<T, A>): o.L<T, A>
function o<T = any, A = T>(array?: Array<T | A> | o.L<T, A> | o.IList<T, A>, options?: o.IList<T, A>) {
  if (array && !Array.isArray(array)) {
    options = <o.IList<any>>array
    array = null;
  }
  if (array instanceof o.L) {
    if (options) {
      if (options.g)
        for (let g of options.g)
          if (!(g in array.g))
            array.addGroup(g);
      if (options.sorts)
        throw "not implemented";
      if (options.key && array.key && array.key != options.key)
        throw "inconpatible lists";
    }
    return array;
  } else return new o.L<T, A>(<T[]>array, options);
}
//mega dom list
module o {
  type CalcOptions = { vars: Dic };
  type Exp = { calc(opts: CalcOptions): any };

  const { prototype: ETP } = ET;

  //adicionar tipo especifico para listas de s� um item;
  export interface Tag<T = any> {
    value: T,
    index: number,
    replace: boolean;
  }
  export interface GroupUp<T> {
    add?: T[];
    addId?: int[];
    remove?: T[];
    remvId?: int[];
  }

  class Group<T = any> extends ET<{ add: T[], remove: T[], up: GroupUp<T>; }> implements ArrayLike<T>, Iterable<T> {
    length: number = 0;
    list: L<T, any>;
    key: string;

    [Symbol.iterator](): Iterator<T> {
      var t = {
        i: 0,
        next: () => {
          return {
            done: this.length == t.i,
            value: this[t.i++]
          };
        }
      };

      return t;
    }
    [index: number]: T;

    add(item: T) {
      let index = this.list.indexOf(item);
      if (index != -1 && !this.includes(item)) {
        let items = [item];

        this[this.length++] = item;


        this.emit('add', items);
        this.emit('up', { add: items, addId: [index] });
      }
    }
    addArray(items: T[]): int[] {
      let indexes = Array(items.length);
      for (let i = 0; i < items.length; i++) {
        let
          item = items[i],
          index = this.list.indexOf(item);

        if (!this.includes(item)) {
          indexes[i] = index;

          this[this.length + i] = item;
        } else items.splice(i--, 1);
      }


      if (items.length) {
        this.length += items.length;

        this.emit('add', items);
        if (!this.noUpdate)
          this.emit("up", { add: items, addId: indexes });
      }
      return indexes;
    }

    addRange(start: number, end: number) {
      if (start > end) {
        let t = start;
        start = end;
        end = t;
      }
      end++;
      return this.addArray(this.list.slice(start, end));
    }
    addAll() {
      return this.addArray(this.list.slice());
    }

    remove(item: T) {
      let i = this.indexOf(item);
      if (i != -1)
        this.removeAt(i);
      return i != -1;
    }
    removeAt(index: number) {
      for (let i = index; i < this.length - 1; i++)
        this[i] = this[i + 1];

      let
        item = this[index],
        items = [item],
        id = [this.indexOf(item)];

      delete this[--this.length];

      this.emit('remove', items);
      if (!this.noUpdate)
        this.emit('up', { remove: items, remvId: id });
    }
    removeArray(items: T[]): int[] {
      let indexes = Array(items.length);
      for (let i = 0; i < items.length; i++) {
        let item = items[i],
          indexInList = this.list.indexOf(item),
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
        this.emit('remove', items);
        if (!this.noUpdate)
          this.emit('up', { remove: items, remvId: indexes });
      }
      return indexes;
    }

    removeRange(from: number, to?: number) {
      return this.removeArray(this.list.slice(from, to));
    }
    private noUpdate: boolean;

    set(add?: T[]) {
      if ((!add || !add.length) && !this.length)
        return;
      this.noUpdate = true;
      let
        remove = this.list.slice(),
        remvId = this.removeArray(remove),
        addId = add ? this.addArray(add) : [];
      this.noUpdate = false;

      this.emit('up', {
        remove, remvId,
        add, addId
      });
      return this;
    }
    invert() {
      this.set(this.list.filter(i => !this.includes(i)))
      return this;
    }
    setRange(start: number, end: number) {
      this.set(this.list.slice(start, end));
    }
    indexOf(item: T) {
      for (let i = 0; i < this.length; i++)
        if (item === this[i])
          return i;
      return -1;
    }
    includes(item: T) {
      for (let i = 0; i < this.length; i++)
        if (item === this[i])
          return true;
      return false;
    }
    toJSON() {
      throw "not implemented";
    }
    map<U>(callbackfn: (value: T, index: number, group: Group<T>) => U/*, thisArg?: any*/): U[] {
      var r: U[] = [];
      for (let i = 0; i < this.length; i++)
        r.push(callbackfn(this[i], i, this));
      return r;
    }
    forEach(callbackfn: (value: T, index: number) => void | boolean) {
      for (let i = 0; i < this.length; i++)
        if (callbackfn(this[i], i) === false)
          return;
    }
    indexes() {
      for (var r: number[] = Array(this.length), i = 0; i < this.length; i++)
        r[i] = this.list.indexOf(this[i]);

      return r;
    }
    keys() {

      for (var key = this.list.key, r: Key[] = [], i = 0; i < this.length; i++)
        r.push(this[i][key]);
      return r;
    }
    values() {
      for (var r: T[] = [], i = 0; i < this.length; i++)
        r.push(this[i]);
      return r;
    }
  }

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

  type Parse<T, A> = (this: L<T, A>, value: T | A, index: int, length: int) => void | T;
  export interface IList<T, A = T> {
    key?: string;
    child?: string;
    parse?: Parse<T, A>;
    /**@deprecated */
    converter?: Parse<T, A>;
    g?: string[];
    sorts?: Exp[];
    clear?: boolean;
  }

  export interface Alias<T, A = T> extends Array<T | A> {
    edit?(...item: Array<ListEditItem<T>>);
    put?(place: number, ...values: Array<T | A>);
    remove?(...item: Array<Key | T>): boolean;
    removeAt?(start: number, length?: number);
    place?(item: Key | T, newPos: number);
    set?(values?: Array<T | A>);
    get?: (id: Key) => T;
    has?: (id: Key) => boolean;
    groups?: Dic<Group<T>>;

    replace?(oldValue: Key | T, newValue: T);

    nest?: Exp;

    setTag?(name: string, value?: T | Key, replace?: boolean): this;
    getTag?(name: string): Tag<T>;

    focus?(value: T | Key, shift?: boolean, ctrl?: boolean, key?: string);
    focusTo?(relativeValue: number, shift?: boolean, ctrl?: boolean, key?: string, revert?: boolean);
    focusToHome?(shift?: boolean, ctrl?: boolean, key?: string);
    focusToEnd?(shift?: boolean, ctrl?: boolean, key?: string);
    focusAll?(key?: string);
    focusNone?(key?: string);
    focused?(key?: string): T[];

    itemIndex?(arg: Key | T, fromIndex?: number): number;

    emit?<K extends keyof EventMap<T>>(event: K, data?: EventMap<T>[K]): boolean;//List<T, A>;
    on?<K extends keyof EventMap<T>>(event: K, callback: EventTargetCallback<this, EventMap<T>[K]>): this;

    unbind?(s: S<any>): this;
    bind?<TS extends ANYElement = HTMLElement>(s: S<TS>, opts?: LBond<T, A>): S<TS>;
  }
  export class L<T = any, A = T> extends Array<T> implements ET<EventMap<T>>/*, Alias<T, A>*/ {

    // #region fields
    tags: Dic<Tag<T>>;
    private sorts: Exp[];

    /**groups */
    readonly g: Dic<Group<T>> = {};
    readonly __eh: Dic<EventTargetCallback<this>[]> = {};

    private noupdate: boolean;

    key: string;
    childKey?: string;
    parse: Parse<T, A>;

    /**when true this List d'nt raise events */
    slip: boolean;

    // #endregion

    constructor(array?: Array<T | A>, opts: IList<T, A> = {}) {
      super();

      this.key = opts.key;
      this.childKey = opts.child;

      this.sorts = opts.sorts;

      this.parse = opts.parse || opts.converter;

      if (opts.g)
        opts.g.forEach(this.addGroup, this);

      if (array)
        this.put(0, ...array);
    }

    static distinct<T>(): Parse<T, T> {
      return function (item: T) {
        if (this.indexOf(item) == -1)
          return item;
      }
    }

    // #region methods
    addGroup(key: string) {
      var t = this.g[key] = new Group();
      t.list = this;
      t.key = key;
    }


    // #region update items
    put(start: number, ...values: Array<T | A>) {

      if (this.parse)
        for (let i = 0; i < values.length; i++) {
          let t = this.parse.call(this, values[i], i + start);
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

      this.emit('insert', <T[]>values);
      if (!this.noupdate)
        this.emit('update', {
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

      for (let key in this.g) {
        this.g[key].removeArray(Array.from(removed));
      }

      if (this.tags)
        for (let key in this.tags) {
          let tag = this.tags[key];
          if (tag.index >= (start + length))
            tag.index -= length;
          else if (tag.index >= start) {
            //o que estava antes
            //if (tag.replace) {
            //  this._tags[key] = null;
            //  this.setTag(key, this[Math.min(tag.index, this.length - 1)], true);
            //} else delete this._tags[key];

            this.setTag(key,
              tag.replace ?
                this[Math.min(tag.index, this.length - 1)] :
                null, tag.replace);
          }
        }

      this.emit('remove', removed);

      if (!this.noupdate)
        this.emit('update', { tp: 'remove', start, items: removed });

      return removed;

    }

    splice(start: number, deleteCount: number, ...values: Array<T | A>): T[] {
      var result = this.removeAt(start, deleteCount);
      this.put(start, ...values);

      return result;
    }
    set(): this;
    /**
     * clear array and insert new elements
     * @param values
     */
    set(values: Array<T | A>): this;
    set(values?: Array<T | A>) {
      if (!this.length && (!values || !values.length))
        return;

      this.noupdate = true;
      let removed = this.removeAt(0, this.length);

      if (values) {
        if (this.sorts) {
          for (let i = 0; i < this.sorts.length; i++) {
            let sort = this.sorts[i],
              opt: CalcOptions = { vars: {} };
            values.sort((a, b) => {
              opt.vars[0] = a;
              opt.vars.b = b;
              return sort.calc(opt) as any;
            });
          }
        }
        this.put(0, ...values);
      }
      this.noupdate = false;
      this.emit('update', { tp: 'set', items: this, removed });
      return this;
    }
    sort(compareFn?: (a: T, b: T) => number) {
      throw "not implemented";
      super.sort(compareFn);
      return this;
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

    remove(item: Key | T) {
      let i = this.itemIndex(item);
      if (i >= 0)
        this.removeAt(i);

      return i >= 0;
    }

    /**
    * 
    * @param item
    * @param newIndex
    */
    place(item: Key | T, newIndex: number) {
      var oldIndex = this.itemIndex(item);
      item = this[oldIndex];

      this.removeAt(oldIndex);
      this.put(newIndex, item);

      //for (let j = 0; j < this.binds.length; j++) {
      //  let bind = this.binds[j];
      //  let t2 = bind.place ? bind.place.call(this, oldIndex, newIndex, bind.s) : true;
      //  if (t2 !== undefined) bind.s.insertInPos(this.child(bind, oldIndex), newIndex);
      //}

      //this.emit('place', { old: oldIndex, new: newIndex, item: item });
      this.emit('update');

      return this;
    }
    /**
     * volta a chamar o bind do elemento
     * @param items
     */
    reload(item: T | Key) {
      let
        index = this.itemIndex(item),
        t = this[index];
      this.removeAt(index);
      this.put(index, t);
    }
    reloadAll() {
      this.set(this.slice());
    }
    copy<N>(l: L<N>, fn: (value: T, index: number) => N): L<N>;
    copy<N>(fn: (value: T, index: number) => N): L<N>;
    copy<N>(a: L<N> | ((value: T, index: number) => N), b?: (value: T, index: number) => N) {
      if (typeof a == "function")
        a = new L<N>(this.map(b = a));
      else a.set(this.map(b));

      this.on('update', e => {
        switch (e.tp) {
          case 'insert':
            (a as L<N>).put(e.start, ...e.items.map((v, i) => b(v, e.start + i)));
            break;
          case 'remove':
            (a as L<N>).removeAt(e.start, e.items.length);
            break;
          case 'set':
            (a as L<N>).set(e.items.map(b));
            break;
          case 'edit':
            throw "not implemented";
        }
      });
      return a;
    }
    tryPush(item: T) {
      let k = item[this.key];
      if (this.byKey(k))
        this.edit({ item: k, props: item });
      else this.push(item);
    }
    /**
     * edit properties of an element of collection
     * @param item
     * @param prop
     * @param value
     */
    edit(item: ListEditItem<T>) {
      let index = this.itemIndex(item.item);
      if (index !== -1) {
        item.item = Object.assign(item.item = this[index], item.props);

        this.emit('edit', [<EditEvent<T>>item]);
        this.emit('update', null);
      }
      return this;
    }
    editItems(...items: T[]) {
      let a: boolean;
      for (let item of items) {
        let index = this.indexByKey(item[this.key]);
        if (index !== -1) {
          this[index] = item;
          a = true;
        }
      }
      if (a) {
        this.emit('edit', null);
        this.emit('update', null);
      }
      return this;
    }
    // #endregion

    // #region util

    /**
     * 
     * @param id
     */
    get(id: Key) {
      for (let i = 0; i < this.length; i++) {
        let value = this[i];

        if (value[this.key] == id)
          return value;
      }

      return undefined;
    }
    has(id: Key) {
      for (let i = 0; i < this.length; i++) {
        if (this[i][this.key] === id)
          return true;
      }

      return false;
    }
    itemIndex(arg: Key | T, fromIndex?: number) {
      if (this.key)
        for (let i = fromIndex || 0, l = this.length; i < l; i++) {
          let value = this[i];
          if (value === arg || value[this.key] == arg)
            return i;
        }

      else for (let i = fromIndex || 0, l = this.length; i < l; i++) {
        let value = this[i];
        if (value === arg)
          return i;
      }

      return -1;
    }
    byKey<K extends keyof T>(value, key: K = <any>this.key) {
      return super.find(v => v[key] == value);
    }
    indexByKey<K extends keyof T>(value, key: K = <any>this.key) {
      return super.findIndex(v => v[key] == value);
    }

    map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
      var r: U[] = Array(this.length);
      if (!thisArg)
        thisArg = this;
      for (let i = 0; i < r.length; i++)
        r[i] = callbackfn.call(thisArg, this[i], i, this);
      return r;
    }

    filter<S extends T>(callbackfn: (value: T, index: number, array: T[]) => value is S, thisArg?: any): S[];
    filter(callbackfn: (value: T, index: number, array: this) => unknown, thisArg?: any): T[];
    filter(callbackfn: (value: T, index: number, array: this) => unknown, thisArg?: any) {
      let r: T[] = [];
      for (let i = 0; i < this.length; i++)
        if (callbackfn.call(thisArg, this[i], i, this))
          r.push(this[i]);

      return r;
    }

    //slice(start: number = 0, end: number = this.length) {
    //  if (end > this.length)
    //    end = this.length;
    //  let r: T[] = Array(end - start);
    //  for (let i = start; i < end; i++)
    //    r[i - start] = this[i];
    //  return r;
    //}

    // #endregion

    // #region events
    on<K extends keyof EventMap<T>>(event: K, callback: EventTargetCallback<this, EventMap<T>[K]>): this;
    //on(event: string, callback: EventTargetCallback<this, ListTag<T>>): this;
    on(event: string, callback: EventTargetCallback<this>) {
      return ETP.on.call(this, event, callback);

    }

    off<K extends keyof EventMap<T>>(event: K, callback: EventTargetCallback<this, EventMap<T>[K]>) {
      return ETP.off.call(this, event, callback);
    }

    emit<K extends keyof EventMap<T>>(event: K, data?: EventMap<T>[K]): boolean;
    emit(event: string, data?: Tag<T>): boolean;
    emit(event: string, data?) {
      if (this.slip)
        return true;
      return ETP.emit.call(this, event, data);
    }
    // #endregion

    // #region tags
    tag(name: str) { return this.getTag(name)?.value; }
    getTag(name: string) {
      return (this.tags ||= {})[name];
    }
    setTag(key: string, value?: T | Key, replace?: boolean) {
      let
        index: number = null,
        oldValue = this.getTag(key),
        newValue: Tag<T>;

      if (value == null) {
        if (!oldValue) return;

        delete this.tags[key];

      } else {
        index = this.itemIndex(value);
        if (index == -1)
          throw { message: "value is not in list", value: value };

        if (oldValue && index == oldValue.index)
          return;


        value = this[index];

        newValue = {
          value: value,
          index: index,
          replace: replace
        };
        this.tags[key] = newValue;
      }

      this.emit(<any>('tag:' + key), value);
      this.emit("update", {
        tp: "tag",
        tag: key,
        newI: index,
        oldI: oldValue ? oldValue.index : null
      })
      return this;
    }
    ontag(key: string, callback: EventTargetCallback<this, T>) {
      return this.on(<any>('tag:' + key), callback);
    }
    // #endregion

    // #region focus

    focus(value: T | Key, key: str, shift?: boolean, ctrl?: boolean) {
      let
        group = this.g[key],
        tag = this.getTag(key),

        lastIndex = tag ? tag.index : -1,
        newIndex = this.itemIndex(value);

      if (lastIndex == newIndex && !ctrl)
        return;

      //se n�o for um grupo nem tiver o shift precionado
      if (!group || !shift)
        this.setTag(key, this[newIndex]);

      if (group) {

        if (!ctrl && !shift)
          group.set([this[newIndex]]);
        else if (shift && !ctrl)
          group.setRange(lastIndex == -1 ? 0 : lastIndex, newIndex);
        else if (shift && ctrl)
          group.addRange(lastIndex == -1 ? 0 : lastIndex, newIndex);
        else if (ctrl) {
          let i = group.indexOf(this[newIndex]);
          if (i == -1)
            group.add(this[newIndex]);
          else group.removeAt(i);
        }

      }
    }
    focusTo(relativeValue: number, key: str, shift?: boolean, ctrl?: boolean, revert: boolean = true) {
      let
        l = this.length,
        tag = this.getTag(key);
      if (!l || !relativeValue) return;

      if (tag) {
        relativeValue += tag.index;

        if (revert && false)
          if (relativeValue < 0) {
            var old = this.length + relativeValue;
            relativeValue = 0;
          } else if (relativeValue >= l) {
            var old = relativeValue - l;
            relativeValue = l - 1;
          }

        if (relativeValue < 0)
          relativeValue = 0;
        else if (relativeValue >= l)
          relativeValue = l - 1;

        this.focus(this[relativeValue], key, shift, ctrl);


        if (revert && false) {
          //if (relativeValue) {

          //} else if (relativeValue >= this.length) {

          //   relativeValue = this.length - 1;
          //}
          this.setTag(key, this[old]);
          var group = this.g[key];
          if (group)
            group.add(this[old]);

        }
      } else {
        //se nao tiver item selecionado sempre selecionara o primeiro
        this.setTag(key, this[0]);
        let g = this.g[key];
        if (g)
          g.set([this[0]]);
      }


    }
    focusToBegin(key: str, shift?: boolean, ctrl?: boolean) {
      var tag = this.getTag(key);
      if (tag)
        this.focusTo(-tag.index, key, shift, ctrl);
    }
    focusToEnd(key: str, shift?: boolean, ctrl?: boolean) {
      var tag = this.getTag(key);

      if (tag)
        this.focusTo(this.length - tag.index, key, shift, ctrl);
    }
    focusAll(key: str) {
      if (this.length) {
        if (!this.getTag(key))
          this.setTag(key, this[0]);

        var group = this.g[key];
        if (group)
          group.addAll();
      }
    }
    /** remove focus */
    defocus(key: str) {
      this.setTag(key);

      var group = this.g[key];
      if (group)
        group.set();
    }
    focused(key: str) {
      let group = this.g[key], tag: Tag<T>;
      return group ? group.values() : ((tag = this.getTag(key)) ? [tag.value] : []);
    }

    hasFocus(value: T, key: str) {
      let group = this.g[key], tag: Tag<T>;
      return group ?
        group.indexOf(value) != -1 :
        !!(tag = this.getTag(key)) && tag.value == value;
    }
    onfocus(key: str,listener?: (this: this, active: T, selected?: Group<T>) => void) {
      if (arguments.length) {
        var group = this.g[key];

        if (group)
          group.on('up', () => {
            let t = this.getTag(key);
            listener.call(this, t && t.value, group)
          });
        else this.ontag(key, listener);
      } else {
        if (group)
          group.emit('up');
        else this.emit('tag:' + key, this.getTag(key));
      }
      return this;
    }
    //emitfocus() {

    //}

    // #endregion

    // #endregion


    binds?: [s: S<any>, fn: Function][];
    unbind(s: S<any>) {
      let b = this.binds
      if (b) {
        let i = b.findIndex(b => b[0] == s);
        if (i != -1)
          b.splice(i, 1);
      }
      return this;
    }
    bind<TS extends ANYElement = HTMLElement>(s: S<TS>, opts?: LBond<T, A>): S<TS>;
    bind<TS extends ANYElement = HTMLElement>(s: S<TS>, opts?: LBondInsert<T, A>): S<TS>;
    bind(s: S<any>, opts: LBond<any, any> | LBondInsert<T, A> = {}) {
      let bond = typeof opts == "function" ? { insert: opts } : opts;

      let
        empty = (value: boolean) => {
          if (bond.empty) {
            let v = bond.empty.call(this, value);
            if (v)
              s.set(value);
          }
        },
        insert = (items: any[], start: number) => {
          for (let i = 0; i < items.length; i++) {
            let
              item = items[i],
              v = bond.insert ? bond.insert.call(this, item, start + i, s) : item;
            if (v) s.place(start + i, v);
          }
        },
        remove = (items: any[], start: number) => {
          for (let i = 0; i < items.length; i++) {
            if (bond.remove ? bond.remove.call(this, items[i], start + i, s) : true)
              s.removeChild(start + i);
          }
        },
        fn = (opts: UpdateEvent<any>) => {
          switch (opts.tp) {
            case 'insert':
              if (this.length == opts.items.length)
                empty(false);
              insert(opts.items, opts.start);
              break;
            case 'remove':
              remove(opts.items, opts.start);
              if (!this.length)
                empty(true);
              break;
            case 'tag':
              if (bond.tag) {
                if (opts.oldI != null)
                  bond.tag.call(this, s.child(opts.oldI), false, opts.tag, this[opts.oldI], opts.oldI, s);

                if (opts.newI != null)
                  bond.tag.call(this, s.child(opts.newI), true, opts.tag, this[opts.newI], opts.newI, s);
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

      this.on('update', fn);
      if (bond.groups)
        if (typeof bond.groups == "function")
          for (let g in this.g)
            this.bindGroup(s, g, bond.groups);
        else for (let g in bond.groups)
          this.bindGroup(s, g, bond.groups[g]);


      if (this.binds)
        this.binds.push([s, fn]);
      else this.binds = [[s, fn]];
      insert(<any>this, 0);

      return s;
    }
    bindGroup<TS extends ANYElement = HTMLElement>(s: S<TS>, groupKey: str, bond: GroupBind<T>): S<TS> {
      let g = this.g[groupKey];
      if (!g) throw `group '${groupKey}' not found`;
      let call = (items: any[], indexes: int[], state: bool) => {
        for (let i = 0; i < items.length; i++) {
          let id = indexes[i];
          bond.call(this, s.child(id), state, groupKey, items[i], id, s);
        }
      };
      g.on("up", e => {
        if (e.add)
          call(e.add, e.addId, true);
        if (e.remove)
          call(e.remove, e.remvId, false);
      });
      return s;
    }
    bindToE(e: E<any, any>, prop: str): this {
      e.i[prop] = <any>this;
      //for block circular updating event
      let reloading: boolean;

      this.on('update', () => {
        if (reloading) {
          reloading = false;
        } else {
          reloading = true;

          e.set([prop]);
        }
      });

      e.on('update', (ev) => {
        if (reloading) {
          reloading = false;
        } else if (prop in ev) {
          let value = ev[prop];
          reloading = true;
          e.i[prop] = <any>this.set(<any>value);
        }

      });
      return this;
    }
    static get [Symbol.species]() { return Array; }
  }

  type LBondInsert<T, A> = (this: L<T, A>, value: T, index?: number, container?: S) => any;
  export interface LBond<T = any, A = T> {
    /**
     * metodo que sera chamado no clear, caso n�ot tenha removera um item de cada vez*/
    clear?: false | ((container: S) => void);
    /**inset an element in arbitrary position
     se retornar um valor inserira este elemento n�o posi��o do item adicionado*/
    insert?: LBondInsert<T, A>;

    /**
     * remove an arbitrary element
     * se retornar true remove o item naquela posi��o
     * se n�o definido remove o item automaticamente
     * @param this
     * @param pos
     */
    remove?: (this: L<T, A>, item: T, index: number, container?: S) => true | void;

    /**
     * 
     * @param this
     * @param value
     * @param props
     * @param container
     */
    edit?: (this: L<T, A>, item: T, index: number, props: Partial<T>, container: S) => S | void;

    /**chamado quando tenta se reposicionar um elemento */
    place?: (this: L<T, A>, oldPlace: number, newPlace: number, container: S) => boolean | void;

    /**
     * 
     * @param this
     * @param empty
     * @param container
     */
    empty?: (this: L<T, A>, empty: boolean, container?: S) => any;

    /**
     * */
    groups?: Dic<GroupBind<T>> | GroupBind<T>;


    /** */
    tag?: (this: L<T, A>, s: S, active: boolean, tag: string, value: T, index: number, parent: S) => void;
  }
  type GroupBind<T> = (this: L<T>, element: S, value: boolean, groupKey: str, item: T, index: number, parent: S) => void;

}
export = o;