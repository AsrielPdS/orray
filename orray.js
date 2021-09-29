"use strict";
const galho_1 = require("galho");
function l(array, options) {
    if (array && !Array.isArray(array)) {
        options = array;
        array = null;
    }
    if (array instanceof l.L) {
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
    }
    else
        return new l.L(array, options);
}
(function (l_1) {
    const { prototype: ETP } = galho_1.ET;
    const on = "on";
    class Group extends galho_1.ET {
        constructor() {
            super(...arguments);
            this.length = 0;
        }
        [Symbol.iterator]() {
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
        add(item) {
            let index = this.list.indexOf(item);
            if (index != -1 && !this.includes(item)) {
                let items = [item];
                this[this.length++] = item;
                this.emit('add', items);
                this.emit('up', { add: items, addId: [index] });
            }
        }
        addArray(items) {
            let indexes = Array(items.length);
            for (let i = 0; i < items.length; i++) {
                let item = items[i], index = this.list.indexOf(item);
                if (!this.includes(item)) {
                    indexes[i] = index;
                    this[this.length + i] = item;
                }
                else
                    items.splice(i--, 1);
            }
            if (items.length) {
                this.length += items.length;
                this.emit('add', items);
                if (!this.noUpdate)
                    this.emit("up", { add: items, addId: indexes });
            }
            return indexes;
        }
        addRange(start, end) {
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
        remove(item) {
            let i = this.indexOf(item);
            if (i != -1)
                this.removeAt(i);
            return i != -1;
        }
        removeAt(index) {
            for (let i = index; i < this.length - 1; i++)
                this[i] = this[i + 1];
            let item = this[index], items = [item], id = [this.indexOf(item)];
            delete this[--this.length];
            this.emit('remove', items);
            if (!this.noUpdate)
                this.emit('up', { remove: items, remvId: id });
        }
        removeArray(items) {
            let indexes = Array(items.length);
            for (let i = 0; i < items.length; i++) {
                let item = items[i], indexInList = this.list.indexOf(item), index = this.indexOf(item);
                if (index != -1) {
                    indexes[i] = indexInList;
                    for (let i = index; i < this.length - 1; i++)
                        this[i] = this[i + 1];
                    delete this[this.length - 1];
                }
                else
                    items.splice(i--, 1);
            }
            this.length -= items.length;
            if (items.length) {
                this.emit('remove', items);
                if (!this.noUpdate)
                    this.emit('up', { remove: items, remvId: indexes });
            }
            return indexes;
        }
        removeRange(from, to) {
            return this.removeArray(this.list.slice(from, to));
        }
        set(add) {
            if ((!add || !add.length) && !this.length)
                return;
            this.noUpdate = true;
            let remove = this.list.slice(), remvId = this.removeArray(remove), addId = add ? this.addArray(add) : [];
            this.noUpdate = false;
            this.emit('up', {
                remove, remvId,
                add, addId
            });
            return this;
        }
        invert() {
            this.set(this.list.filter(i => !this.includes(i)));
            return this;
        }
        setRange(start, end) {
            this.set(this.list.slice(start, end));
        }
        indexOf(item) {
            for (let i = 0; i < this.length; i++)
                if (item === this[i])
                    return i;
            return -1;
        }
        includes(item) {
            for (let i = 0; i < this.length; i++)
                if (item === this[i])
                    return true;
            return false;
        }
        toJSON() {
            throw "not implemented";
        }
        map(callbackfn) {
            var r = [];
            for (let i = 0; i < this.length; i++)
                r.push(callbackfn(this[i], i, this));
            return r;
        }
        forEach(callbackfn) {
            for (let i = 0; i < this.length; i++)
                if (callbackfn(this[i], i) === false)
                    return;
        }
        indexes() {
            for (var r = Array(this.length), i = 0; i < this.length; i++)
                r[i] = this.list.indexOf(this[i]);
            return r;
        }
        keys() {
            for (var key = this.list.key, r = [], i = 0; i < this.length; i++)
                r.push(this[i][key]);
            return r;
        }
        values() {
            for (var r = [], i = 0; i < this.length; i++)
                r.push(this[i]);
            return r;
        }
    }
    class L extends Array {
        constructor(array, opts = {}) {
            super();
            this.g = {};
            this.__eh = {};
            this.key = opts.key;
            this.childKey = opts.child;
            this.sorts = opts.sorts;
            this.parse = opts.parse || opts.converter;
            if (opts.g)
                opts.g.forEach(this.addGroup, this);
            if (array)
                this.put(0, ...array);
        }
        static distinct() {
            return function (item) {
                if (this.indexOf(item) == -1)
                    return item;
            };
        }
        addGroup(key) {
            var t = this.g[key] = new Group();
            t.list = this;
            t.key = key;
        }
        put(start, ...values) {
            if (this.parse)
                for (let i = 0; i < values.length; i++) {
                    let t = this.parse.call(this, values[i], i + start);
                    if (t === undefined)
                        values.splice(i--, 1);
                    else
                        values[i] = t;
                }
            if (!values.length)
                return;
            let length = values.length, oldLength = this.length;
            this.length += length;
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
            this.emit('insert', values);
            if (!this.noupdate)
                this.emit('update', {
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
            for (let key in this.g) {
                this.g[key].removeArray(Array.from(removed));
            }
            if (this.tags)
                for (let key in this.tags) {
                    let tag = this.tags[key];
                    if (tag.index >= (start + length))
                        tag.index -= length;
                    else if (tag.index >= start) {
                        this.setTag(key, tag.replace ?
                            this[Math.min(tag.index, this.length - 1)] :
                            null, tag.replace);
                    }
                }
            this.emit('remove', removed);
            if (!this.noupdate)
                this.emit('update', { tp: 'remove', start, items: removed });
            return removed;
        }
        splice(start, deleteCount, ...values) {
            var result = this.removeAt(start, deleteCount);
            this.put(start, ...values);
            return result;
        }
        set(values) {
            if (!this.length && (!values || !values.length))
                return;
            this.noupdate = true;
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
            this.noupdate = false;
            this.emit('update', { tp: 'set', items: this, removed });
            return this;
        }
        sort(compareFn) {
            throw "not implemented";
            super.sort(compareFn);
            return this;
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
        remove(item) {
            let i = this.itemIndex(item);
            if (i >= 0)
                this.removeAt(i);
            return i >= 0;
        }
        place(item, newIndex) {
            var oldIndex = this.itemIndex(item);
            item = this[oldIndex];
            this.removeAt(oldIndex);
            this.put(newIndex, item);
            this.emit('update');
            return this;
        }
        reload(item) {
            let index = this.itemIndex(item), t = this[index];
            this.removeAt(index);
            this.put(index, t);
        }
        reloadAll() {
            this.set(this.slice());
        }
        copy(a, b) {
            if (typeof a == "function")
                a = new L(this.map(b = a));
            else
                a.set(this.map(b));
            this.on('update', e => {
                switch (e.tp) {
                    case 'insert':
                        a.put(e.start, ...e.items.map((v, i) => b(v, e.start + i)));
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
        tryPush(item) {
            let k = item[this.key];
            if (this.byKey(k))
                this.edit({ item: k, props: item });
            else
                this.push(item);
        }
        edit(item) {
            let index = this.itemIndex(item.item);
            if (index !== -1) {
                item.item = Object.assign(item.item = this[index], item.props);
                this.emit('edit', [item]);
                this.emit('update', null);
            }
            return this;
        }
        editItems(...items) {
            let a;
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
        get(id) {
            for (let i = 0; i < this.length; i++) {
                let value = this[i];
                if (value[this.key] == id)
                    return value;
            }
            return undefined;
        }
        has(id) {
            for (let i = 0; i < this.length; i++) {
                if (this[i][this.key] === id)
                    return true;
            }
            return false;
        }
        itemIndex(arg, fromIndex) {
            if (this.key)
                for (let i = fromIndex || 0, l = this.length; i < l; i++) {
                    let value = this[i];
                    if (value === arg || value[this.key] == arg)
                        return i;
                }
            else
                for (let i = fromIndex || 0, l = this.length; i < l; i++) {
                    let value = this[i];
                    if (value === arg)
                        return i;
                }
            return -1;
        }
        byKey(value, key = this.key) {
            return super.find(v => v[key] == value);
        }
        indexByKey(value, key = this.key) {
            return super.findIndex(v => v[key] == value);
        }
        map(callbackfn, thisArg) {
            var r = Array(this.length);
            if (!thisArg)
                thisArg = this;
            for (let i = 0; i < r.length; i++)
                r[i] = callbackfn.call(thisArg, this[i], i, this);
            return r;
        }
        filter(callbackfn, thisArg) {
            let r = [];
            for (let i = 0; i < this.length; i++)
                if (callbackfn.call(thisArg, this[i], i, this))
                    r.push(this[i]);
            return r;
        }
        on(event, callback) {
            return ETP.on.call(this, event, callback);
        }
        off(event, callback) {
            return ETP.off.call(this, event, callback);
        }
        emit(event, data) {
            if (this.slip)
                return true;
            return ETP.emit.call(this, event, data);
        }
        tag(name) { var _a; return (_a = this.getTag(name)) === null || _a === void 0 ? void 0 : _a.value; }
        getTag(name) {
            return (this.tags || (this.tags = {}))[name];
        }
        setTag(key, value, replace) {
            let index = null, oldValue = this.getTag(key), newValue;
            if (value == null) {
                if (!oldValue)
                    return;
                delete this.tags[key];
            }
            else {
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
            this.emit(('tag:' + key), value);
            this.emit("update", {
                tp: "tag",
                tag: key,
                newI: index,
                oldI: oldValue ? oldValue.index : null
            });
            return this;
        }
        ontag(key, callback) {
            return this.on(('tag:' + key), callback);
        }
        focus(value, shift, ctrl, key = on) {
            let group = this.g[key], tag = this.getTag(key), lastIndex = tag ? tag.index : -1, newIndex = this.itemIndex(value);
            if (lastIndex == newIndex && !ctrl)
                return;
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
                    else
                        group.removeAt(i);
                }
            }
        }
        focusTo(relativeValue, shift, ctrl, key = on, revert = true) {
            let l = this.length, tag = this.getTag(key);
            if (!l || !relativeValue)
                return;
            if (tag) {
                relativeValue += tag.index;
                if (revert && false)
                    if (relativeValue < 0) {
                        var old = this.length + relativeValue;
                        relativeValue = 0;
                    }
                    else if (relativeValue >= l) {
                        var old = relativeValue - l;
                        relativeValue = l - 1;
                    }
                if (relativeValue < 0)
                    relativeValue = 0;
                else if (relativeValue >= l)
                    relativeValue = l - 1;
                this.focus(this[relativeValue], shift, ctrl, key);
                if (revert && false) {
                    this.setTag(key, this[old]);
                    var group = this.g[key];
                    if (group)
                        group.add(this[old]);
                }
            }
            else {
                this.setTag(key, this[0]);
                let g = this.g[key];
                if (g)
                    g.set([this[0]]);
            }
        }
        focusToBegin(shift, ctrl, key = on) {
            var tag = this.getTag(key);
            if (tag)
                this.focusTo(-tag.index, shift, ctrl);
        }
        focusToEnd(shift, ctrl, key = on) {
            var tag = this.getTag(key);
            if (tag)
                this.focusTo(this.length - tag.index, shift, ctrl);
        }
        focusAll(key = on) {
            if (this.length) {
                if (!this.getTag(key))
                    this.setTag(key, this[0]);
                var group = this.g[key];
                if (group)
                    group.addAll();
            }
        }
        focusNone(key = on) {
            this.setTag(key);
            var group = this.g[key];
            if (group)
                group.set();
        }
        focused(key = on) {
            let group = this.g[key], tag;
            return group ? group.values() : ((tag = this.getTag(key)) ? [tag.value] : []);
        }
        hasFocus(value, key = on) {
            let group = this.g[key], tag;
            return group ?
                group.indexOf(value) != -1 :
                !!(tag = this.getTag(key)) && tag.value == value;
        }
        onfocus(listener, key = on) {
            if (arguments.length) {
                var group = this.g[key];
                if (group)
                    group.on('up', () => {
                        let t = this.getTag(key);
                        listener.call(this, t && t.value, group);
                    });
                else
                    this.ontag(key, listener);
            }
            else {
                if (group)
                    group.emit('up');
                else
                    this.emit('tag:' + key, this.getTag(key));
            }
            return this;
        }
        unbind(s) {
            let b = this.binds;
            if (b) {
                let i = b.findIndex(b => b[0] == s);
                if (i != -1)
                    b.splice(i, 1);
            }
            return this;
        }
        bind(s, opts = {}) {
            let bond = typeof opts == "function" ? { insert: opts } : opts;
            let empty = (value) => {
                if (bond.empty) {
                    let v = bond.empty.call(this, value);
                    if (v)
                        s.set(value);
                }
            }, insert = (items, start) => {
                for (let i = 0; i < items.length; i++) {
                    let item = items[i], v = bond.insert ? bond.insert.call(this, item, start + i, s) : item;
                    if (v)
                        s.place(start + i, v);
                }
            }, remove = (items, start) => {
                for (let i = 0; i < items.length; i++) {
                    if (bond.remove ? bond.remove.call(this, items[i], start + i, s) : true)
                        s.removeChild(start + i);
                }
            }, fn = (opts) => {
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
            this.on('update', fn);
            if (bond.groups)
                if (typeof bond.groups == "function")
                    for (let g in this.g)
                        this.bindGroup(s, g, bond.groups);
                else
                    for (let g in bond.groups)
                        this.bindGroup(s, g, bond.groups[g]);
            if (this.binds)
                this.binds.push([s, fn]);
            else
                this.binds = [[s, fn]];
            insert(this, 0);
            return s;
        }
        bindGroup(s, key, bond) {
            let g = this.g[key];
            if (!g)
                throw `group '${key}' not found`;
            let call = (items, indexes, state) => {
                for (let i = 0; i < items.length; i++) {
                    let id = indexes[i];
                    bond.call(this, s.child(id), state, key, items[i], id, s);
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
        bindToE(e, prop) {
            e.dt[prop] = this;
            let reloading;
            this.on('update', () => {
                if (reloading) {
                    reloading = false;
                }
                else {
                    reloading = true;
                    e.update([prop]);
                }
            });
            e.on('update', (ev) => {
                if (reloading) {
                    reloading = false;
                }
                else if (prop in ev) {
                    let value = ev[prop];
                    reloading = true;
                    e.dt[prop] = this.set(value);
                }
            });
            return this;
        }
        static get [Symbol.species]() { return Array; }
    }
    l_1.L = L;
})(l || (l = {}));
module.exports = l;
//# sourceMappingURL=orray.js.map