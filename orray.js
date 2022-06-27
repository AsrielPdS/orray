const { Group, bind: bindGroup } = require("./group");
const { emit, on } = require("handler");
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
//   l.findIndex?(arg: Key | T, fromIndex?: number): number;
//   emit?<K extends keyof EventMap<T>>(event: K, data?: EventMap<T>[K]): boolean | -1;
//   on?<K extends keyof EventMap<T>>(event: K, callback: EventTargetCallback<this, EventMap<T>[K]>): L<T, A>;
//   unbind?(s: S): L<T, A>;
//   bind?<TS extends S<ANYElement> = S<HTMLElement>>(s: TS, opts?: LBond<T, A, TS>): TS;
// }
class L extends Array {
  put(start, ...values) {
    if (this.parse)
      for (let i = 0; i < values.length; i++) {
        let t = this.parse(values[i], i + start);
        if (t === undefined)
          values.splice(i--, 1);
        else
          values[i] = t;
      }
    if (!values.length)
      return;
    let length = values.length, oldLength = this.length;
    this.length += length;
    //impurra todos items afrente do start para frente
    for (let c = oldLength - 1; c >= start; c--)
      this[c + length] = this[c];
    for (let c = 0; c < length; c++) {
      this[start + c] = values[c];
    }
    if (this.tags) {
      for (let key in this.tags) {
        let tag = this.tags[key];
        if (tag.index >= start)
          tag.index += length;
      }
    }
    emit(this, 'insert', values);
    if (!this.nu)
      emit(this, 'update', {
        tp: 'insert',
        start: start,
        items: values
      });
    return this;
  }
  removeAt(start, length = 1) {
    if (length + start > this.length)
      length = this.length - start;
    if (length <= 0)
      return;
    var removed = Array(length);
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
          setTag(this, key, tag.replace ?
            this[Math.min(tag.index, this.length - 1)] :
            null, tag.replace);
        }
      }
    emit(this, 'remove', removed);
    if (!this.nu)
      emit(this, 'update', { tp: 'remove', start, items: removed });
    return removed;
  }
  push(...values) {
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
  unshift(...values) {
    this.put(0, ...values);
    return this.length;
  }
  /**@param values{any[]} */
  set(values) {
    if (!this.length && !values?.length)
      return;
    this.nu = true;
    let removed = this.removeAt(0, this.length);
    if (values) {
      if (this.sorts) {
        for (let i = 0; i < this.sorts.length; i++) {
          let sort = this.sorts[i], opt = { vars: {} };
          values.sort((a, b) => {
            opt.vars[0] = a;
            opt.vars.b = b;
            return sort.calc(opt);
          });
        }
      }
      this.put(0, ...values);
    }
    this.nu = false;
    emit(this, 'update', { tp: 'set', items: this, removed });
    return this;
  }
  has(id) {
    for (let i = 0; i < this.length; i++) {
      if (this[i][this.key] === id)
        return true;
    }
    return false;
  }
  findIndex(arg, thisArg) {
    return super.findIndex(isF(arg) ? arg : v => v === arg || (v && v[this.key] == arg), thisArg)
  }
  find(predicate, thisArg) {
    return super.find(isF(predicate) ? predicate : (v => v[this.key] == predicate), thisArg)
  }
  // getIndex = (l, arg, fromIndex) => {
  //   if (l.key)
  //     for (let i = fromIndex || 0, _l = l.length; i < _l; i++) {
  //       let value = l[i];
  //       if (value === arg || value[l.key] == arg)
  //         return i;
  //     }
  //   else
  //     for (let i = fromIndex || 0, _l = l.length; i < _l; i++) {
  //       let value = l[i];
  //       if (value === arg)
  //         return i;
  //     }
  //   return -1;
  // }
  addGroup(key) {
    // t.key = key;
    let t = this.g[key] = new Group();
    t.eh = {};
    t.l = this;
    return t;
  }
  group(key) {
    return this.g[key] || this.addGroup(key);
  }
  on(event, callback, options) {
    if (isF(event)) {
      callback = event;
      event = "update";
    }
    return on(this, event, callback, options);
  }
  onupdate(callback) {
    return on(this, "update", callback);
  }
  /**events handlers*/
  eh;
  /**when true this List do not raise events */
  slip;
  tags;
    /*private */ sorts;
  /**groups */
  g;
  /**no update */
  nu;
  key;
  childKey;
  parse;
  binds;
}
exports.L = L;
const
  getTag = (l, name) => (l.tags ||= {})[name],
  extend = (l, opts) => {
    if (!l || !l.eh)
      l = orray(l, opts);
    else if (opts) {
      if (isF(opts))
        opts = { parse: opts };
      if (opts.g)
        for (let g of opts.g)
          if (!(g in l.g))
            l.addGroup(g);
      if (opts.sorts)
        throw "not implemented";
      if (opts.key) {
        if (l.key && l.key != opts.key)
          throw "inconpatible lists";
        l.key = opts.key;
      }
    }
    return l;
  },
  orray = (array, opts) => {
    if (array && !('length' in array)) {
      opts = array;
      array = null;
    }
    let l = new L();
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
          l.addGroup(g);
    }
    if (array)
      l.put(0, ...array);
    return l;
  }
exports.getTag = getTag;
exports.extend = extend;
exports.orray = orray;
exports.default = orray;
exports.create = orray;

// static get [Symbol.species]() { return Array; }
// #region methods
// function distinct<T>(): Parse<T, T> {
//   return function (item: T) {
//     if (indexOf(l,item) == -1)
//       return item;
//   }
// }
const isF = (f) => typeof f == "function";
// #region update items
exports.replace = (l, oldI, newI) => {
  throw "not implemented";
}
/**@param l{L} */
exports.sort = (l, compareFn) => {
  //TODO make better algorithm
  l.set(l.slice().sort(compareFn));
  return l;
}
exports.remove = (l, ...items) => {
  for (let item of items) {
    let i = l.findIndex(item);
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
exports.place = (l, item, newIndex) => {
  let oldIndex = l.findIndex(item);
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
exports.reload = (l, item) => {
  // TODO make a reload that not emit events
  let index = l.findIndex(item), t = l[index];
  l.removeAt(index);
  l.put(index, t);
}
exports.reloadAll = (l) => {
  // TODO make a reload that not emit events
  l.set(l.slice());
}
exports.copy = (src, a, b) => {
  if (isF(a))
    a = orray(src.map(b = a));
  else
    a.set(src.map(b));
  src.onupdate(e => {
    switch (e.tp) {
      case 'insert':
        a.put(e.start, e.items.map((v, i) => b(v, e.start + i)));
        break;
      case 'remove':
        a.removeAt(e.start, e.items.length);
        break;
      case 'set':
        a.set(e.items.map(b));
        break;
      case 'edit':
        throw "not implemented";
    }
  });
  return a;
}
exports.tryPush = (l, item) => {
  let k = item[l.key];
  if (l.find(v => v[l.key] == k))
    edit(l, { item: k, props: item });
  else
    l.push(item);
}
/**
 * edit properties of an element of collection
 * @param item
 * @param prop
 * @param value
 */
exports.edit = (l, item) => {
  let index = l.findIndex(item.item);
  if (index !== -1) {
    item.item = Object.assign(item.item = l[index], item.props);
    emit(l, 'edit', [item]);
    emit(l, 'update', null);
  }
  return l;
}
exports.editItems = (l, ...items) => {
  let a;
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
exports.get = (l, id) => {
  for (let i = 0; i < l.length; i++) {
    let value = l[i];
    if (value[l.key] == id)
      return value;
  }
  return undefined;
}
exports.map = (l, callbackfn, thisArg) => {
  var r = Array(l.length);
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
exports.tag = (l, name) => getTag(l, name)?.value
exports.setTag = (l, key, value, replace) => {
  let index = null, oldValue = getTag(l, key), newValue;
  if (value == null) {
    if (!oldValue)
      return l;
    delete l.tags[key];
  }
  else {
    index = l.findIndex(value);
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
  });
  return l;
}
exports.ontag = (l, key, callback) => {
  on(l, `tag:${key}`, callback);
  return l;
  //return on(l,<any>(), callback);
}
// #endregion
// #region binding
exports.unbind = (l, s) => {
  let b = l.binds;
  if (b) {
    let i = b.findIndex(b => b[0] == s);
    if (i != -1)
      b.splice(i, 1);
  }
  return l;
}
exports.bind = (l, s, opts = {}) => {
  let bond = isF(opts) ? { insert: opts } : opts;
  let empty = (value) => {
    if (bond.empty) {
      let v = bond.empty.call(l, value);
      if (v)
        s.set(value);
    }
  }, insert = (items, start) => {
    for (let i = 0; i < items.length; i++) {
      let item = items[i], v = bond.insert ? bond.insert.call(l, item, start + i, s) : item;
      if (v)
        s.place(start + i, v);
    }
  }, remove = (items, start) => {
    for (let i = 0; i < items.length; i++) {
      if (bond.remove ? bond.remove.call(l, items[i], start + i, s) : true)
        s.unplace(start + i);
    }
  }, fn = (opts) => {
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
        else
          s.set();
        if (opts.items) {
          if (!opts.removed)
            empty(false);
          insert(opts.items, 0);
        }
        else
          empty(true);
    }
  };
  l.onupdate(fn);
  if (bond.groups)
    if (isF(bond.groups))
      for (let g in l.g)
        bindGroup(l, s, g, bond.groups);
    else
      for (let g in bond.groups)
        bindGroup(l, s, g, bond.groups[g]);

  (l.binds ||= []).push([s, fn]);
  insert(l, 0);
  return s;
}
