"use strict";
const inutil_1 = require("inutil");
function l(array, options) {
    if (array && !(0, inutil_1.isA)(array)) {
        options = array;
        array = null;
    }
    if ((0, inutil_1.is)(array, l.L)) {
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
            if ((0, inutil_1.isF)(a)) {
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
            let bond = (0, inutil_1.isF)(opts) ? { insert: opts } : opts;
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
                        else if ((0, inutil_1.isF)(bond.clear))
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
                if ((0, inutil_1.isF)(bond.groups))
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
                throw (0, inutil_1.notF)(key, "group");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsbUNBQXFFO0FBTXJFLFNBQVMsQ0FBQyxDQUFpQixLQUFnRCxFQUFFLE9BQXVCO0lBQ2xHLElBQUksS0FBSyxJQUFJLENBQUMsSUFBQSxZQUFHLEVBQUMsS0FBSyxDQUFDLEVBQUU7UUFDeEIsT0FBTyxHQUFHLEtBQUssQ0FBQTtRQUNmLEtBQUssR0FBRyxJQUFJLENBQUM7S0FDZDtJQUNELElBQUksSUFBQSxXQUFFLEVBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNsQixJQUFJLE9BQU8sRUFBRTtZQUNYLElBQUksT0FBTyxDQUFDLENBQUM7Z0JBQ1gsS0FBSyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQztvQkFDckIsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQ2pCLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsSUFBSSxPQUFPLENBQUMsS0FBSztnQkFDZixNQUFNLGlCQUFpQixDQUFDO1lBQzFCLElBQUksT0FBTyxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUc7Z0JBQ3RELE1BQU0sb0JBQW9CLENBQUM7U0FDOUI7UUFDRCxPQUFPLEtBQUssQ0FBQztLQUNkOztRQUFNLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFZLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQsV0FBTyxHQUFDO0lBSU4sTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsR0FBRyxXQUFFLENBQUM7SUFHOUIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBY2hCLE1BQU0sS0FBZSxTQUFRLFdBQThDO1FBQTNFOztZQUNFLFdBQU0s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