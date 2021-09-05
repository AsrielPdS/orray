"use strict";
const inutil_1 = require("inutil");
function l(array, options) {
    if (array && !inutil_1.isA(array)) {
        options = array;
        array = null;
    }
    if (inutil_1.is(array, l.L)) {
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
    const { prototype: ETP } = inutil_1.ET;
    const on = "on";
    class Group extends inutil_1.ET {
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
                this.trigger('add', items);
                this.trigger('up', { add: items, addId: [index] });
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
            if (items.l) {
                this.length += items.length;
                this.trigger('add', items);
                if (!this.noUpdate)
                    this.trigger("up", { add: items, addId: indexes });
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
            this.trigger('remove', items);
            if (!this.noUpdate)
                this.trigger('up', { remove: items, remvId: id });
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
                this.trigger('remove', items);
                if (!this.noUpdate)
                    this.trigger('up', { remove: items, remvId: indexes });
            }
            return indexes;
        }
        removeRange(from, to) {
            return this.removeArray(this.list.slice(from, to));
        }
        set(add) {
            if ((!add || !add.l) && !this.length)
                return;
            this.noUpdate = true;
            let remove = this.list.slice(), remvId = this.removeArray(remove), addId = add ? this.addArray(add) : [];
            this.noUpdate = false;
            this.trigger('up', {
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
        constructor(array, options = {}) {
            super();
            this.g = {};
            this.__eh = {};
            this.key = options.key;
            this.childKey = options.child;
            this.sorts = options.sorts;
            this.converter = options.converter;
            if (options.g)
                options.g.forEach(this.addGroup, this);
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
            if (this.converter)
                for (let i = 0; i < values.length; i++) {
                    let t = this.converter.call(this, values[i], i + start);
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
            this.trigger('insert', values);
            if (!this.noupdate)
                this.trigger('update', {
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
            this.trigger('remove', removed);
            if (!this.noupdate)
                this.trigger('update', { tp: 'remove', start, items: removed });
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
                            opt.vars.a = a;
                            opt.vars.b = b;
                            return sort.calc(opt);
                        });
                    }
                }
                this.put(0, ...values);
            }
            this.noupdate = false;
            this.trigger('update', { tp: 'set', items: values, removed });
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
                return this.removeAt(this.length - 1).a;
        }
        shift() {
            return this.removeAt(0).a;
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
            this.trigger('update');
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
            if (inutil_1.isF(a)) {
                b = a;
                a = new L(this.map(b));
            }
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
                this.trigger('edit', [item]);
                this.trigger('update', null);
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
                this.trigger('edit', null);
                this.trigger('update', null);
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
            return super.byKey(value, key);
        }
        indexByKey(value, key = this.key) {
            return super.indexByKey(value, key);
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
        trigger(event, data) {
            if (this.slip)
                return true;
            return ETP.trigger.call(this, event, data);
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
            this.trigger(('tag:' + key), value);
            this.trigger("update", {
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
                this.setTag(key, this.a);
                let g = this.g[key];
                if (g)
                    g.set([this.a]);
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
                    this.setTag(key, this.a);
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
                    group.trigger('up');
                else
                    this.trigger('tag:' + key, this.getTag(key));
            }
            return this;
        }
        unbind(s) {
            let b = this.binds;
            if (b) {
                let i = b.findIndex(b => b.a == s);
                if (i != -1)
                    b.splice(i, 1);
            }
            return this;
        }
        bind(s, opts = {}) {
            let bond = inutil_1.isF(opts) ? { insert: opts } : opts;
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
                        else if (inutil_1.isF(bond.clear))
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
                if (inutil_1.isF(bond.groups))
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
                throw inutil_1.notF(key, "group");
            let call = (items, indexes, state) => {
                for (let i = 0; i < items.l; i++) {
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
                else if (ev.has(prop)) {
                    let value = ev.values[prop];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsbUNBQXFFO0FBTXJFLFNBQVMsQ0FBQyxDQUFpQixLQUFnRCxFQUFFLE9BQXVCO0lBQ2xHLElBQUksS0FBSyxJQUFJLENBQUMsWUFBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3hCLE9BQU8sR0FBRyxLQUFLLENBQUE7UUFDZixLQUFLLEdBQUcsSUFBSSxDQUFDO0tBQ2Q7SUFDRCxJQUFJLFdBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ2xCLElBQUksT0FBTyxFQUFFO1lBQ1gsSUFBSSxPQUFPLENBQUMsQ0FBQztnQkFDWCxLQUFLLElBQUksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDO29CQUNyQixJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDakIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLE9BQU8sQ0FBQyxLQUFLO2dCQUNmLE1BQU0saUJBQWlCLENBQUM7WUFDMUIsSUFBSSxPQUFPLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRztnQkFDdEQsTUFBTSxvQkFBb0IsQ0FBQztTQUM5QjtRQUNELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7O1FBQU0sT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQVksS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFFRCxXQUFPLEdBQUM7SUFJTixNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFHLFdBQUUsQ0FBQztJQUc5QixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFjaEIsTUFBTSxLQUFlLFNBQVEsV0FBOEM7UUFBM0U7O1lBQ0UsV0FBTSxHQUFXLENBQUMs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