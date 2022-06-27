"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extend = exports.bindGroup = exports.bind = exports.unbind = exports.ontag = exports.setTag = exports.getTag = exports.tag = exports.map = exports.itemIndex = exports.get = exports.editItems = exports.edit = exports.tryPush = exports.copy = exports.reloadAll = exports.reload = exports.place = exports.remove = exports.sort = exports.set = exports.replace = exports.isF = exports.L = void 0;
const group_1 = require("./group");
const handler_1 = require("handler");
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
        (0, handler_1.emit)(this, 'insert', values);
        if (!this.nu)
            (0, handler_1.emit)(this, 'update', {
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
        (0, handler_1.emit)(this, 'remove', removed);
        if (!this.nu)
            (0, handler_1.emit)(this, 'update', { tp: 'remove', start, items: removed });
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
    has(id) {
        for (let i = 0; i < this.length; i++) {
            if (this[i][this.key] === id)
                return true;
        }
        return false;
    }
    addGroup(key) {
        // t.key = key;
        let t = this.g[key] = new group_1.Group();
        t.eh = {};
        t.l = this;
        return t;
    }
    group(key) {
        return this.g[key] || this.addGroup(key);
    }
    onupdate(callback) {
        return (0, handler_1.on)(this, "update", callback);
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
// static get [Symbol.species]() { return Array; }
// #region methods
// function distinct<T>(): Parse<T, T> {
//   return function (item: T) {
//     if (indexOf(l,item) == -1)
//       return item;
//   }
// }
const isF = (f) => typeof f == "function";
exports.isF = isF;
// #region update items
function replace(l, oldI, newI) {
    throw "not implemented";
}
exports.replace = replace;
function set(l, values) {
    if (!l.length && (!values || !values.length))
        return;
    l.nu = true;
    let removed = l.removeAt(0, l.length);
    if (values) {
        if (l.sorts) {
            for (let i = 0; i < l.sorts.length; i++) {
                let sort = l.sorts[i], opt = { vars: {} };
                values.sort((a, b) => {
                    opt.vars[0] = a;
                    opt.vars.b = b;
                    return sort.calc(opt);
                });
            }
        }
        l.put(0, ...values);
    }
    l.nu = false;
    (0, handler_1.emit)(l, 'update', { tp: 'set', items: l, removed });
    return l;
}
exports.set = set;
function sort(l, compareFn) {
    //TODO make better algorithm
    set(l, l.slice().sort(compareFn));
    return l;
}
exports.sort = sort;
function remove(l, ...items) {
    for (let item of items) {
        let i = itemIndex(l, item);
        if (i >= 0)
            l.removeAt(i);
    }
    return l;
}
exports.remove = remove;
/**
*
* @param item
* @param newIndex
*/
function place(l, item, newIndex) {
    let oldIndex = itemIndex(l, item);
    item = l[oldIndex];
    l.removeAt(oldIndex);
    l.put(newIndex, item);
    (0, handler_1.emit)(l, 'update');
    return l;
}
exports.place = place;
/**
 * volta a chamar o bind do elemento
 * @param items
 */
function reload(l, item) {
    let index = itemIndex(l, item), t = l[index];
    l.removeAt(index);
    l.put(index, t);
}
exports.reload = reload;
function reloadAll(l) {
    // TODO make a reload that not emit events
    set(l, l.slice());
}
exports.reloadAll = reloadAll;
function copy(src, a, b) {
    if ((0, exports.isF)(a))
        a = orray(map(src, b = a));
    else
        set(a, map(src, b));
    (0, handler_1.on)(src, 'update', e => {
        switch (e.tp) {
            case 'insert':
                a.put(e.start, e.items.map((v, i) => b(v, e.start + i)));
                break;
            case 'remove':
                a.removeAt(e.start, e.items.length);
                break;
            case 'set':
                set(a, e.items.map(b));
                break;
            case 'edit':
                throw "not implemented";
        }
    });
    return a;
}
exports.copy = copy;
function tryPush(l, item) {
    let k = item[l.key];
    if (l.find(v => v[l.key] == k))
        edit(l, { item: k, props: item });
    else
        l.push(item);
}
exports.tryPush = tryPush;
/**
 * edit properties of an element of collection
 * @param item
 * @param prop
 * @param value
 */
function edit(l, item) {
    let index = itemIndex(l, item.item);
    if (index !== -1) {
        item.item = Object.assign(item.item = l[index], item.props);
        (0, handler_1.emit)(l, 'edit', [item]);
        (0, handler_1.emit)(l, 'update', null);
    }
    return l;
}
exports.edit = edit;
function editItems(l, ...items) {
    let a;
    for (let item of items) {
        let k = item[l.key], index = l.findIndex(v => v[l.key] == k);
        if (index !== -1) {
            l[index] = item;
            a = true;
        }
    }
    if (a) {
        (0, handler_1.emit)(l, 'edit', null);
        (0, handler_1.emit)(l, 'update', null);
    }
    return l;
}
exports.editItems = editItems;
// #endregion
// #region util
/**
 *
 * @param id
 */
function get(l, id) {
    for (let i = 0; i < l.length; i++) {
        let value = l[i];
        if (value[l.key] == id)
            return value;
    }
    return undefined;
}
exports.get = get;
function itemIndex(l, arg, fromIndex) {
    if (l.key)
        for (let i = fromIndex || 0, _l = l.length; i < _l; i++) {
            let value = l[i];
            if (value === arg || value[l.key] == arg)
                return i;
        }
    else
        for (let i = fromIndex || 0, _l = l.length; i < _l; i++) {
            let value = l[i];
            if (value === arg)
                return i;
        }
    return -1;
}
exports.itemIndex = itemIndex;
function map(l, callbackfn, thisArg) {
    var r = Array(l.length);
    if (!thisArg)
        thisArg = l;
    for (let i = 0; i < r.length; i++)
        r[i] = callbackfn.call(thisArg, l[i], i, l);
    return r;
}
exports.map = map;
/**
 * get a group from id if it not exist create new
 */
// #endregion
// #region events
// private readonly __eh: Dic < EventTargetCallback < this > [] > = { };
/**event handlers */
// #endregion
// #region tags
function tag(l, name) { return getTag(l, name)?.value; }
exports.tag = tag;
function getTag(l, name) {
    return (l.tags ||= {})[name];
}
exports.getTag = getTag;
function setTag(l, key, value, replace) {
    let index = null, oldValue = getTag(l, key), newValue;
    if (value == null) {
        if (!oldValue)
            return l;
        delete l.tags[key];
    }
    else {
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
    (0, handler_1.emit)(l, 'tag:' + key, value);
    (0, handler_1.emit)(l, "update", {
        tp: "tag",
        tag: key,
        newI: index,
        oldI: oldValue ? oldValue.index : null
    });
    return l;
}
exports.setTag = setTag;
function ontag(l, key, callback) {
    (0, handler_1.on)(l, `tag:${key}`, callback);
    return l;
    //return on(l,<any>(), callback);
}
exports.ontag = ontag;
// #endregion
// #region binding
function unbind(l, s) {
    let b = l.binds;
    if (b) {
        let i = b.findIndex(b => b[0] == s);
        if (i != -1)
            b.splice(i, 1);
    }
    return l;
}
exports.unbind = unbind;
function bind(l, s, opts = {}) {
    let bond = (0, exports.isF)(opts) ? { insert: opts } : opts;
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
        if ((0, exports.isF)(bond.groups))
            for (let g in l.g)
                bindGroup(l, s, g, bond.groups);
        else
            for (let g in bond.groups)
                bindGroup(l, s, g, bond.groups[g]);
    if (l.binds)
        l.binds.push([s, fn]);
    else
        l.binds = [[s, fn]];
    insert(l, 0);
    return s;
}
exports.bind = bind;
function bindGroup(l, s, groupKey, bond) {
    let g = l.g[groupKey];
    if (g) {
        let call = (items, indexes, state) => {
            for (let i = 0; i < items.length; i++) {
                let id = indexes[i];
                bond.call(l, s.child(id), state, items[i], groupKey, id, s);
            }
        };
        (0, handler_1.on)(g, "set", e => {
            if (e.add)
                call(e.add, e.addId, true);
            if (e.remove)
                call(e.remove, e.remvId, false);
        });
    }
    else
        console.error(`group '${groupKey}' not found`);
    return s;
}
exports.bindGroup = bindGroup;
function extend(l, options) {
    if (!l.eh)
        l = orray(l, options);
    else if (options) {
        if ((0, exports.isF)(options))
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
exports.extend = extend;
function orray(array, opts) {
    if (array && !('length' in array)) {
        opts = array;
        array = null;
    }
    let l = new L();
    l.g = {};
    l.eh = {};
    if (opts) {
        if ((0, exports.isF)(opts))
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
exports.default = orray;
