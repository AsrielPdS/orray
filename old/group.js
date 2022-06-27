"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
const handler_1 = require("handler");
;
class Group extends Array {
    eh = {};
    slip;
    /**no update */
    nu;
    l;
    push(...items) {
        let indexes = Array(items.length);
        for (let i = 0; i < items.length; i++) {
            let item = items[i], index = this.l.indexOf(item);
            if (index != -1 && !this.includes(item)) {
                indexes[i] = index;
                this.push(item);
            }
            else
                items.splice(i--, 1);
        }
        if (items.length) {
            // this.length += items.length;
            (0, handler_1.emit)(this, 'push', items);
            if (!this.nu)
                (0, handler_1.emit)(this, "set", { add: items, addId: indexes });
        }
        return this.length;
    }
    pushRange(start, end) {
        return this.push(...this.l.slice(start, end));
    }
    pushAll() {
        return this.push(...this.l.slice());
    }
    remove(...items) {
        let indexes = Array(items.length);
        for (let i = 0; i < items.length; i++) {
            let item = items[i], indexInList = this.l.indexOf(item), index = this.indexOf(item);
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
            (0, handler_1.emit)(this, 'remove', items);
            if (!this.nu)
                (0, handler_1.emit)(this, 'set', { remove: items, remvId: indexes });
        }
        return indexes;
    }
    removeAt(index, count = 0) {
        // for (let i = index; i < this.length - 1; i++)
        //   this[i] = this[i + 1];
        let item = this[index], items = [item];
        this.splice(index, count);
        // delete this[--this.length];
        (0, handler_1.emit)(this, 'remove', items);
        if (!this.nu)
            (0, handler_1.emit)(this, 'set', { remove: items, remvId: [this.indexOf(item)] });
    }
    clear() {
        return this.remove(...this);
    }
    removeRange(from, to) {
        return this.remove(...this.l.slice(from, to));
    }
    set(add) {
        if (!add.length && !this.length)
            return;
        this.nu = true;
        let r = this.slice(), remvId = this.clear(), addId = this.push(...add);
        this.nu = false;
        (0, handler_1.emit)(this, 'set', {
            remove: r, remvId,
            add, addId
        });
        return this;
    }
    invert() {
        this.set(this.l.filter(i => !this.includes(i)));
        return this;
    }
    setRange(start, end) {
        this.set(this.l.slice(start, end));
    }
    indexes() {
        for (var r = Array(this.length), i = 0; i < this.length; i++)
            r[i] = this.l.indexOf(this[i]);
        return r;
    }
    keyField() {
        for (var key = this.l.key, r = [], i = 0; i < this.length; i++)
            r.push(this[i][key]);
        return r;
    }
    /**on update */
    on(callback) {
        return (0, handler_1.on)(this, "set", callback);
    }
    reload(v, i = this.l.indexOf(v)) {
        (0, handler_1.emit)(this, "set", { add: [v], addId: [i] });
        return this;
    }
}
exports.Group = Group;
